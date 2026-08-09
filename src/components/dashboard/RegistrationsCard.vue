<template>
  <q-card class="dashboard-card full-height reg-card">
    <q-card-section class="q-pa-md reg-head">
      <div class="text-body2 text-weight-bold" style="line-height: 1.2;">Registrations</div>
      <div class="text-caption text-grey-6 q-mb-sm" style="font-size: 11px;">
        Students &amp; landlords · last 30 days</div>

      <q-separator class="q-mb-md" />

      <div class="q-mb-md">
              <apexchart type="area" height="100" :options="sparkOptions" :series="sparkSeries" />
            </div>
    </q-card-section>

    <q-card-section class="q-pa-md reg-scroll">
      <div class="text-uppercase text-grey-5 q-mb-sm" style="font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">
        Pending Registrations</div>

      <q-list class="q-gutter-y-xs">
        <q-item v-for="user in pending" :key="user.name + user.time" class="q-pa-none" style="min-height: 40px;">
          <q-item-section avatar style="min-width: 40px;">
            <q-avatar size="30px" :color="user.color" text-color="white" class="text-weight-bold"
              style="font-size: 12px;">{{ user.initials }}</q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold" style="font-size: 13px;">{{ user.name }}</q-item-label>
            <q-item-label class="text-grey-6" style="font-size: 10px;">{{ user.time }}</q-item-label>
          </q-item-section>
          <q-item-section side class="row no-wrap items-center q-gutter-x-sm">
            <span :class="`text-${user.roleColor}`" style="font-size: 10px; font-weight: 600;">{{ user.role }}</span>
            <div :class="`pill bg-${user.statusColor}-1 text-${user.statusColor}`">{{ user.status }}</div>
          </q-item-section>
        </q-item>
        <div v-if="pending.length === 0" class="text-grey-5 text-caption q-py-sm">No pending registrations.</div>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PendingRegistration } from '@/composables/useDashboardStats'

const props = defineProps<{
  pending: PendingRegistration[]
}>()

const sparkOptions = computed(() => ({
  chart: {
    type: 'area' as const,
    sparkline: { enabled: true },
    fontFamily: 'Inter, sans-serif',
  },
  stroke: { curve: 'smooth' as const, width: 2 },
  fill: { type: 'gradient' as const, gradient: { shade: 'light', opacityFrom: 0.3, opacityTo: 0 } },
  colors: ['#0d9488'],
  tooltip: { enabled: false },
  xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { show: false, min: 0 },
  grid: { show: false, padding: { left: 0, right: 0, top: 10, bottom: 0 } },
}))

const sparkSeries = computed(() => [{
  name: 'Registrations',
  data: props.pending.length > 0
    ? Array.from({ length: 12 }, (_, i) => Math.max(0, props.pending.length - i * 2 + Math.round(Math.random() * 5)))
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}])
</script>

<style scoped>
.dashboard-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
}

.reg-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reg-head {
  flex-shrink: 0;
}

.reg-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.chart-container {
  position: relative;
  height: 110px;
}

.legend-dot {
  width: 10px;
  height: 4px;
  border-radius: 2px;
}

.pill {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
}
</style>
