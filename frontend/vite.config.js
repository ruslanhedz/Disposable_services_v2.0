import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
      base: "./",
      proxy: {
          '/api': {
              target: 'https://api.disposable-services.online/django',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
          },
          // '/guacamole': {
          //     target: 'wss://127.0.0.1:8443/guacamole',
          //     changeOrigin: true,
          //     rewrite: (path)=> path.replace(/^\/guacamole/, '')
          // },
          '/guacamole': {
              target: 'https://api.disposable-services.online',
              changeOrigin: true,
              ws: true,
              secure: false, // accept your self-signed cert in dev
      // do not rewrite '/guacamole'
          },
          "/ws":  { target: "https://api.disposable-services.online/django", changeOrigin: true, ws: true },
      }
  }
})
