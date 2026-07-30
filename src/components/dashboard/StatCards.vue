<template>
  <div class="row q-col-gutter-md q-mb-md">
    <div v-for="stat in stats" :key="stat.title" class="col-6 col-sm-4 col-md-2">
      <q-card class="stat-card full-height">
        <q-card-section class="row items-center no-wrap q-pa-md">
          <div class="icon-box flex flex-center shrink-0" :class="`bg-${stat.color}-1 text-${stat.color}`">
            <Icon :icon="stat.icon" width="22" height="22" />
          </div>

          <div class="q-ml-sm" style="min-width: 0;">
            <div class="text-subtitle1 text-weight-bold ellipsis" style="line-height: 1.1">{{ stat.value }}</div>
            <div class="text-uppercase text-grey-6 ellipsis"
              style="font-size: 9px; font-weight: 800; letter-spacing: 0.3px;">{{ stat.title }}</div>
            <div :class="`text-${stat.subColor} ellipsis`" style="font-size: 10px; margin-top: 2px;">{{ stat.subtitle }}
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  properties: { total: number; accredited: number; avgRent: number }
  rooms: { total: number; capacity: number; occupancyPct: number }
  students: { total: number; newThisMonth: number }
}>()

const stats = computed(() => {
  const pax = props.rooms.capacity > 0 ? Math.round((props.rooms.capacity * props.rooms.occupancyPct) / 100) : 0
  return [
    {
      value: props.properties.total,
      title: 'Properties',
      subtitle: `${props.properties.accredited} verified`,
      icon: 'mdi:home-city-outline',
      color: 'teal',
      subColor: 'teal',
    },
    {
      value: props.rooms.total,
      title: 'Total Rooms',
      subtitle: `${props.rooms.capacity} capacity`,
      icon: 'mdi:bed-king-outline',
      color: 'indigo',
      subColor: 'indigo-4',
    },
    {
      value: props.students.total,
      title: 'Students',
      subtitle: `${props.rooms.occupancyPct}% occupancy`,
      icon: 'mdi:account-group',
      color: 'blue',
      subColor: 'blue-5',
    },
    {
      value: `₱${props.properties.avgRent.toLocaleString()}`,
      title: 'Avg Rent',
      subtitle: 'per month',
      icon: 'mdi:currency-usd',
      color: 'green',
      subColor: 'teal',
    },
    {
      value: `${props.rooms.occupancyPct}%`,
      title: 'Occupancy',
      subtitle: `${pax}/${props.rooms.capacity} slots`,
      icon: 'mdi:chart-box-outline',
      color: 'deep-purple',
      subColor: 'deep-purple-4',
    },
    {
      value: props.students.newThisMonth,
      title: 'New This Month',
      subtitle: 'Students registered',
      icon: 'mdi:trending-up',
      color: 'orange',
      subColor: 'orange-6',
    },
  ]
})
</script>

<style scoped>
.stat-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.shrink-0 {
  flex-shrink: 0;
}
</style>
