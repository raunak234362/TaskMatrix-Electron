/* eslint-disable prettier/prettier */
/**
 * Floating Timer Widget — Main-process module
 *
 * Responsibilities:
 *  - Create / show / close a frameless, always-on-top BrowserWindow
 *  - Persist last position to <userData>/timer-widget-pos.json
 *  - Clamp saved position to the visible area of any connected display
 *  - Register all IPC channels for start / pause / resume / stop / update-task
 *  - Forward widget-button clicks back to the main window (onWidgetAction)
 */

import { BrowserWindow, ipcMain, screen, app } from 'electron'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { is } from '@electron-toolkit/utils'

// ─── Position persistence ───────────────────────────────────────────────────

const POS_FILE = join(app.getPath('userData'), 'timer-widget-pos.json')
let savePosTimer = null

function loadSavedPosition() {
  try {
    if (existsSync(POS_FILE)) {
      return JSON.parse(readFileSync(POS_FILE, 'utf8'))
    }
  } catch (_) { /* ignore */ }
  return null
}

async function savePosition(x, y) {
  try {
    await writeFile(POS_FILE, JSON.stringify({ x, y }), 'utf8')
  } catch (_) { /* ignore */ }
}

function scheduleSavePosition(x, y) {
  if (savePosTimer) clearTimeout(savePosTimer)
  savePosTimer = setTimeout(() => {
    savePosTimer = null
    savePosition(x, y)
  }, 300)
}

/** Clamp {x,y} so the widget is fully inside one of the available displays. */
function clampToDisplays(x, y, width, height) {
  const displays = screen.getAllDisplays()
  for (const display of displays) {
    const { x: dx, y: dy, width: dw, height: dh } = display.workArea
    if (x >= dx && x < dx + dw && y >= dy && y < dy + dh) {
      // Window origin is on this display — clamp it
      return {
        x: Math.min(Math.max(x, dx), dx + dw - width),
        y: Math.min(Math.max(y, dy), dy + dh - height)
      }
    }
  }
  // Falls outside all displays → reset to bottom-right of primary
  return getBottomRightPosition(width, height)
}

function getInitialPosition(width, height) {
  const saved = loadSavedPosition()
  if (saved) {
    return clampToDisplays(saved.x, saved.y, width, height)
  }
  return getBottomRightPosition(width, height)
}

function getBottomRightPosition(width, height) {
  const { x, y, width: dw, height: dh } = screen.getPrimaryDisplay().workArea
  return { x: x + dw - width - 16, y: y + dh - height - 16 }
}

function moveTimerWidgetToBottomRight() {
  if (!timerWindow || timerWindow.isDestroyed()) return
  const { x, y } = getBottomRightPosition(WIDGET_WIDTH, WIDGET_HEIGHT)
  timerWindow.setPosition(x, y)
}

// ─── Widget window ───────────────────────────────────────────────────────────

const WIDGET_WIDTH  = 240
const WIDGET_HEIGHT = 110

let timerWindow = null
let mainWindowRef = null  // set by setMainWindow()
let currentTaskData = null
let widgetReady = false   // true once did-finish-load has fired

export function setMainWindow(win) {
  mainWindowRef = win
}

function sendToMain(channel, payload) {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send(channel, payload)
  }
}

function sendToWidget(channel, payload) {
  if (timerWindow && !timerWindow.isDestroyed() && widgetReady) {
    timerWindow.webContents.send(channel, payload)
  }
}

function createTimerWidget() {
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.show()
    return
  }

  widgetReady = false
  const { x, y } = getInitialPosition(WIDGET_WIDTH, WIDGET_HEIGHT)

  timerWindow = new BrowserWindow({
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    x,
    y,
    frame: false,
    backgroundColor: '#ffffff',
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    // Keep above normal windows without using 'screen-saver' level so OS compositor DirectFlip/MPO stays intact
    webPreferences: {
      preload: join(__dirname, '../preload/timerPreload.js'),
      contextIsolation: true,
      sandbox: false,  // needed to reach preload without node
      nodeIntegration: false
    }
  })

  // Keep widget above normal windows (e.g. Tekla) without breaking DWM hardware scanout
  timerWindow.setAlwaysOnTop(true, 'floating')
  // macOS: visible on every Space, including full-screen spaces
  timerWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // In dev mode load the widget HTML from the resources folder via file://
    timerWindow.loadFile(join(__dirname, '../../resources/timer-widget.html'))
  } else {
    timerWindow.loadFile(join(__dirname, '../../resources/timer-widget.html'))
  }

  timerWindow.webContents.once('did-finish-load', () => {
    widgetReady = true
    if (currentTaskData) {
      timerWindow.webContents.send('widget:init-timer', currentTaskData)
    }
  })

  // Persist position when the user drags the widget (debounced)
  timerWindow.on('moved', () => {
    if (!timerWindow || timerWindow.isDestroyed()) return
    const [wx, wy] = timerWindow.getPosition()
    scheduleSavePosition(wx, wy)
  })

  timerWindow.on('closed', () => {
    if (savePosTimer) {
      clearTimeout(savePosTimer)
      savePosTimer = null
    }
    timerWindow = null
    widgetReady = false
  })
}

// ─── IPC handlers ────────────────────────────────────────────────────────────

/** Start (or replace) the timer for a task */
ipcMain.on('timer:start', (_event, taskData) => {
  currentTaskData = taskData

  if (timerWindow && !timerWindow.isDestroyed()) {
    moveTimerWidgetToBottomRight()
    // Window already exists and is loaded — send immediately
    if (widgetReady) {
      timerWindow.webContents.send('widget:init-timer', taskData)
      timerWindow.show()
    } else {
      // Still loading — will be sent in did-finish-load
      timerWindow.show()
    }
  } else {
    createTimerWidget()
    moveTimerWidgetToBottomRight()
  }
})

ipcMain.on('timer:pause', () => {
  sendToWidget('widget:command', { command: 'pause' })
})

ipcMain.on('timer:resume', () => {
  sendToWidget('widget:command', { command: 'resume' })
})

ipcMain.on('timer:stop', () => {
  currentTaskData = null
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.close()
  }
})

ipcMain.on('timer:update-task', (_event, taskData) => {
  currentTaskData = taskData
  sendToWidget('widget:init-timer', taskData)
})

// ─── Widget → main window relay ──────────────────────────────────────────────

/**
 * The widget sends these when the user clicks Pause / Resume / Stop inside it.
 * We relay them to the main renderer so it can call the backend.
 */
ipcMain.on('widget:action', (_event, payload) => {
  // payload: { action: 'pause' | 'resume' | 'stop' }
  sendToMain('main:widget-action', {
    ...payload,
    taskId: currentTaskData?.id,
    taskType: currentTaskData?.taskType || 'TASK'
  })
})

// ─── Close widget when the app quits ─────────────────────────────────────────

export function closeTimerWidget() {
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.destroy()
    timerWindow = null
    widgetReady = false
  }
}
