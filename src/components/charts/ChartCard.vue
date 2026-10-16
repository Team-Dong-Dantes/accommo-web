<template>
  <div class="chart-card" :style="{ height }">
    <apexchart v-if="hasData" :type="type" :height="height" :options="mergedOptions" :series="series" />
    <div v-else class="full-width flex-center text-muted text-caption chart-empty">{{ emptyText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { chartBase, chartPreset } from '@/utils/chartTheme'

const props = withDefaults(
  defineProps<{
    type: 'area' | 'bar' | 'donut' | 'line' | 'radialBar'
    series: any[]
    options?: Record<string, any>
    height?: string
    hasData?: boolean
    emptyText?: string
    preset?: 'area' | 'bar' | 'donut' | 'line' | ''
  }>(),
  { options: () => ({}), height: '100%', hasData: true, emptyText: 'No data', preset: '' },
)

function deepMerge(base: any, override: any): any {
  const out = Array.isArray(base) ? [...base] : { ...base }
  for (const k in override) {
    const v = override[k]
    if (
      v && typeof v === 'object' && !Array.isArray(v) &&
      base && typeof base[k] === 'object' && !Array.isArray(base[k])
    ) {
      out[k] = deepMerge(base[k], v)
    } else {
      out[k] = v
    }
  }
  return out
}

const mergedOptions = computed(() =>
  deepMerge(deepMerge(chartBase(props.type), chartPreset(props.preset)), props.options),
)
</script>

<style scoped>
.chart-card {
  position: relative;
  width: 100%;
  min-height: 0;
}
.chart-empty {
  height: 100%;
  min-height: 80px;
}
</style>
