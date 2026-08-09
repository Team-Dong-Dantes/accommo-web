<template>
  <q-page class="dashboard-page q-pa-md bg-grey-1" :style="pageStyle">
    <div class="row items-center justify-end q-mb-md non-shrink">
      <span v-if="lastUpdated" class="text-caption text-grey-6 q-mr-sm">Updated {{ lastUpdated }}</span>
      <q-btn flat round dense color="teal-7" @click="refresh" :loading="loading" aria-label="Refresh">
        <Icon icon="mdi:refresh" width="20" height="20" />
      </q-btn>
    </div>

    <q-banner v-if="error" class="bg-red-1 text-red-8 q-mb-md non-shrink" rounded>
      <Icon icon="mdi:alert-circle" width="20" height="20" />
      {{ error }}
      <template #action>
        <q-btn flat dense color="red-8" label="Retry" @click="refresh" />
      </template>
    </q-banner>

    <div class="non-shrink">
      <StatCards :properties="data.properties" :rooms="data.rooms" :students="data.students" />
    </div>

    <div class="dashboard-main">
      <div class="dashboard-row">
        <div class="card-col wide">
          <q-card class="chart-card">
            <q-card-section class="q-pa-md card-head">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">Occupancy by Room Type</div>
              <div class="text-caption text-grey-6 q-mb-sm" style="font-size:11px">
                {{ data.rooms.total }} rooms · {{ data.rooms.capacity }} capacity · {{ data.rooms.occupancyPct }}% occupied
              </div>
            </q-card-section>
            <div class="chart-box">
              <apexchart type="bar" width="100%" height="100%" :options="roomsByTypeOptions" :series="roomsByTypeSeries" />
            </div>
          </q-card>
        </div>
        <div class="card-col">
          <RegistrationsCard :pending="data.pendingRegistrations" />
        </div>
      </div>

      <div class="dashboard-row">
        <div class="card-col">
          <q-card class="chart-card">
            <q-card-section class="q-pa-md card-head">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">Concerns by Category</div>
              <div class="text-caption text-grey-6 q-mb-sm" style="font-size:11px">
                {{ data.concerns.total }} total · {{ data.concerns.urgent }} urgent
              </div>
            </q-card-section>
            <div class="chart-box">
              <apexchart type="bar" width="100%" height="100%" :options="concernsOptions" :series="concernsSeries" />
            </div>
          </q-card>
        </div>
        <div class="card-col">
          <q-card class="chart-card">
            <q-card-section class="q-pa-md card-head">
              <div class="text-subtitle2 text-weight-bold q-mb-sm">Students by Year Level</div>
              <div class="text-caption text-grey-6 q-mb-sm" style="font-size:11px">
                {{ data.students.total }} students · {{ data.studentsByCollege.length }} colleges
              </div>
            </q-card-section>
            <div class="chart-box">
              <apexchart type="bar" width="100%" height="100%" :options="yearLevelOptions" :series="yearLevelSeries" />
            </div>
          </q-card>
        </div>
        <div class="card-col">
          <GrievancesCard :concerns="data.concerns" :by-category="data.concernsByCategory" />
        </div>
      </div>
    </div>

    <q-inner-loading :showing="loading && !hasData">
      <q-spinner-dots size="40px" color="teal-7" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useDashboardStats } from '@/composables/useDashboardStats'
import StatCards from '@/components/dashboard/StatCards.vue'
import RegistrationsCard from '@/components/dashboard/RegistrationsCard.vue'
import GrievancesCard from '@/components/dashboard/ConcernsCard.vue'

const { loading, error, data, load } = useDashboardStats()
const lastUpdated = ref<string | null>(null)
const hasData = ref(false)

const isEmpty = computed(() =>
  data.properties.total === 0 &&
  data.rooms.total === 0 &&
  data.students.total === 0 &&
  data.concerns.total === 0
)

async function refresh() {
  await load()
  hasData.value = true
  lastUpdated.value = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

onMounted(refresh)

// --- Fit-to-viewport sizing (no page scroll on desktop) ---
const pageStyle = ref<Record<string, string>>({ height: '100%', overflow: 'hidden' })
let ro: ResizeObserver | null = null

function measure() {
  const width = window.innerWidth
  if (width < 800) {
    pageStyle.value = { height: 'auto', overflow: 'visible' }
    return
  }
  const header = document.querySelector('.q-header')
  const headerH = header instanceof HTMLElement ? header.offsetHeight : 0
  pageStyle.value = { height: `${window.innerHeight - headerH}px`, overflow: 'hidden' }
}

onMounted(() => {
  measure()
  const header = document.querySelector('.q-header')
  if (typeof ResizeObserver !== 'undefined' && header) {
    ro = new ResizeObserver(measure)
    ro.observe(header)
  }
  window.addEventListener('resize', measure)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  window.removeEventListener('resize', measure)
})

const theme = {
  chart: { fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
  grid: { borderColor: '#f0f0f0', strokeDashArray: 3 },
}

const roomsByTypeOptions = computed(() => ({
  ...theme,
  xaxis: { categories: data.roomsByType.map(r => r.type) },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
  colors: ['#0d9488'],
}))

const roomsByTypeSeries = computed(() => [{
  name: 'Rooms', data: data.roomsByType.map(r => r.capacity),
}])

const concernsOptions = computed(() => ({
  ...theme,
  xaxis: { categories: data.concernsByCategory.map(c => c.name) },
  plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '60%' } },
  colors: ['#f59e0b'],
}))

const concernsSeries = computed(() => [{
  name: 'Concerns', data: data.concernsByCategory.map(c => c.val),
}])

const yearLevelOptions = computed(() => ({
  ...theme,
  xaxis: { categories: data.studentsByYear.map(y => y.year) },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
  colors: ['#6366f1'],
}))

const yearLevelSeries = computed(() => [{
  name: 'Students', data: data.studentsByYear.map(y => y.val),
}])
</script>

<style scoped>
.dashboard-page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-page .non-shrink {
  flex-shrink: 0;
}

.dashboard-main {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 4px;
}

.dashboard-row {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  gap: 16px;
}

.card-col {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.card-col.wide {
  flex-grow: 2;
}

.card-col > * {
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.chart-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-card .card-head {
  flex-shrink: 0;
}

.chart-box {
  flex: 1;
  min-height: 0;
  position: relative;
  padding: 0 16px 16px;
}

.chart-box :deep(.apexcharts-canvas) {
  width: 100%;
}

@media (max-width: 799.98px) {
  .dashboard-page {
    height: auto !important;
    overflow: visible;
  }
  .dashboard-main {
    flex: none;
    display: block;
  }
  .dashboard-row {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .card-col {
    flex: 1 1 100%;
  }
  .chart-box {
    min-height: 200px;
  }
}

@media (min-height: 900px) {
  .dashboard-main {
    gap: 20px;
  }
  .dashboard-row {
    gap: 20px;
  }
}
</style>