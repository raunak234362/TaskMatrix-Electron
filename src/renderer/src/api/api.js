import axios from 'axios'
import { getApiUrl } from './backendConfig'

console.log('API Base URL Initializing...')

const instance = axios.create()

instance.interceptors.request.use((config) => {
  // Dynamically set baseURL if not already set or to ensure it uses the latest selected backend
  config.baseURL = getApiUrl()

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
