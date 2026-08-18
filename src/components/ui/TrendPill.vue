<template>
  <span class="trend-pill" :class="[`bg-${tone}-soft`, `text-${tone}`]">
    <Icon v-if="trend !== 'flat'" :icon="trend === 'up' ? 'mdi:arrow-up-right' : 'mdi:arrow-down-right'" :width="13" :height="13" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { StatusTone } from '@/utils/status.config'

defineProps({
  tone: { type: String as () => StatusTone, default: 'primary' },
  trend: { type: String as () => 'up' | 'down' | 'flat', default: 'flat' },
  label: { type: String, required: true },
})
</script>

<style scoped>
.trend-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
}
</style>
