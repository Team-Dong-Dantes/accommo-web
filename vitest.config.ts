import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// The suite had no config, so it could only reach modules that avoid the `@`
// alias — which is why nothing under features/ had ever been tested.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
