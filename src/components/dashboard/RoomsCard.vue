<template>
  <q-card class="dashboard-card full-height">
    <q-card-section class="q-pa-md">
      <div class="text-body2 text-weight-bold" style="line-height: 1.2;">Rooms</div>
      <div class="text-caption text-grey-6 q-mb-sm" style="font-size: 11px;">
        {{ rooms.total }} total · {{ rooms.available }} available</div>

      <q-separator class="q-mb-md" />

      <div class="row items-center q-mb-md q-pt-xs">
        <div class="relative-position q-mr-md" style="width: 64px; height: 64px;">
          <svg viewBox="0 0 36 36" class="full-width">
            <path class="text-grey-3" stroke-width="4" stroke="currentColor" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="text-teal-5" :stroke-dasharray="`${rooms.occupancyPct}, 100`" stroke-width="4" stroke="currentColor" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div class="absolute-center text-weight-bold text-teal-7" style="font-size: 12px;">{{ rooms.occupancyPct }}%</div>
        </div>
        <div class="col column q-gutter-y-xs">
          <div class="row justify-between" style="font-size: 11px;"><span class="text-grey-7">Total Rooms</span><span
              class="text-weight-bold">{{ rooms.total }}</span></div>
          <div class="row justify-between" style="font-size: 11px;"><span class="text-grey-7">Occupied</span><span
              class="text-weight-bold text-teal-6">{{ rooms.occupied }}</span></div>
          <div class="row justify-between" style="font-size: 11px;"><span class="text-grey-7">Available</span><span
              class="text-weight-bold text-orange-6">{{ rooms.available }}</span></div>
          <div class="row justify-between" style="font-size: 11px;"><span class="text-grey-7">Capacity</span><span
              class="text-weight-bold text-indigo-5">{{ rooms.capacity }}</span></div>
        </div>
      </div>

      <div class="text-uppercase text-grey-5 q-mb-xs" style="font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">
        Rooms by Room Type</div>
      <div class="row items-end justify-between q-mb-md" style="height: 45px;">
        <div v-for="t in roomsByType" :key="t.type" class="column items-center">
          <div class="bar bg-teal-4" :style="{ height: `${typeHeight(t.capacity)}px` }"></div>
          <span class="text-grey-6" style="font-size: 9px; margin-top: 4px;">{{ t.type }}</span>
        </div>
      </div>

      <div class="text-uppercase text-grey-5 q-mb-xs" style="font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">
        Most Occupied</div>
      <div class="column q-gutter-y-sm">
        <div v-for="place in topOccupied" :key="place.name">
          <div class="row justify-between q-mb-xs" style="font-size: 11px;"><span class="text-grey-8">{{ place.name
              }}</span><span class="text-orange-6 text-weight-bold">{{ place.ratio }}</span></div>
          <q-linear-progress rounded size="4px" :value="place.val" color="orange-4" track-color="grey-2" />
        </div>
        <div v-if="topOccupied.length === 0" class="text-grey-5 text-caption">No occupied rooms yet.</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  rooms: { total: number; occupied: number; available: number; capacity: number; occupancyPct: number }
  roomsByType: { type: string; capacity: number; count: number }[]
  topOccupied: { name: string; ratio: string; val: number }[]
}>()

const maxTypeCapacity = computed(() =>
  Math.max(1, ...props.roomsByType.map((t) => t.capacity)),
)

function typeHeight(capacity: number) {
  return Math.max(8, Math.round((capacity / maxTypeCapacity.value) * 35))
}
</script>

<style scoped>
.dashboard-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
}

.bar {
  width: 12px;
  border-radius: 3px 3px 0 0;
}
</style>
