import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => {
          // Keep the path as /api (no rewriting)
          console.log('📍 Proxy path:', path);
          return path;
        },
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            console.log('📡 Proxying to:', proxyReq.getHeader('host') + proxyReq.path);
          });
          proxy.on('error', (err, _req, _res) => {
            console.error('❌ Proxy error:', err.message);
          });
        }
      }
    }
  }
})

