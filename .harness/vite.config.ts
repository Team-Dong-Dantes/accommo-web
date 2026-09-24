import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { fileURLToPath, URL } from 'node:url'
import { config as loadDotenv } from 'dotenv'

const env = loadDotenv({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true }).parsed || {}

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue({ template: { transformAssetUrls } }), quasar({})],
  resolve: {
    alias: [
      { find: /^@iconify\/vue$/, replacement: '@iconify/vue/offline' },
      { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
    ],
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'http://localhost'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'x'),
  },
  server: { port: 5199, strictPort: true },
})
