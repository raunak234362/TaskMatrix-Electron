import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    server: {
      proxy: {
        '/v1': {
          target: 'https://project-station.whiteboardtec.com:5160',
          changeOrigin: true,
          secure: false
        }
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
