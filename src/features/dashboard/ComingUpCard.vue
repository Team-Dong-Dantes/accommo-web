<template>
  <DashCard
    icon="lucide:calendar-clock"
    title="Expiring soon"
    tone="work"
    :summary="summary"
    :link="{ to: '/accommodation-hub', label: 'Accommodations' }"
  >
    <!-- When each accreditation, permit and lease runs out, a week to a bar,
         so a pile-up shows before it arrives. -->
    <div class="dc-sec dc-fill">
      <ChartCard
        type="bar" height="100%"
        :series="series" :options="options"
        :has-data="items.length > 0"
        empty-text="No accreditation, permit or lease ends in the next 30 days"
      />
    </div>

    <!-- Accreditation decisions are rare, so they ride at the top of this card
         when there are any instead of holding a card of their own. -->
    <ul v-if="ready.length || shown.length" class="dc-rows">
      <li v-for="item in ready" :key="item.id" class="dc-row">
        <span class="dc-row-main" :title="item.name">{{ item.name }}<em>Applied for accreditation</em></span>
        <span class="dc-row-meta">Ready</span>
        <router-link :to="`/verifications?focus=verification:${item.id}`" class="dc-row-act">Review</router-link>
      </li>
      <li v-for="item in shown" :key="item.key" class="dc-row">
        <span class="dc-row-main" :title="`${item.name} · ${item.what}`">{{ item.name }}<em>{{ item.what }}</em></span>
        <span class="dc-row-meta" :class="{ 'is-late': daysUntil(item.date) <= 7 }">{{ whenLabel(item) }}</span>
        <router-link :to="item.to" class="dc-row-act">Open</router-link>
      </li>
    </ul>

    <template v-if="more > 0" #foot><b>{{ more }}</b> more in the next 30 days.</template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import DashCard from './DashCard.vue'
import { cssVar } from '@/utils/chartTheme'
import { useAuthStore } from '@/stores/auth'
import type { ComingUpItem, DashboardStats } from '@/types/dashboard'

const props = defineProps<{ data: DashboardStats }>()
const auth = useAuthStore()

const ROWS = 3

// Only rows whose record this admin can open.
const items = computed(() => props.data.comingUp.filter((item) => auth.canOpen(item.to.split('?')[0]!)))
const ready = computed(() => (auth.can('accreditation') ? props.data.accreditationQueue.ready.slice(0, 1) : []))
const shown = computed(() => items.value.slice(0, ROWS - ready.value.length))
const more = computed(() => items.value.length - shown.value.length)

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000)
}

function whenLabel(item: ComingUpItem) {
  const days = daysUntil(item.date)
  const verb = item.kind === 'lease' ? 'Ends' : 'Expires'
  if (days < 0) return `${item.kind === 'lease' ? 'Ended' : 'Expired'} ${-days}d ago`
  if (days === 0) return `${verb} today`
  return `${verb} in ${days}d`
}

const summary = computed(() => {
  const late = items.value.filter((item) => daysUntil(item.date) < 0).length
  const soon = items.value.length - late
  if (!soon && !late) return 'Accreditations, permits and leases: none end in the next 30 days.'
  return [soon && `${soon} ending in the next 30 days`, late && `${late} already expired`].filter(Boolean).join(', ')
})

// Expired first, then the next four weeks.
const BUCKETS = [
  { label: 'Expired', max: -1 },
  { label: 'This week', max: 7 },
  { label: 'Next week', max: 14 },
  { label: '15–21d', max: 21 },
  { label: '22–30d', max: Infinity },
]
// Colour follows the kind, never its position, so a kind this admin cannot
// see leaves the others their colours.
const KINDS: { kind: ComingUpItem['kind']; name: string; color: string }[] = [
  { kind: 'accreditation', name: 'Accreditations', color: cssVar('--c-series-1', '#0D9488') },
  { kind: 'permit', name: 'Permits', color: cssVar('--c-series-2', '#6366F1') },
  { kind: 'lease', name: 'Leases', color: cssVar('--c-series-3', '#E0654B') },
]
const kinds = computed(() => KINDS.filter((k) => items.value.some((item) => item.kind === k.kind)))

const series = computed(() => kinds.value.map((k) => {
  const counts = BUCKETS.map(() => 0)
  for (const item of items.value) {
    if (item.kind !== k.kind) continue
    const days = daysUntil(item.date)
    counts[BUCKETS.findIndex((b) => days <= b.max)]! += 1
  }
  return { name: k.name, data: counts }
}))

const options = computed(() => ({
  chart: { stacked: true, toolbar: { show: false } },
  colors: kinds.value.map((k) => k.color),
  // A surface-coloured seam between stacked segments.
  stroke: { show: true, width: 2, colors: [cssVar('--c-surface', '#FAFCFE')] },
  plotOptions: { bar: { borderRadius: 4, borderRadiusApplication: 'end', borderRadiusWhenStacked: 'last', columnWidth: '55%' } },
  xaxis: {
    categories: BUCKETS.map((b) => b.label),
    labels: { style: { colors: cssVar('--c-muted', '#6B7770'), fontSize: '11px', fontWeight: 600 } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { forceNiceScale: true, labels: { formatter: (v: number) => String(Math.round(v)), style: { colors: cssVar('--c-muted', '#6B7770'), fontSize: '10px' } } },
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
  tooltip: { shared: true, intersect: false, y: { formatter: (v: number) => String(v) } },
}))
</script>

<style scoped>
.dc-row-main em {
  margin-left: var(--sp-2);
  color: var(--c-muted);
  font-size: var(--fs-xs);
  font-style: normal;
}
</style>
