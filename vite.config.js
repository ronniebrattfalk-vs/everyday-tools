import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { env } from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  base: env.BASE_PATH || '/',
  plugins: [
    react(),
    // Run: ANALYZE=1 npm run build  →  opens dist/stats.html with bundle breakdown
    env.ANALYZE === '1' && (await import('rollup-plugin-visualizer')).visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
})
