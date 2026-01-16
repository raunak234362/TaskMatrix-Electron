import axios from 'axios'

const baseURL =
  import.meta.env.VITE_BASE_URL || 'https://project-station.whiteboardtec.com:5160/v1/'

console.log('API Base URL:', baseURL)

const instance = axios.create({
  baseURL: baseURL
})
instance.interceptors.request.use((config) => {
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
