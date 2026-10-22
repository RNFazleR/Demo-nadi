import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Path aset relatif, supaya hasil build tetap jalan saat di-host di subfolder
  // (mis. GitHub Pages: https://<user>.github.io/Demo-nadi/)
  base: './',
  plugins: [react()],
  server: {
    // Build firmware (ESP-IDF) & Android menulis ribuan file sementara; jangan dipantau dev server
    watch: { ignored: ['**/firmware/**', '**/android/**', '**/sensor/**'] },
  },
})
