import { io } from 'socket.io-client'
import { getSocketUrl } from './api/backendConfig'

const socket = io(getSocketUrl(), {
  transports: ['websocket'],
  autoConnect: false
})

// Connect socket with token
export function connectSocket() {
  const token = sessionStorage.getItem('token')
  if (!token) {
    console.warn('Token missing — socket not connected')
    return
  }

  // Update URI in case it changed during health check
  socket.io.uri = getSocketUrl()

  console.log('Connecting to socket at:', socket.io.uri)

  // Update auth before connecting
  socket.auth = { token }
  console.log('Socket Auth Set with Token')

  // Avoid multiple connects or reconnect with new token
  if (socket.connected) {
    socket.disconnect()
  }
  socket.connect()

  // Log socket events (optional but very helpful)
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id)
    if (typeof socket.id === 'string') {
      sessionStorage.setItem('socketId', socket.id)
    } else {
      console.warn('Socket ID is undefined, could not store socketId in sessionStorage.')
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('⚠️ Socket connection error:', err.message)
  })
}

export default socket
