import { io } from 'socket.io-client'

// const baseURL = import.meta.env.VITE_SOCKET_URL || 'http://192.168.1.26:5156/v1/'
const baseURL = import.meta.env.VITE_SOCKET_URL || 'https://project-station.whiteboardtec.com:5160'
console.log('Socket Base URL:', baseURL)

const socket = io(baseURL, {
  transports: ['websocket'],
  autoConnect: false
  // reconnectionAttempts: 5,
})

// Connect socket with userId
export function connectSocket(userId) {
  if (!userId) {
    console.warn('User ID missing — socket not connected')
    return
  }

  console.log('User ID Passing', userId)

  // Update auth before connecting
  socket.auth = { userId }
  console.log(socket)

  // Avoid multiple connects
  if (!socket.connected) {
    socket.connect()
  }

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
