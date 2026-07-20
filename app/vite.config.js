import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves from a repo subpath; Netlify (and dev) serve from root.
  base: process.env.NETLIFY ? '/' : '/Takeda-PatientHealthApp-POC/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/checkin': 'http://localhost:3001',
      '/adherence': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
})
