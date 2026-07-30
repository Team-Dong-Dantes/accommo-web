import { defineConfig } from '#q-app';
import { config as loadDotenv } from 'dotenv';

const env = loadDotenv({ path: '.env' }).parsed || {};

export default defineConfig((/* ctx */) => {
  return {
    boot: [
      'pinia',
      'iconify',
    ],

    css: [
      'app.css'
    ],

    extras: [
      'roboto-font',
    ],

    build: {
      target: {
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
      },
    },

    devServer: {
      open: true
    },

    framework: {
      iconSet: 'mdi-v7',
      config: {},

      plugins: ['Notify']
    },

    animations: [],
  }
});
