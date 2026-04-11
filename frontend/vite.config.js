import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    watch: {
      ignored: ['**/node_modules/**', '**/.metro-cache/**', '**/.expo/**'],
    },
  },
  envPrefix: ['VITE_', 'REACT_APP_']
})
