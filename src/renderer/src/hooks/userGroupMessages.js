// src/hooks/useGroupMessages.ts
import { useEffect } from 'react'
import socket from '../socket'

const useGroupMessages = (callback) => {
  useEffect(() => {
    const handler = (msg) => {
      console.log('Group message:', msg)
      if (msg.isTagged) console.log('You were tagged!')
      callback(msg)
    }
    socket.on('receiveGroupMessage', handler)
    return () => {
      socket.off('receiveGroupMessage', handler)
    }
  }, [callback])
}

export default useGroupMessages
