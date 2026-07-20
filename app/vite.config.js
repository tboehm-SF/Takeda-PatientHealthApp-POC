import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Base path for GitHub Pages project site (https://<user>.github.io/<repo>/)
  base: '/Takeda-PatientHealthApp-POC/',
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
