<template>
  <KpiTile :icon="icon" :label="label" :value="value" :accent="mappedAccent" />
</template>

<script setup lang="ts">
import KpiTile from '@/components/ui/KpiTile.vue'

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: String, required: true },
  accent: { type: String as () => 'teal' | 'amber' | 'green' | 'info', default: 'teal' },
})

const ACCENT_MAP: Record<string, 'primary' | 'warning' | 'success' | 'info'> = {
  teal: 'primary',
  amber: 'warning',
  green: 'success',
  info: 'info',
}

const mappedAccent = ACCENT_MAP[props.accent] ?? 'primary'
</script>
