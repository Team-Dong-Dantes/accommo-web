<template>
  <q-card class="dashboard-card full-height">
    <q-card-section class="q-pa-md">
      <div class="text-body2 text-weight-bold" style="line-height: 1.2;">Registrations</div>
      <div class="text-caption text-grey-6 q-mb-sm" style="font-size: 11px;">
        Students &amp; landlords · last 30 days</div>

      <q-separator class="q-mb-md" />

      <div class="chart-container q-mb-md">
        <svg viewBox="0 0 400 120" class="full-width" preserveAspectRatio="none">
          <path d="M 0 90 C 50 80, 100 90, 150 60 S 250 10, 300 20 S 350 80, 400 50" fill="none" stroke="#12c299"
            stroke-width="3" stroke-linecap="round" />
          <path d="M 0 105 C 50 105, 100 110, 150 100 S 250 90, 300 85 S 350 100, 400 100" fill="none" stroke="#5b6cf9"
            stroke-width="2" stroke-linecap="round" />
        </svg>
        <div class="row q-gutter-x-md q-mt-xs">
          <div class="row items-center">
            <div class="legend-dot bg-teal-4 q-mr-sm"></div><span class="text-grey-8"
              style="font-size: 10px;">Students</span>
          </div>
          <div class="row items-center">
            <div class="legend-dot bg-indigo-5 q-mr-sm"></div><span class="text-grey-8"
              style="font-size: 10px;">Landlords</span>
          </div>
        </div>
      </div>

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
import type { PendingRegistration } from '@/composables/useDashboardStats'

defineProps<{
  pending: PendingRegistration[]
}>()
</script>

<style scoped>
.dashboard-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
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
