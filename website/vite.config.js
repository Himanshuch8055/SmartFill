import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The changelog page imports ../CHANGELOG.md from the repo root.
    fs: { allow: ['..'] },
  },
})
