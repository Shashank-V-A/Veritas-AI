import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('/react/')
            ) {
              return 'react-vendor'
            }
            if (id.includes('framer-motion')) return 'motion'
            if (id.includes('recharts') || id.includes('d3-')) return 'charts'
            if (id.includes('@tanstack/react-query')) return 'query'
            if (id.includes('cmdk') || id.includes('radix-ui')) return 'ui-vendor'
            if (id.includes('lucide-react')) return 'icons'
          }
        },
      },
    },
  },
})
