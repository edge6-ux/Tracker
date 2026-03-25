import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rss-proxy',
      configureServer(server) {
        server.middlewares.use('/api/rss', async (req, res) => {
          const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : ''
          const url = new URLSearchParams(qs).get('url')
          if (!url) { res.statusCode = 400; res.end('Missing url'); return }
          try {
            const upstream = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
              },
              signal: AbortSignal.timeout(12000),
            })
            if (!upstream.ok) { res.statusCode = upstream.status; res.end(); return }
            const text = await upstream.text()
            res.setHeader('Content-Type', 'text/xml; charset=utf-8')
            res.end(text)
          } catch {
            res.statusCode = 500
            res.end('Failed to fetch feed')
          }
        })
      },
    },
  ],
})
