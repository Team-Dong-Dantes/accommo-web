<template>
  <DashCard
    icon="lucide:user-check"
    title="Verifications"
    tone="work"
    :summary="summary"
    :link="{ to: '/verifications', label: 'All' }"
  >
    <div class="dc-sec dc-fill">
      <ChartCard
        type="bar" height="100%"
        :series="series" :options="options"
        :has-data="total > 0"
        empty-text="Nothing is waiting for verification"
      />
    </div>

    <ul v-if="oldest.length" class="dc-rows">
      <li v-for="row in oldest" :key="row.id" class="dc-row">
        <span class="dc-row-main" :title="row.name">{{ row.name }}</span>
        <span class="dc-row-meta">{{ row.role === 'student' ? 'Student' : 'Landlord/Landlady' }}</span>
        <span class="dc-row-meta" :class="{ 'is-late': row.ageDays > slaDays }">{{ row.ageDays }}d</span>
        <router-link :to="`/verifications?focus=verification:${row.id}`" class="dc-row-act">Review</router-link>
      </li>
    </ul>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import DashCard from './DashCard.vue'
import { cssVar } from '@/utils/chartTheme'
import type { DashboardStats } from '@/types/dashboard'

const props = withDefaults(defineProps<{ data: DashboardStats; slaDays?: number }>(), { slaDays: 3 })

const buckets = computed(() => props.data.verificationAges)
const total = computed(() => buckets.value.reduce((sum, b) => sum + b.students + b.landlords, 0))
const overdue = computed(() =>
  buckets.value.filter((b) => b.overdue).reduce((sum, b) => sum + b.students + b.landlords, 0),
)
// The three that have waited longest, by name — the rows the chart summarises.
const oldest = computed(() => props.data.verificationQueue.oldest.slice(0, 3))

const summary = computed(() =>
  total.value === 0
    ? 'The queue is empty.'
    : `${overdue.value} of ${total.value} waiting past the ${props.slaDays}-day target`,
)

const series = computed(() => [
  { name: 'Students', data: buckets.value.map((b) => b.students) },
  { name: 'Landlords/Landladies', data: buckets.value.map((b) => b.landlords) },
])

const options = computed(() => ({
  chart: { stacked: true, toolbar: { show: false } },
  colors: [cssVar('--c-primary', '#0F766E'), cssVar('--c-info', '#0E7490')],
  plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
  xaxis: {
    categories: buckets.value.map((b) => b.label),
    labels: { style: { colors: cssVar('--c-muted', '#6B7770'), fontSize: '11px', fontWeight: 600 } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: cssVar('--c-muted', '#6B7770'), fontSize: '10px' } } },
  grid: { borderColor: cssVar('--c-border', '#E7ECF2'), strokeDashArray: 3, padding: { top: -12, left: 4, right: 4 } },
  dataLabels: { enabled: false },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '11px',
    markers: { size: 5 },
    labels: { colors: cssVar('--c-muted', '#6B7770') },
  },
  // The span past the review target, shaded so the breach reads without a note.
  annotations: {
    xaxis: buckets.value.length > 2
      ? [{
          x: buckets.value.find((b) => b.overdue)?.label,
          x2: buckets.value.at(-1)?.label,
          fillColor: cssVar('--c-warning', '#B45309'),
          opacity: 0.07,
          label: {
            text: 'past target',
            orientation: 'horizontal',
            position: 'top',
            style: { fontSize: '9px', fontWeight: 700, color: cssVar('--c-warning', '#B45309'), background: 'transparent' },
          },
        }]
      : [],
  },
  tooltip: { y: { formatter: (v: number) => `${v} account${v === 1 ? '' : 's'}` } },
}))
</script>
