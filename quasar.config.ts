import { defineConfig } from '#q-app';
import { config as loadDotenv } from 'dotenv';

const env = loadDotenv({ path: '.env', quiet: true }).parsed || {};

export default defineConfig((/* ctx */) => {
  return {
    boot: [
      'theme',
      'pinia',
      'iconify',
      'apexcharts',
      'debug',
    ],

    css: [
      'app.css',
      'tokens.css'
    ],

    extras: [
      'mdi-v7'
    ],

    build: {
      target: {
      },

      extendViteConf(conf) {
        conf.resolve = conf.resolve || {}
        const existing = conf.resolve.alias
        const aliasArr = []
        if (existing) {
          if (Array.isArray(existing)) {
            aliasArr.push(...existing)
          } else {
            for (const [k, v] of Object.entries(existing)) {
              aliasArr.push({ find: k, replacement: v as string })
            }
          }
        }
        aliasArr.push({ find: /^@iconify\/vue$/, replacement: '@iconify/vue/offline' })
        conf.resolve.alias = aliasArr

        // `name.hash` rather than Vite's `name-hash`: every file URL changed once
        // so browsers that cached index.html under an asset URL (the old
        // vercel.json rewrite + immutable header, fixed there) never ask for
        // those poisoned URLs again. Harmless to keep.
        conf.build = conf.build || {}
        conf.build.rollupOptions = conf.build.rollupOptions || {}
        conf.build.rollupOptions.output = {
          ...(conf.build.rollupOptions.output as object),
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
        }
      },

      typescript: {
        strict: true,
        vueShim: true
      },

      filenameBasedRouting: false,

      vueRouterMode: 'history',

      define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(env.VITE_MAPBOX_TOKEN),
      },

      // Vue DevTools (dev-only): in-browser panel, no extension needed.
      // client+server true → plugin is registered for the SPA dev config.
      // (These flags select which Vite configs include it, NOT prod bundling —
      // the plugin itself is a no-op in production builds.)
      vitePlugins: [
        [ 'vite-plugin-vue-devtools', {}, { client: true, server: true } ],
      ],
    },

    devServer: {
      open: true
    },

    framework: {
      iconSet: 'mdi-v7',
      config: {},

      plugins: ['Notify', 'Dialog']
    },

    animations: [],
  }
});
