import { Icon, addCollection } from '@iconify/vue/offline'
import { defineBoot } from '#q-app'
import mdiIcons from '@iconify-json/mdi/icons.json'

addCollection(mdiIcons)

export default defineBoot(({ app }) => {
  app.component('Icon', Icon)
})
