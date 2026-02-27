/* eslint-disable prettier/prettier */
import { app, shell, BrowserWindow, Notification, ipcMain, session } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

// Disable SSL certificate errors
app.commandLine.appendSwitch('ignore-certificate-errors')

// Disable hardware acceleration on all platforms for better compatibility
app.disableHardwareAcceleration()

// Fix: Redirect GPU/shader disk cache to a writable temp directory to avoid
// "Unable to move/create cache: Access is denied (0x5)" errors on Windows.
const gpuCachePath = join(tmpdir(), 'taskmatrix-gpu-cache')
app.commandLine.appendSwitch('gpu-disk-cache-dir', gpuCachePath)
app.commandLine.appendSwitch('disk-cache-dir', join(tmpdir(), 'taskmatrix-disk-cache'))

// Additional flags for better Linux support
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-dev-shm-usage')

// CRITICAL for Windows: Set App User Model ID BEFORE app.whenReady()
// Without this, Windows 10/11 will NOT show notifications in the Action Center.
if (process.platform === 'win32') {
  app.setAppUserModelId('com.taskmatrix.wbt')
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: is.dev ? false : true // Disable web security only in development
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer based on electron-vite cli.
  // Load the remote URL for development or the local HTML file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── DESKTOP NOTIFICATION HANDLER ───────────────────────────────────────────
// Uses ipcMain.handle so the renderer can use invoke() and catch errors.
// The handler is registered here (outside whenReady) so it is always ready.
ipcMain.handle('show-notification', async (event, data) => {
  try {
    console.log('🔔 [main] show-notification IPC received:', data)

    const title = data?.title || 'TaskMatrix'
    const body = data?.body || ''

    if (!Notification.isSupported()) {
      console.warn('[main] Notifications not supported on this platform')
      return { success: false, reason: 'not_supported' }
    }

    const notification = new Notification({
      title,
      body,
      icon: join(__dirname, '../../resources/icon.png'),
      silent: false
    })

    // When user clicks the desktop notification → restore and focus the app
    notification.on('click', () => {
      console.log('🔔 [main] Notification clicked — restoring window')
      const allWindows = BrowserWindow.getAllWindows()
      if (allWindows.length > 0) {
        const win = allWindows[0]
        if (win.isMinimized()) win.restore()
        win.show()
        win.focus()
      }
    })

    notification.on('show', () => {
      console.log('✅ [main] Notification shown successfully')
    })

    notification.on('failed', (e, err) => {
      console.error('❌ [main] Notification failed:', err)
    })

    notification.show()
    return { success: true }
  } catch (err) {
    console.error('❌ [main] show-notification error:', err)
    return { success: false, reason: err.message }
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for Windows — must match the ID set before app.whenReady()
  electronApp.setAppUserModelId('com.taskmatrix.wbt')

  // Test: fire a notification immediately on startup to confirm desktop notifications work
  if (Notification.isSupported()) {
    setTimeout(() => {
      const testNotif = new Notification({
        title: 'TaskMatrix — Notifications Active ✅',
        body: 'Desktop notifications are working. You will receive alerts even when minimized.',
        icon: join(__dirname, '../../resources/icon.png'),
        silent: true
      })
      testNotif.show()
    }, 3000) // delay 3s so window is fully loaded
  }
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)

    // Ensure DevTools can be opened in production
    window.webContents.on('before-input-event', (event, input) => {
      if (
        input.key === 'F12' ||
        (input.control && input.shift && input.key.toLowerCase() === 'i')
      ) {
        window.webContents.toggleDevTools()
      }
    })

    // Add "Inspect Element" to context menu
    window.webContents.on('context-menu', (event, params) => {
      const { Menu, MenuItem } = require('electron')
      const menu = new Menu()
      menu.append(
        new MenuItem({
          label: 'Inspect Element',
          click: () => {
            window.webContents.inspectElement(params.x, params.y)
          }
        })
      )
      menu.popup()
    })
  })

  // ✅ Fix: Disable restrictive CSP for development (prevents “blocked:csp”)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const cspValue = is.dev
      ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
      : "default-src 'self'; script-src 'self'; connect-src 'self' https://project-station.whiteboardtec.com:5160 wss://project-station.whiteboardtec.com:5160; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; frame-src 'none'; object-src 'none';"

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspValue]
      }
    })
  })

  if (Notification.isSupported()) {
    console.log('Notifications are supported')
  }
  autoUpdater.checkForUpdatesAndNotify()

  // IPC test
  // ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Configure logging
log.transports.file.level = 'info'
autoUpdater.logger = log

// Auto-update event listeners
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...')
})

autoUpdater.on('update-available', (info) => {
  log.info('Update available.', info)
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('update-available', info)
  })
})

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.', info)
})

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater. ' + err)
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
  log.info(log_message)
})

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded', info)
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('update-downloaded', info)
  })
})

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall()
})
