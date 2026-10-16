<template>
  <KpiTile :icon="icon" :label="label" :value="value" :accent="mappedAccent" />
</template>

<script setup lang="ts">
import KpiTile from '@/components/ui/KpiTile.vue'

const props = withDefaults(
  defineProps<{ icon: string; label: string; value: string; accent?: 'teal' | 'amber' | 'green' | 'info' }>(),
  { accent: 'teal' },
)

const ACCENT_MAP: Record<string, 'primary' | 'warning' | 'success' | 'info'> = {
  teal: 'primary',
  amber: 'warning',
  green: 'success',
  info: 'info',
}

const mappedAccent = ACCENT_MAP[props.accent] ?? 'primary'
</script>
