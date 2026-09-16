<template>
  <div class="qa">
    <div class="qa-verdict">
      <p class="qa-figure">
        <strong>{{ overdueTotal }}</strong>
        <span>of {{ total }} past the {{ slaDays }}-day target</span>
      </p>
      <p class="qa-read">{{ verdict }}</p>
      <router-link to="/verifications" class="qa-action">
        Work the queue
        <Icon icon="lucide:arrow-right" width="16" height="16" aria-hidden="true" />
      </router-link>
    </div>

    <div class="qa-chart">
      <ChartCard
        type="bar" preset="bar" height="190px"
        :series="series" :options="options"
        :has-data="total > 0"
        empty-text="Nothing is waiting for verification"
      />
      <p class="qa-axis-note">Time waited since the account registered</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import { cssVar } from '@/utils/chartTheme'
import type { DashboardStats } from '@/types/dashboard'

const props = withDefaults(
  defineProps<{ buckets: DashboardStats['verificationAges']; slaDays?: number }>(),
  { slaDays: 3 },
)

const total = computed(() =>
  props.buckets.reduce((sum, b) => sum + b.students + b.managers, 0),
)
const overdueTotal = computed(() =>
  props.buckets.filter((b) => b.overdue).reduce((sum, b) => sum + b.students + b.managers, 0),
)

const verdict = computed(() => {
  if (total.value === 0) return 'The verification queue is empty.'
  const share = Math.round((overdueTotal.value / total.value) * 100)
  const oldest = props.buckets.at(-1)
  if (oldest && oldest.students + oldest.managers > 0) {
    return `${share}% of the queue has been waiting past target, and ${oldest.students + oldest.managers} for more than a fortnight. The backlog is old, not just deep.`
  }
  if (share === 0) return 'Every account in the queue is still inside the review target.'
  return `${share}% of the queue has been waiting past the review target.`
})

const series = computed(() => [
  { name: 'Students', data: props.buckets.map((b) => b.students) },
  { name: 'Managers', data: props.buckets.map((b) => b.managers) },
])

const options = computed(() => ({
  chart: { stacked: true, toolbar: { show: false } },
  // Bars inside target read as the brand colour; bars past it turn to the
  // warning and danger tones, so the breach is visible without a legend.
  colors: [cssVar('--c-primary', '#0F766E'), cssVar('--c-info', '#0E7490')],
  xaxis: {
    categories: props.buckets.map((b) => b.label),
    labels: { style: { colors: cssVar('--c-muted', '#6B7770'), fontSize: '11px', fontWeight: 600 } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: cssVar('--c-muted', '#6B7770'), fontSize: '10px' } } },
  grid: { borderColor: cssVar('--c-border', '#E7ECF2'), strokeDashArray: 3, padding: { left: 4, right: 4 } },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '52%' } },
  dataLabels: {
    enabled: true,
    formatter: (value: number) => (value > 0 ? String(value) : ''),
    style: { fontSize: '10px', fontWeight: 700, colors: ['#fff'] },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '11px',
    markers: { radius: 3 },
    labels: { colors: cssVar('--c-muted', '#6B7770') },
  },
  // The review target, drawn where it falls between the second and third bucket.
  annotations: {
    xaxis: props.buckets.length > 2
      ? [{
          x: props.buckets[1]?.label,
          x2: props.buckets.at(-1)?.label,
          fillColor: cssVar('--c-danger', '#C2410C'),
          opacity: 0.05,
          label: {
            text: 'past target',
            orientation: 'horizontal',
            position: 'top',
            style: {
              fontSize: '9px',
              fontWeight: 700,
              color: cssVar('--c-danger', '#C2410C'),
              background: 'transparent',
            },
          },
        }]
      : [],
  },
  tooltip: { y: { formatter: (v: number) => `${v} account${v === 1 ? '' : 's'}` } },
}))
</script>

<style scoped>
.qa {
  display: grid;
  grid-template-columns: minmax(0, 20rem) minmax(0, 1fr);
  gap: clamp(20px, 3vw, 40px);
  align-items: center;
}

.qa-figure { display: flex; flex-direction: column; margin: 0; }
.qa-figure strong {
  color: var(--c-danger);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: clamp(2.8rem, 2rem + 2.2vw, 4rem);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.04em;
}
.qa-figure span { margin-top: 6px; color: var(--c-muted); font-size: 0.84rem; font-weight: 600; }

.qa-read {
  max-width: 34ch;
  margin: 12px 0 0;
  color: var(--c-text);
  font-size: 0.86rem;
  line-height: 1.55;
}

.qa-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 16px;
  padding: 10px 16px;
  border-radius: var(--radius-btn, 12px);
  background: var(--c-ink);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
}
.qa-action:hover { background: #000; }
.qa-action:focus-visible { outline: 3px solid var(--c-primary); outline-offset: 3px; }

.qa-chart { min-width: 0; }
.qa-axis-note {
  margin: 2px 0 0;
  color: var(--c-muted);
  font-size: 10.5px;
  text-align: center;
}

@media (max-width: 900px) {
  .qa { grid-template-columns: 1fr; gap: 18px; }
}
</style>
