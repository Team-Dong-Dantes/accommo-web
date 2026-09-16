<template>
  <section class="panel hc" aria-labelledby="hc-title">
    <header class="p-head">
      <div>
        <h2 id="hc-title">Housing supply</h2>
        <p>{{ supplyNote }}</p>
      </div>
      <router-link to="/room-hub" class="p-link">Room hub</router-link>
    </header>

    <div class="hc-grid">
      <div class="hc-donut">
        <ChartCard
          type="donut" preset="donut" height="168px"
          :series="bedSeries" :options="bedOptions"
          :has-data="data.rooms.capacity > 0"
          empty-text="No rooms recorded"
        />
        <p class="bed-read">
          <b>{{ data.rooms.pax }}</b> taken · <b>{{ freeBeds }}</b> free
        </p>
      </div>

      <div class="hc-ranked">
        <ChartCard
          type="bar" preset="bar" height="168px"
          :series="occupancySeries" :options="occupancyOptions"
          :has-data="data.topOccupied.length > 0"
          empty-text="No accommodation has occupants yet"
        />
      </div>
    </div>

    <!-- Stated as a fact rather than an alarm: the seeded lease data has not
         been reconciled against accreditation yet. -->
    <div class="hc-leases">
      <p class="p-sub">Active leases, by the accreditation status of the house</p>
      <!-- Each segment names itself; a key underneath would make the reader
           match three colours back to three words for no gain. -->
      <div class="lease-bar" role="img" :aria-label="leaseLabel">
        <span
          v-for="band in leaseBands"
          :key="band.label"
          :class="band.cls"
          :style="{ flexGrow: band.value }"
        >
          <b>{{ band.value }}</b>
          <em>{{ band.label }}</em>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import { cssVar } from '@/utils/chartTheme'
import type { DashboardStats } from '@/types/dashboard'

const props = defineProps<{ data: DashboardStats }>()

const leases = computed(() => props.data.leasesByAccreditation)
const freeBeds = computed(() => Math.max(0, props.data.rooms.capacity - props.data.rooms.pax))

const supplyNote = computed(() =>
  props.data.rooms.capacity === 0
    ? 'No rooms recorded yet.'
    : `${freeBeds.value} of ${props.data.rooms.capacity} beds are free across ${props.data.rooms.total} rooms.`,
)

const leaseLabel = computed(() =>
  `Accredited ${leases.value.accredited}, in pipeline ${leases.value.pipeline}, delisted ${leases.value.delisted}`,
)

const leaseBands = computed(() =>
  [
    { label: 'Accredited', value: leases.value.accredited, cls: 'is-accredited' },
    { label: 'Still in the pipeline', value: leases.value.pipeline, cls: 'is-pipeline' },
    { label: 'Delisted or rejected', value: leases.value.delisted, cls: 'is-delisted' },
  ].filter((band) => band.value > 0),
)

const bedSeries = computed(() => [props.data.rooms.pax, freeBeds.value])
const bedOptions = computed(() => ({
  labels: ['Occupied', 'Free'],
  colors: [cssVar('--c-primary', '#0F766E'), cssVar('--c-surface-2', '#EEF2F8')],
  legend: { show: false },
  // Slice percentages rendered on the ring's edge and clipped against the
  // panel. The centre carries the total and the key below carries the split.
  dataLabels: { enabled: false },
  stroke: { colors: [cssVar('--c-surface', '#FAFCFE')], width: 2 },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          name: { show: true, offsetY: 16, color: cssVar('--c-muted', '#6B7770'), fontSize: '10px' },
          value: { show: true, offsetY: -8, color: cssVar('--c-ink', '#16211E'), fontSize: '20px', fontWeight: 700 },
          total: {
            show: true,
            label: 'beds',
            color: cssVar('--c-muted', '#6B7770'),
            fontSize: '10px',
            formatter: () => String(props.data.rooms.capacity),
          },
        },
      },
    },
  },
  tooltip: { y: { formatter: (v: number) => `${v} bed${v === 1 ? '' : 's'}` } },
}))

const occupancySeries = computed(() => [
  { name: 'Occupied', data: props.data.topOccupied.map((h) => Math.round(h.val * 100)) },
])
const occupancyOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  colors: [cssVar('--c-info', '#0E7490')],
  plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '58%' } },
  xaxis: {
    categories: props.data.topOccupied.map((h) => h.name),
    max: 100,
    labels: {
      formatter: (v: string) => `${Math.round(Number(v))}%`,
      style: { colors: cssVar('--c-muted', '#6B7770'), fontSize: '10px' },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      maxWidth: 130,
      style: { colors: cssVar('--c-text', '#2B3531'), fontSize: '11px' },
    },
  },
  grid: { borderColor: cssVar('--c-border', '#E7ECF2'), strokeDashArray: 3 },
  dataLabels: { enabled: false },
  legend: { show: false },
  tooltip: {
    y: {
      formatter: (_v: number, ctx: { dataPointIndex: number }) =>
        props.data.topOccupied[ctx.dataPointIndex]?.ratio ?? '',
    },
  },
}))
</script>

<style scoped>
.p-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.p-head h2 {
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.p-head p { max-width: 40ch; margin: 3px 0 0; color: var(--c-muted); font-size: 0.8rem; line-height: 1.45; }
.p-link { flex: 0 0 auto; color: var(--c-primary); font-size: 0.8rem; font-weight: 700; text-decoration: none; }
.p-link:hover { text-decoration: underline; }
.p-sub { margin: 0 0 4px; color: var(--c-muted); font-size: 11px; font-weight: 700; }

.hc-grid { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 14px; align-items: center; }
.hc-donut, .hc-ranked { min-width: 0; }

.bed-read { margin: 2px 0 0; color: var(--c-muted); font-size: 11.5px; text-align: center; }
.bed-read b {
  color: var(--c-ink);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.hc-leases { margin-top: auto; padding-top: 14px; border-top: 1px solid var(--c-border); }
.lease-bar { display: flex; gap: 3px; }
.lease-bar > span {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  min-width: 58px;
  padding: 7px 10px;
  border-radius: 3px;
  overflow: hidden;
  color: #fff;
}
.lease-bar b {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}
.lease-bar em {
  overflow: hidden;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  opacity: 0.85;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lease-bar .is-accredited { background: var(--c-primary); }
.lease-bar .is-pipeline { background: var(--c-warning); }
.lease-bar .is-delisted { background: var(--c-border-strong); color: var(--c-text); }

@media (max-width: 760px) {
  .hc-grid { grid-template-columns: 1fr; }
}
</style>
