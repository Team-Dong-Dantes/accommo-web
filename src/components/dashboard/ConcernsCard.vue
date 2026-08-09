<template>
  <q-card class="dashboard-card full-height concerns-card">
    <q-card-section class="q-pa-md concerns-head">
      <div class="text-body2 text-weight-bold" style="line-height: 1.2;">Grievances</div>
      <div class="text-caption text-grey-6 q-mb-sm" style="font-size: 11px;">
        {{ concerns.total }} total · {{ concerns.urgent }} urgent</div>

      <q-separator class="q-mb-md" />

      <div class="row q-col-gutter-xs q-mb-md">
        <div class="col-6">
          <div class="bg-teal-1 rounded-box text-center q-pa-xs">
            <div class="text-subtitle1 text-teal-6 text-weight-bold" style="line-height: 1.1;">{{ concerns.total }}</div>
            <div class="text-grey-6" style="font-size: 9px;">Total</div>
          </div>
        </div>
        <div class="col-6">
          <div class="bg-orange-1 rounded-box text-center q-pa-xs">
            <div class="text-subtitle1 text-orange-6 text-weight-bold" style="line-height: 1.1;">{{ concerns.open }}</div>
            <div class="text-grey-6" style="font-size: 9px;">Pending</div>
          </div>
        </div>
        <div class="col-6">
          <div class="bg-purple-1 rounded-box text-center q-pa-xs">
            <div class="text-subtitle1 text-purple-4 text-weight-bold" style="line-height: 1.1;">{{ concerns.inProgress }}</div>
            <div class="text-grey-6" style="font-size: 9px;">In Review</div>
          </div>
        </div>
        <div class="col-6">
          <div class="bg-green-1 rounded-box text-center q-pa-xs">
            <div class="text-subtitle1 text-green-6 text-weight-bold" style="line-height: 1.1;">{{ concerns.resolved }}</div>
            <div class="text-grey-6" style="font-size: 9px;">Resolved</div>
          </div>
        </div>
      </div>

      <div v-if="concerns.urgent > 0"
        class="bg-red-1 text-red-6 q-pa-xs q-px-sm rounded-box row items-center q-mb-md">
        <Icon icon="mdi:alert-circle" width="14" height="14" class="q-mr-sm" />
        <span class="text-weight-bold" style="font-size: 10px;">{{ concerns.urgent }} urgent case(s) need attention</span>
      </div>
    </q-card-section>

    <q-card-section class="q-pa-md concerns-scroll">
      <div class="text-uppercase text-grey-5" style="font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">
              By Category</div>
            <div class="category-chart">
              <apexchart type="bar" width="100%" height="100%" :options="catChartOptions" :series="catChartSeries" />
            </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  concerns: {
    total: number
    open: number
    inProgress: number
    resolved: number
    rejected: number
    urgent: number
  }
  byCategory: { name: string; val: number; ratio: number; color: string }[]
}>()

const catChartOptions = computed(() => ({
  chart: {
    type: 'bar' as const,
    fontFamily: 'Inter, -apple-system, sans-serif',
    toolbar: { show: false },
  },
  plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '60%' } },
  xaxis: { categories: props.byCategory.map(c => c.name) },
  colors: ['#f59e0b'],
  grid: { borderColor: '#f0f0f0', strokeDashArray: 3 },
}))

const catChartSeries = computed(() => [{
  name: 'Concerns',
  data: props.byCategory.map(c => c.val),
}])
</script>

<style scoped>
.dashboard-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
}

.concerns-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.concerns-head {
  flex-shrink: 0;
}

.concerns-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.category-chart {
  flex: 1;
  min-height: 0;
  position: relative;
}

.category-chart :deep(.apexcharts-canvas) {
  width: 100%;
}

.rounded-box {
  border-radius: 6px;
}
</style>
