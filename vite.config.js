import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version ?? '0.0.0'),
  },
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1200,
    target: 'es2022',
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    /** 固定 IPv4，与 wait-on / Electron loadURL 一致，避免只监听 ::1 导致 wait 卡住、Electron 永远不启动 */
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  publicDir: false
})
