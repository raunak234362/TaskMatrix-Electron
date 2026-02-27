import axios from 'axios'

const BASE_URL =
  // import.meta.env.VITE_BASE_URL || 'http://192.168.1.26:5156/v1/'
  import.meta.env.VITE_BASE_URL || 'https://project-station.whiteboardtec.com:5160/v1/'

console.log('API Base URL:', BASE_URL)

const instance = axios.create({
  baseURL: BASE_URL
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
