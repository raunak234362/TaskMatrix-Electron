import axios from 'axios'
import { getApiUrl } from './backendConfig'

const instance = axios.create()

// Request interceptor to set the dynamic baseURL for every request
instance.interceptors.request.use((config) => {
  // Use getApiUrl() directly to hit the backend specified in the .env file
  const currentBaseURL = getApiUrl() || '/v1/'
  config.baseURL = currentBaseURL

  // Update defaults as well so any direct access to instance.defaults.baseURL is accurate
  instance.defaults.baseURL = currentBaseURL

  // Enforce uppercase username globally for all outgoing API request payloads
  if (config.data) {
    if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
      if (config.data.username && typeof config.data.username === 'string') {
        config.data.username = config.data.username.trim().toUpperCase()
      }
    } else if (typeof config.data === 'string') {
      try {
        const parsed = JSON.parse(config.data)
        if (parsed && parsed.username && typeof parsed.username === 'string') {
          parsed.username = parsed.username.trim().toUpperCase()
          config.data = JSON.stringify(parsed)
        }
      } catch (e) {
        // Ignored if not valid JSON
      }
    }
  }

  console.log(`[API Request] -> ${config.method.toUpperCase()} ${config.baseURL}${config.url}`)

  // Ensure headers exists
  config.headers = config.headers ?? {}

  // Add token if available
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default instance
