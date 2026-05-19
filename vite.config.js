import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

export default defineConfig({
  plugins: [vue()],
  // Use relative base so the built bundle works on surge.sh, GitHub Pages, etc.
  base: './',
  server: {
    port: 8080,
    strictPort: false,
  },
  build: {
    target: 'es2019',
    sourcemap: false,
  },
})
