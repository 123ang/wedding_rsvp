import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const uploadsRoot = path.join(projectRoot, 'uploads')

const mime = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
}

function serveUploadsPlugin() {
  return {
    name: 'serve-uploads',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/uploads')) return next()
        const subPath = req.url.slice(1)
        const filePath = path.resolve(projectRoot, subPath)
        const relative = path.relative(uploadsRoot, filePath)
        if (relative.startsWith('..') || path.isAbsolute(relative)) return next()
        fs.stat(filePath, (err, stat) => {
          if (err || !stat.isFile()) return next()
          const ext = path.extname(filePath)
          const type = mime[ext] || 'application/octet-stream'
          res.setHeader('Content-Type', type)
          res.setHeader('Cache-Control', 'no-cache')
          fs.createReadStream(filePath).pipe(res)
        })
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), serveUploadsPlugin()],
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

