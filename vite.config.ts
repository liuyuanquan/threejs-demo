import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  base: '/threejs-demo/',
  server: {
    port: 3000,
    open: true
  },
  plugins: [vue(), glsl()],
  build: {
    outDir: 'docs'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
