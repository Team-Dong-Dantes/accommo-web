<template>
  <div
    :class="variant === 'rich'
      ? 'rich-empty full-width column flex-center text-muted q-pa-xl'
      : 'usr-empty text-muted'"
  >
    <Icon
      :icon="icon"
      :width="variant === 'rich' ? size : 15"
      :height="variant === 'rich' ? size : 15"
      :class="variant === 'rich' ? 'q-mb-md' : 'q-mr-xs'"
    />
    <template v-if="variant === 'rich'">
      <div class="text-h6 text-weight-bold text-ink">{{ title }}</div>
      <div v-if="message" class="text-center">{{ message }}</div>
    </template>
    <template v-else>{{ message }}</template>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  variant: { type: String as () => 'inline' | 'rich', default: 'inline' },
  icon: { type: String, default: 'mdi:information-outline' },
  title: { type: String, default: 'Nothing here yet' },
  message: { type: String, default: '' },
  size: { type: [Number, String], default: 48 },
})
</script>

<style scoped>
.usr-empty {
  font-size: 13px;
  font-weight: 500;
  padding: 6px 0;
  display: flex;
  align-items: center;
}
.rich-empty {
  gap: 2px;
}
</style>
