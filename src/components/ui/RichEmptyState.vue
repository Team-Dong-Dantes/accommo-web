<template>
  <div class="rich-empty full-width column flex-center text-muted q-pa-xl">
    <Icon :icon="icon" :width="size" :height="size" class="q-mb-md" />
    <div class="text-h6 text-weight-bold text-ink">{{ title }}</div>
    <div v-if="message" class="text-center">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  icon: { type: String, default: 'mdi:information-outline' },
  title: { type: String, default: 'Nothing here yet' },
  message: { type: String, default: '' },
  size: { type: [Number, String], default: 48 },
})
</script>

<style scoped>
.rich-empty {
  gap: 2px;
}
</style>
