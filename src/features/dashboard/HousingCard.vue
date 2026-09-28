<template>
  <DashCard
    icon="lucide:bed-double"
    title="Housing supply"
    :summary="summary"
    :link="{ to: '/room-hub', label: 'Rooms' }"
  >
    <div class="dc-sec dc-fill split">
      <div class="donut">
        <ChartCard
          type="donut" preset="donut" height="100%"
          :series="bedSeries" :options="bedOptions"
          :has-data="data.rooms.capacity > 0"
          empty-text="No rooms recorded"
        />
      </div>
      <div class="fullest">
        <p class="dc-label">Fullest accommodations</p>
        <ul v-if="fullest.length" class="bars">
          <li v-for="house in fullest" :key="house.name">
            <span class="name" :title="house.name">{{ house.name }}</span>
            <span class="track"><i :style="{ width: `${house.pct}%` }" /></span>
            <span class="val">{{ house.ratio }}</span>
          </li>
        </ul>
        <p v-else class="none">No accommodation has boarders yet.</p>
      </div>
    </div>

    <div class="dc-sec">
      <p class="dc-label">Active leases, by the accreditation of the house</p>
      <div v-if="leaseBands.length" class="dc-band" role="img" :aria-label="leaseLabel">
        <span v-for="band in leaseBands" :key="band.label" :class="band.cls" :style="{ flexGrow: band.value }">
          <b>{{ band.value }}</b><em>{{ band.label }}</em>
        </span>
      </div>
      <p v-else class="none">No active leases.</p>
    </div>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import DashCard from './DashCard.vue'
import { cssVar } from '@/utils/chartTheme'
import type { DashboardStats } from '@/types/dashboard'

const props = defineProps<{ data: DashboardStats }>()

const rooms = computed(() => props.data.rooms)
const freeBeds = computed(() => Math.max(0, rooms.value.capacity - rooms.value.pax))

const summary = computed(() =>
  rooms.value.capacity === 0
    ? 'No rooms recorded yet.'
    : `${freeBeds.value} of ${rooms.value.capacity} beds free across ${rooms.value.total} rooms`,
)

// Four fit beside the donut; the room hub has the rest.
const fullest = computed(() =>
  props.data.topOccupied.slice(0, 4).map((house) => ({
    ...house,
    pct: Math.max(4, Math.round(house.val * 100)),
  })),
)

const leases = computed(() => props.data.leasesByAccreditation)
const leaseBands = computed(() =>
  [
    { label: 'Accredited', value: leases.value.accredited, cls: 'is-good' },
    { label: 'Pipeline', value: leases.value.pipeline, cls: '' },
    { label: 'Delisted', value: leases.value.delisted, cls: 'is-late' },
  ].filter((band) => band.value > 0),
)
const leaseLabel = computed(() => leaseBands.value.map((b) => `${b.label}: ${b.value}`).join(', '))

const bedSeries = computed(() => [rooms.value.pax, freeBeds.value])
const bedOptions = computed(() => ({
  labels: ['Taken', 'Free'],
  colors: [cssVar('--c-primary', '#0F766E'), cssVar('--c-surface-2', '#EEF2F8')],
  legend: { show: false },
  dataLabels: { enabled: false },
  stroke: { colors: [cssVar('--c-surface', '#FAFCFE')], width: 2 },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          // Apex draws the name above the value; these swap them, with room between.
          name: { show: true, offsetY: 26, color: cssVar('--c-muted', '#6B7770'), fontSize: '10px' },
          value: { show: true, offsetY: -14, color: cssVar('--c-ink', '#16211E'), fontSize: '18px', fontWeight: 700 },
          total: {
            show: true,
            label: 'beds taken',
            color: cssVar('--c-muted', '#6B7770'),
            fontSize: '10px',
            formatter: () => `${rooms.value.occupancyPct || 0}%`,
          },
        },
      },
    },
  },
  tooltip: { y: { formatter: (v: number) => `${v} bed${v === 1 ? '' : 's'}` } },
}))
</script>

<style scoped>
.dc-sec.dc-fill.split {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: center;
  gap: var(--sp-4);
}
.donut { height: 100%; min-height: 0; }

.bars { display: flex; flex-direction: column; gap: 7px; margin: 0; padding: 0; list-style: none; }
.bars li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr) auto;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-xs);
}
.name { overflow: hidden; color: var(--c-text); text-overflow: ellipsis; white-space: nowrap; }
.track { height: 6px; border-radius: 3px; background: var(--c-surface-2); overflow: hidden; }
.track i { display: block; height: 100%; background: var(--c-info); }
.val { color: var(--c-ink); font-variant-numeric: tabular-nums; font-weight: 700; }
.none { margin: 0; color: var(--c-muted); font-size: var(--fs-xs); }
</style>
