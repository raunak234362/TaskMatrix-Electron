import axios from 'axios'
import { getApiUrl } from './backendConfig'

const instance = axios.create()

// Request interceptor to set the dynamic baseURL for every request
instance.interceptors.request.use((config) => {
  const currentBaseURL = getApiUrl()
  config.baseURL = currentBaseURL

  // Update defaults as well so any direct access to instance.defaults.baseURL is accurate
  instance.defaults.baseURL = currentBaseURL

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
