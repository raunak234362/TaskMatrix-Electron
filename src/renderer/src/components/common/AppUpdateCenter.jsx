import { useEffect, useRef, useState } from 'react'
import { Download, RefreshCw, X } from 'lucide-react'

const SETTINGS_KEY = 'taskmatrix-update-settings'
const DISMISSED_VERSION_KEY = 'taskmatrix-update-dismissed-version'
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

const getSettings = () => {
  try {
    const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return {
      autoCheck: savedSettings.autoCheck !== false,
      autoDownload: savedSettings.autoDownload === true
    }
  } catch {
    return { autoCheck: true, autoDownload: false }
  }
}

const AppUpdateCenter = () => {
  const [status, setStatus] = useState({
    status: 'idle',
    currentVersion: 'unknown',
    availableVersion: null,
    progress: 0,
    releaseNotes: '',
    checkedAt: null,
    error: null
  })
  const [settings, setSettings] = useState(getSettings)
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedVersion, setDismissedVersion] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_VERSION_KEY)
    } catch {
      return null
    }
  })
  const downloadRequestedVersion = useRef(null)

  useEffect(() => {
    if (!window.api?.onUpdateStatus) return undefined

    const unsubscribe = window.api.onUpdateStatus(setStatus)
    window.api
      .getUpdateStatus()
      .then(setStatus)
      .catch((error) => console.error('Unable to read update status:', error))

    if (settings.autoCheck) {
      window.api.checkForUpdates().catch((error) => {
        console.error('Unable to check for application updates:', error)
      })
    }

    const interval = settings.autoCheck
      ? window.setInterval(() => {
          window.api.checkForUpdates().catch((error) => {
            console.error('Unable to check for application updates:', error)
          })
        }, CHECK_INTERVAL_MS)
      : null

    return () => {
      unsubscribe()
      if (interval) window.clearInterval(interval)
    }
  }, [settings.autoCheck])

  useEffect(() => {
    if (
      status.availableVersion &&
      (status.status === 'available' || status.status === 'downloaded') &&
      status.availableVersion !== dismissedVersion
    ) {
      setIsOpen(true)
    }
  }, [dismissedVersion, status.availableVersion, status.status])

  useEffect(() => {
    if (
      settings.autoDownload &&
      status.status === 'available' &&
      status.availableVersion &&
      downloadRequestedVersion.current !== status.availableVersion
    ) {
      downloadRequestedVersion.current = status.availableVersion
      window.api.downloadUpdate().catch((error) => {
        console.error('Unable to download application update:', error)
      })
    }
  }, [settings.autoDownload, status.availableVersion, status.status])

  const saveSettings = (nextSettings) => {
    setSettings(nextSettings)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings))
    } catch (error) {
      console.error('Unable to save update preferences:', error)
    }
  }

  const dismissUpdate = () => {
    const version = status.availableVersion
    if (version) {
      setDismissedVersion(version)
      try {
        localStorage.setItem(DISMISSED_VERSION_KEY, version)
      } catch (error) {
        console.error('Unable to save dismissed update version:', error)
      }
    }
    setIsOpen(false)
  }

  const checkManually = async () => {
    setIsOpen(true)
    try {
      setStatus(await window.api.checkForUpdates())
    } catch (error) {
      console.error('Unable to check for application updates:', error)
    }
  }

  const download = async () => {
    downloadRequestedVersion.current = status.availableVersion
    try {
      setStatus(await window.api.downloadUpdate())
    } catch (error) {
      console.error('Unable to download application update:', error)
    }
  }

  const install = async () => {
    try {
      await window.api.installUpdate()
    } catch (error) {
      console.error('Unable to install application update:', error)
    }
  }

  const statusLabel = {
    checking: 'Checking for updates…',
    available: `Version ${status.availableVersion} is available`,
    downloading: `Downloading ${Math.round(status.progress || 0)}%`,
    downloaded: `Version ${status.availableVersion} is ready to install`,
    'up-to-date': 'You are up to date',
    manual: 'Updates are managed by your system package manager',
    unsupported: 'Automatic updates are unavailable',
    error: 'Update check failed'
  }[status.status] || `Version ${status.currentVersion}`

  return (
    <div className="fixed bottom-5 right-5 z-[10000]">
      {isOpen && (
        <section
          aria-label="Application updates"
          aria-live="polite"
          className="mb-3 w-[min(24rem,calc(100vw-2.5rem))] rounded-xl border border-gray-200 bg-white p-5 text-gray-800 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Application Updates</h2>
              <p className="mt-1 text-sm text-gray-600">{statusLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
              aria-label="Close update panel"
            >
              <X size={18} />
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500">Current version: {status.currentVersion}</p>
          {status.error && <p className="mt-3 text-sm text-amber-700">{status.error}</p>}
          {status.checkedAt && (
            <p className="mt-1 text-xs text-gray-500">
              Last checked: {new Date(status.checkedAt).toLocaleString()}
            </p>
          )}
          {status.status === 'downloading' && (
            <div className="mt-4">
              <div
                className="h-2 overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-label="Update download progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(status.progress || 0)}
              >
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{ width: `${Math.round(status.progress || 0)}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-gray-500">
                {Math.round(status.progress || 0)}%
              </p>
            </div>
          )}

          {status.releaseNotes && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-medium text-green-700">Release notes</summary>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap font-sans text-xs text-gray-600">
                {status.releaseNotes}
              </pre>
            </details>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {status.status === 'available' && (
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-2 rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                <Download size={15} />
                Update now
              </button>
            )}
            {status.status === 'downloaded' && (
              <button
                type="button"
                onClick={install}
                className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Restart and install
              </button>
            )}
            {['idle', 'up-to-date', 'error', 'unsupported'].includes(status.status) && (
              <button
                type="button"
                onClick={checkManually}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                <RefreshCw size={15} />
                Check for updates
              </button>
            )}
            {['available', 'downloaded'].includes(status.status) && (
              <button
                type="button"
                onClick={dismissUpdate}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Later
              </button>
            )}
          </div>

          {status.status !== 'manual' && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={settings.autoCheck}
                  onChange={(event) =>
                    saveSettings({ ...settings, autoCheck: event.target.checked })
                  }
                />
                Automatically check every 6 hours
              </label>
              <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={settings.autoDownload}
                  onChange={(event) =>
                    saveSettings({ ...settings, autoDownload: event.target.checked })
                  }
                />
                Automatically download available updates
              </label>
            </div>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-full bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-green-800"
        aria-expanded={isOpen}
      >
        {statusLabel}
      </button>
    </div>
  )
}

export default AppUpdateCenter
