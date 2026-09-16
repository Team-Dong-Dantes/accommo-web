<template>
  <q-btn
    flat
    round
    no-caps
    class="date-range-btn"
    :class="{ 'date-range-active': dateRange }"
    :color="dateRange ? 'primary' : 'ink'"
    :text-color="dateRange ? 'primary' : 'ink'"
  >
    <Icon icon="lucide:calendar-range" width="20" height="20" />
    <q-badge v-if="dateRange" floating color="primary" rounded transparent class="date-active-dot" />
    <q-tooltip v-if="dateRangeLabel">{{ dateRangeLabel }}</q-tooltip>
    <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" class="date-menu">
      <div class="q-pa-md column q-gutter-y-sm">
        <div class="text-weight-bold text-ink">Date</div>
        <div class="date-preset-grid">
          <q-btn
            v-for="p in datePresets"
            :key="p.value"
            dense
            no-caps
            :label="p.label"
            class="date-preset"
            :class="{ 'date-preset-active': activePreset === p.value }"
            @click="setPreset(p.value)"
          />
        </div>
        <q-separator />
        <q-date v-model="dateRange" range class="date-calendar" />
        <div class="row justify-between items-center text-muted" style="font-size: 12px;">
          <span>{{ dateRange && dateRange.from ? `${dateRange.from} → ${dateRange.to || '…'}` : 'All time' }}</span>
          <q-btn dense flat label="Clear" color="primary" no-caps @click="clearDate" />
        </div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

// v-model — null = all time.
const dateRange = defineModel<{ from: string; to?: string } | null>('modelValue', { default: null })

function fmtISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function setPreset(preset: 'today' | '7d' | '30d' | 'month') {
  const now = new Date()
  const to = fmtISODate(now)
  let from = to
  if (preset === '7d') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    from = fmtISODate(d)
  } else if (preset === '30d') {
    const d = new Date(now)
    d.setDate(d.getDate() - 29)
    from = fmtISODate(d)
  } else if (preset === 'month') {
    from = fmtISODate(new Date(now.getFullYear(), now.getMonth(), 1))
  }
  dateRange.value = { from, to }
}

function clearDate() {
  dateRange.value = null
}

const datePresets: { label: string; value: 'today' | '7d' | '30d' | 'month' }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This month', value: 'month' },
]

const activePreset = computed(() => {
  if (!dateRange.value || !dateRange.value.from) return null
  const now = new Date()
  const to = fmtISODate(now)
  const ranges: Record<string, string> = { today: to }
  const d7 = new Date(now); d7.setDate(now.getDate() - 6); ranges['7d'] = fmtISODate(d7)
  const d30 = new Date(now); d30.setDate(now.getDate() - 29); ranges['30d'] = fmtISODate(d30)
  ranges['month'] = fmtISODate(new Date(now.getFullYear(), now.getMonth(), 1))
  const { from, to: t2 } = dateRange.value
  for (const [key, f] of Object.entries(ranges)) {
    if (from === f && (t2 || from) === to) return key
  }
  return null
})

const dateRangeLabel = computed(() => {
  if (!dateRange.value || !dateRange.value.from) return 'Date Range'
  const { from, to } = dateRange.value
  if (!to || from === to) return `On ${from}`
  return `${from} → ${to}`
})
</script>

<style scoped>
.date-range-btn {
  border: 1px solid var(--c-border);
  background: var(--c-surface);
}
.date-range-btn:hover {
  border-color: var(--c-primary);
}
.date-range-active {
  background: var(--c-primary-soft) !important;
  border-color: var(--c-primary) !important;
}
.date-active-dot {
  width: 8px;
  height: 8px;
  min-height: 8px;
  padding: 0;
  border: 2px solid var(--c-surface);
  box-shadow: 0 0 0 1px var(--c-primary);
}
</style>

<style>
/* Date-range popover — NON-SCOPED on purpose: QMenu teleports its content
   to <body>, so the component's scoped styles never reach it. These rules
   must mirror the design tokens ("UI Bible"): 12px button radius, subtle
   --shadow-sm, no uppercase, weight 600. */
.date-menu {
  width: 340px;
  max-width: 340px;
  border: 1px solid var(--c-border);
  border-radius: var(--card-radius) !important;
  box-shadow: var(--shadow-lg) !important;
}
.date-menu .q-date__header {
  display: none;
}
.date-calendar {
  box-shadow: none;
  border: none;
  width: 100%;
}
.date-menu .q-date {
  font-size: 12px;
}
.date-preset-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}
.date-preset {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-btn);
  color: var(--c-ink);
  background: var(--c-surface);
  font-size: 12px;
  font-weight: 600;
  text-transform: none;
  box-shadow: none !important;
}
.date-preset:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
}
.date-preset-active {
  background: var(--c-primary) !important;
  color: #fff !important;
  border-color: var(--c-primary) !important;
  box-shadow: none !important;
}
</style>
