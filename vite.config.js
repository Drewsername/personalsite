import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Bind to all interfaces so the dev server is reachable from a phone on the
  // same network (http://<your-LAN-IP>:5173).
  //
  // Vite serves only the front end, so the API calls and uploaded listing
  // photos are proxied to the Express server — run `npm start` alongside
  // `npm run dev` when working on anything that touches the server.
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:8080',
      '/moveout-media': 'http://localhost:8080',
    },
  },
})
