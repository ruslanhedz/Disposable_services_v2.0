import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
      proxy: {
          '/api': {
              target: 'http://127.0.0.1:8000',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
          },
          // '/guacamole': {
          //     target: 'wss://127.0.0.1:8443/guacamole',
          //     changeOrigin: true,
          //     rewrite: (path)=> path.replace(/^\/guacamole/, '')
          // },
          '/guacamole': {
              target: 'https://34.229.153.144:8443',
              changeOrigin: true,
              ws: true,
              secure: false, // accept your self-signed cert in dev
      // do not rewrite '/guacamole'
          },
          "/ws":  { target: "http://localhost:8000", changeOrigin: true, ws: true },
      }
  }
})
