<template>
  <section class="panel reg" aria-labelledby="reg-title">
    <header class="reg-head">
      <div class="reg-title-col">
        <h2 id="reg-title">Registrations</h2>
        <p class="reg-sub">
          {{ rangeLabel }}
          <b v-if="periodDeltaText" :class="periodDelta !== null && periodDelta >= 0 ? 'up' : 'down'">
            {{ periodDeltaText }}
          </b>
        </p>
      </div>

      <div class="reg-controls">
        <div class="seg" role="group" aria-label="Range">
          <button
            v-for="opt in RANGE_OPTIONS"
            :key="opt.value"
            type="button"
            class="seg-btn"
            :class="{ active: range === opt.value && !customRange }"
            @click="setRange(opt.value)"
          >
            {{ opt.label }}
          </button>
          <DateRangeButton v-model="customRange" />
        </div>
      </div>
    </header>

    <ChartCard
      type="area" preset="area" height="240px"
      :series="series" :options="options"
      :has-data="hasData" empty-text="No registrations in this period"
    />

    <div class="reg-legend">
      <span v-for="s in visibleSeries" :key="s.key" class="legend-chip">
        <i :style="{ background: s.color }" />{{ s.label }}
      </span>
    </div>

    <p v-if="projection !== null" class="reg-projection">
      Projected next month: {{ projection }} registrations, based on the latest
      {{ projectionWindow }} months.
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import DateRangeButton from '@/features/audit/DateRangeButton.vue'
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

const rangeLabel = computed(() => {
  const months = view.value.map((m) => m.month)
  return months.length ? `${months[0]} – ${months[months.length - 1]}` : '—'
})

const projectionWindow = computed(() => Math.min(3, view.value.length))
const projection = computed(() => {
  const window = projectionWindow.value
  if (window < 2) return null
  const totals = view.value.slice(-window).map((m) => m.students + m.landlords)
  return Math.round(totals.reduce((sum, value) => sum + value, 0) / window)
})

const nextMonthLabel = computed(() => {
  const last = view.value.at(-1)
  if (!last) return ''
  const [year = 0, month = 0] = last.ym.split('-').map(Number)
  return new Date(year, month, 1).toLocaleString('en', { month: 'short' })
})

const categories = computed(() => [
  ...view.value.map((m) => m.month),
  ...(projection.value === null ? [] : [nextMonthLabel.value]),
])

const SERIES_DEFS: { key: 'students' | 'landlords' | 'total' | 'projection'; label: string; color: string }[] = [
  { key: 'students', label: 'Students', color: cssVar('--c-primary', '#0F766E') },
  { key: 'landlords', label: 'Landlords/Landladies', color: cssVar('--c-accent', '#E0654B') },
  { key: 'total', label: 'Total', color: cssVar('--c-info', '#0E7490') },
  { key: 'projection', label: 'Projected', color: cssVar('--c-primary-ink', '#0B5750') },
]
const visibleSeries = computed(() =>
  SERIES_DEFS.filter((s) => s.key !== 'projection' || projection.value !== null),
)

const series = computed(() => {
  const tail = projection.value === null ? [] : [null]
  return [
    { name: 'Students', data: [...view.value.map((m) => m.students), ...tail] },
    { name: 'Landlords/Landladies', data: [...view.value.map((m) => m.landlords), ...tail] },
    { name: 'Total', data: [...view.value.map((m) => m.students + m.landlords), ...tail] },
    ...(projection.value === null
      ? []
      : [{
          name: 'Projected',
          data: [
            ...Array(Math.max(0, view.value.length - 1)).fill(null),
            view.value.at(-1)!.students + view.value.at(-1)!.landlords,
            projection.value,
          ],
        }]),
  ]
})

const peak = computed(() => {
  const rows = view.value.map((m) => ({ x: m.month, y: m.students + m.landlords }))
  if (!rows.length || rows.every((r) => r.y === 0)) return null
  return rows.reduce((a, b) => (b.y > a.y ? b : a))
})

// Period-over-period is meaningless for YTD or a hand-picked range.
const previousView = computed(() => {
  if (customRange.value || range.value === 'ytd') return []
  const n = Number(range.value)
  return props.months.slice(-2 * n, -n)
})
const totalThisPeriod = computed(() =>
  view.value.reduce((sum, m) => sum + m.students + m.landlords, 0),
)
const totalPrevious = computed(() =>
  previousView.value.reduce((sum, m) => sum + m.students + m.landlords, 0),
)
const periodDelta = computed(() =>
  totalPrevious.value
    ? Math.round(((totalThisPeriod.value - totalPrevious.value) / totalPrevious.value) * 100)
    : null,
)
const periodDeltaText = computed(() =>
  periodDelta.value === null ? '' : `${periodDelta.value >= 0 ? '+' : ''}${periodDelta.value}%`,
)

const hasData = computed(() =>
  view.value.length > 0 && view.value.some((m) => m.students + m.landlords > 0),
)

const options = computed(() => ({
  chart: { height: 240, toolbar: { show: false } },
  colors: visibleSeries.value.map((s) => s.color),
  xaxis: { categories: categories.value, labels: { style: { colors: cssVar('--c-muted', '#6B7770') } } },
  yaxis: { show: false },
  grid: { borderColor: cssVar('--c-border', '#E7ECF2'), strokeDashArray: 4 },
  stroke: {
    curve: 'smooth',
    width: visibleSeries.value.map(() => 3),
    dashArray: visibleSeries.value.map((s) => (s.key === 'total' ? 6 : s.key === 'projection' ? 4 : 0)),
  },
  markers: { size: 4, hover: { size: 6 }, strokeWidth: 0 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
  dataLabels: { enabled: false },
  legend: { show: false },
  tooltip: { theme: 'light' },
  annotations: peak.value
    ? {
        points: [{
          x: peak.value.x,
          y: peak.value.y,
          marker: { size: 5, fillColor: cssVar('--c-accent', '#E0654B'), strokeColor: '#fff', strokeWidth: 2 },
          label: {
            text: 'Peak',
            borderColor: cssVar('--c-accent', '#E0654B'),
            style: { color: '#fff', background: cssVar('--c-accent', '#E0654B'), fontSize: '10px', fontWeight: 700 },
            offsetY: -6,
          },
        }],
      }
    : {},
}))
</script>

<style scoped>
.reg { display: flex; flex-direction: column; }
.reg-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.reg-title-col h2 {
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.reg-sub { margin: 3px 0 0; color: var(--c-muted); font-size: 0.8rem; }
.reg-sub b { margin-left: 6px; font-variant-numeric: tabular-nums; }
.reg-sub .up { color: var(--c-success); }
.reg-sub .down { color: var(--c-danger); }

.reg-controls { display: flex; align-items: center; gap: 8px; }
.seg {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm, 10px);
  background: var(--c-surface-2);
}
.seg-btn {
  padding: 5px 10px;
  border: 0;
  border-radius: 7px;
  background: none;
  color: var(--c-muted);
  cursor: pointer;
  font: inherit;
  font-size: 11.5px;
  font-weight: 700;
}
.seg-btn:hover { color: var(--c-text); }
.seg-btn.active { background: var(--c-surface); color: var(--c-primary); box-shadow: var(--shadow-sm); }
.seg-btn:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 1px; }

.reg-legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 10px; }
.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--c-muted);
  font-size: 11.5px;
  font-weight: 600;
}
.legend-chip i { width: 9px; height: 9px; border-radius: 3px; }

.reg-projection {
  margin: 10px 0 0;
  color: var(--c-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .reg-controls { width: 100%; justify-content: space-between; }
}
</style>
