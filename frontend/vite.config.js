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
          '/guacamole': {
              target: 'ws://localhost:8080/guacamole',
              changeOrigin: true,
              rewrite: (path)=> path.replace(/^\/guacamole/, '')
          },
          "/ws":  { target: "http://localhost:8000", changeOrigin: true, ws: true },
      }
  }
})
