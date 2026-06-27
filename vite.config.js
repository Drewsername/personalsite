import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Bind to all interfaces so the dev server is reachable from a phone on the
  // same network (http://<your-LAN-IP>:5173).
  server: { host: true },
})
