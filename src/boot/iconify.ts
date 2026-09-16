import { Icon, addCollection } from '@iconify/vue/offline'
import { defineBoot } from '#q-app'
import lucideIcons from '@iconify-json/lucide/icons.json'

// Offline: there is no network fallback, so an icon name that is not in this
// collection renders nothing at all, silently. The whole app draws from Lucide,
// the same set accommo-mobile uses.
addCollection(lucideIcons)

export default defineBoot(({ app }) => {
  app.component('Icon', Icon)
})
