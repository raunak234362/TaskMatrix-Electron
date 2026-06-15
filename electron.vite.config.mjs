import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const targetUrl = (env.VITE_SOCKET_URL || env.VITE_BASE_URL?.replace('/v1/', '') || 'https://project-station.whiteboardtec.com:5160').replace(/\/$/, '')

  return {
    main: {
      plugins: [externalizeDepsPlugin()]
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src'),
          '@tailwindcss/typography': resolve('node_modules/@tailwindcss/typography')
        }
      },
      server: {
        proxy: {
          '/v1': {
            target: targetUrl,
            changeOrigin: true,
            secure: false
          }
        }
      },
      plugins: [react(), tailwindcss()]
    }
  }
})

