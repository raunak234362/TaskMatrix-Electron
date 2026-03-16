const PRIMARY_URL =
  import.meta.env.VITE_BASE_URL?.replace('/v1/', '') ||
  'https://project-station.whiteboardtec.com:5160'

let activeBaseURL = PRIMARY_URL

export const getBaseURL = () => activeBaseURL

export const checkBackendHealth = async () => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2500) // 2.5s timeout for quick check

    console.log('Checking primary backend health:', PRIMARY_URL)
    // We try to fetch the base URL. Even if it returns 404, it means the server is REACHABLE.
    // A network error (DNS, Connection Refused, Timeout) will throw an exception.
    await fetch(PRIMARY_URL, {
      method: 'GET',
      mode: 'no-cors', // Use no-cors to avoid preflight for health check
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    console.log('Primary backend is reachable')
  } catch (error) {
    console.warn('Primary backend check failed:', error.message)
  }
}

export const getApiUrl = () => `${activeBaseURL}/v1/`
export const getSocketUrl = () => activeBaseURL
