<template>
  <DashCard icon="lucide:user-plus" title="Registrations" :summary="summary">
    <div class="dc-sec toolbar">
      <div class="seg" role="group" aria-label="Range">
        <button
          v-for="opt in RANGE_OPTIONS"
          :key="opt.value"
          type="button"
          class="seg-btn"
          :class="{ active: range === opt.value && !customRange }"
          :aria-pressed="range === opt.value && !customRange"
          @click="setRange(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
      <DateRangeButton v-model="customRange" class="date" />
    </div>

    <div class="dc-sec dc-fill chart">
      <ChartCard
        type="area" preset="area" height="100%"
        :series="series" :options="options"
        :has-data="hasData" empty-text="No registrations in this period"
      />
    </div>

    <template #foot>
      <span class="key"><i class="st" />Students <b>{{ totals.students }}</b></span>
      <span class="key"><i class="ll" />Landlords/Landladies <b>{{ totals.landlords }}</b></span>
      <span v-if="projection !== null" class="proj">Next month, about <b>{{ projection }}</b></span>
    </template>
  </DashCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import DateRangeButton from '@/features/audit/DateRangeButton.vue'
import DashCard from './DashCard.vue'
import { cssVar } from '@/utils/chartTheme'
import type { DashboardStats } from '@/types/dashboard'

const props = defineProps<{ months: DashboardStats['registrationsByMonth'] }>()

const RANGE_OPTIONS = [
  { value: '3', label: '3M' },
  { value: '6', label: '6M' },
  { value: '12', label: '12M' },
  { value: 'ytd', label: 'YTD' },
]

const range = ref('6')
const customRange = ref<{ from: string; to?: string } | null>(null)

function setRange(value: string) {
  range.value = value
  customRange.value = null
}

const view = computed(() => {
  const all = props.months
  if (customRange.value?.from) {
    const fromYm = customRange.value.from.slice(0, 7)
    const toYm = (customRange.value.to || customRange.value.from).slice(0, 7)
    return all.filter((m) => m.ym >= fromYm && m.ym <= toYm)
  }
  if (range.value === 'ytd') {
    const year = String(new Date().getFullYear())
    const current = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    return all.filter((m) => m.ym.startsWith(year) && m.ym <= current)
  }
  return all.slice(-Number(range.value))
})

const totals = computed(() =>
  view.value.reduce(
    (acc, m) => ({ students: acc.students + m.students, landlords: acc.landlords + m.landlords }),
    { students: 0, landlords: 0 },
  ),
)

// Period-over-period is meaningless for YTD or a hand-picked range.
const periodDelta = computed(() => {
  if (customRange.value || range.value === 'ytd') return null
  const n = Number(range.value)
  const previous = props.months.slice(-2 * n, -n).reduce((sum, m) => sum + m.students + m.landlords, 0)
  if (!previous) return null
  const current = totals.value.students + totals.value.landlords
  return Math.round(((current - previous) / previous) * 100)
})

const summary = computed(() => {
  const months = view.value.map((m) => m.month)
  const span = months.length ? `${months[0]} to ${months[months.length - 1]}` : 'No months in range'
  if (periodDelta.value === null) return span
  return `${span}, ${periodDelta.value >= 0 ? 'up' : 'down'} ${Math.abs(periodDelta.value)}% on the period before`
})

// Average of the latest three months; stated in the footer, not drawn.
const projection = computed(() => {
  const window = Math.min(3, view.value.length)
  if (window < 2) return null
  const totalsInWindow = view.value.slice(-window).map((m) => m.students + m.landlords)
  return Math.round(totalsInWindow.reduce((sum, value) => sum + value, 0) / window)
})

const series = computed(() => [
  { name: 'Students', data: view.value.map((m) => m.students) },
  { name: 'Landlords/Landladies', data: view.value.map((m) => m.landlords) },
])

const hasData = computed(() => view.value.some((m) => m.students + m.landlords > 0))

const options = computed(() => ({
  colors: [cssVar('--c-primary', '#0F766E'), cssVar('--c-accent', '#E0654B')],
  xaxis: {
    categories: view.value.map((m) => m.month),
    labels: { style: { colors: cssVar('--c-muted', '#6B7770'), fontSize: '11px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  grid: { borderColor: cssVar('--c-border', '#E7ECF2'), strokeDashArray: 4, padding: { top: -8 } },
  markers: { size: 3, hover: { size: 5 }, strokeWidth: 0 },
}))
</script>

<style scoped>
.dc-sec.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--sp-2);
  padding-bottom: 0;
}
/* The toolbar and chart read as one section, so no hairline between them. */
.dc-sec.dc-fill.chart { border-top: 0; padding-top: 0; }
.date { transform: scale(0.8); transform-origin: right center; }
.seg {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
}
.seg-btn {
  padding: 3px 8px;
  border: 0;
  border-radius: 7px;
  background: none;
  color: var(--c-muted);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
}
.seg-btn:hover { color: var(--c-text); }
.seg-btn.active { background: var(--c-surface); color: var(--c-primary); box-shadow: var(--shadow-sm); }
.seg-btn:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 1px; }

.key { display: inline-flex; align-items: center; gap: 5px; margin-right: var(--sp-4); }
.key i { width: 8px; height: 8px; border-radius: 2px; }
.key i.st { background: var(--c-primary); }
.key i.ll { background: var(--c-accent); }
.proj { float: right; color: var(--c-muted); }
</style>
