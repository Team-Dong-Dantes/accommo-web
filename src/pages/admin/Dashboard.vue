<template>
  <q-page
    class="dash-page"
    :class="{ 'is-loading': loading && !hasData }"
  >
    <!-- Header -->
    <header class="dash-head">
      <div class="head-left">
        <div class="greet-row">
          <span class="greet">{{ greet }}</span>
          <span class="who">Administrator</span>
        </div>
        <div class="dash-date">{{ today }}</div>
      </div>
      <div class="head-right">
        <q-chip class="period-chip" flat>{{ periodLabel }}</q-chip>
        <q-btn flat dense color="grey-6" class="refresh-btn" @click="refresh" :loading="loading">
          <Icon icon="mdi:refresh" :width="18" :height="18" />
          <q-tooltip>Refresh</q-tooltip>
        </q-btn>
      </div>
    </header>

    <!-- Bento grid -->
    <section class="main-grid">
      <!-- KPIs: 2x2 on the left -->
      <q-card
        v-for="(kpi, i) in kpis"
        :key="kpi.label"
        flat
        class="kpi-card rise-in area-kpi"
        :class="kpi.feature ? 'kpi-feature' : 'bg-surface border-token'"
        :style="{ ...kpiPlace(i), animationDelay: i * 55 + 'ms' }"
      >
        <div class="kpi-top">
          <span class="kpi-label">{{ kpi.label }}</span>
          <div class="kpi-ico" :class="kpi.feature ? 'on-feature' : 'on-light'">
            <Icon :icon="kpi.icon" :width="17" :height="17" :color="kpi.feature ? 'white' : 'var(--c-primary)'" />
          </div>
        </div>
        <div class="kpi-val text-display">{{ kpi.value }}</div>
        <div class="kpi-foot">
          <span class="trend" :class="[kpi.trend === 'flat' ? 'neutral' : kpi.trend, kpi.feature ? 'on-feature' : 'on-light']">
            <Icon v-if="kpi.trend !== 'flat'" :icon="kpi.trend === 'up' ? 'mdi:arrow-up-right' : 'mdi:arrow-down-right'" :width="13" :height="13" />
            {{ kpi.delta }}
          </span>
          <span class="kpi-foot-label" :class="kpi.feature ? 'on-feature' : ''">{{ kpi.deltaLabel }}</span>
        </div>
      </q-card>
      <!-- Registration trends (hero) -->
      <q-card flat class="bg-surface border-token card-radius q-pa-md column area-trends tile rise-in" style="animation-delay:0ms;">
        <div class="card-head">
          <div class="row items-center no-wrap card-head-title" style="gap:8px;">
            <div class="card-head-ico"><Icon icon="mdi:chart-line" :width="15" :height="15" /></div>
            <span class="text-ink text-weight-bold">Registration Trends</span>
          </div>
          <span class="card-sub">Students &amp; landlords · last 7 months</span>
          <div class="row legend" style="gap:14px;">
            <div class="row items-center" style="gap:5px;"><span class="dot" style="background:var(--c-primary)" /><span class="text-caption text-weight-bold" style="color:var(--c-ink)">Students</span></div>
            <div class="row items-center" style="gap:5px;"><span class="dot" style="background:var(--c-accent)" /><span class="text-caption text-weight-bold" style="color:var(--c-ink)">Landlords</span></div>
          </div>
        </div>
        <div class="chart-wrap">
          <apexchart type="area" height="100%" :options="regOptions" :series="regSeries" />
        </div>
      </q-card>

      <!-- Pending approvals -->
      <q-card flat class="bg-surface border-token card-radius column area-regis tile rise-in" style="animation-delay:60ms;">
        <div class="q-pa-md row justify-between items-center pending-head">
          <div>
            <div class="row items-center no-wrap" style="gap:8px;">
              <div class="card-head-ico"><Icon icon="mdi:account-clock-outline" :width="15" :height="15" /></div>
              <span class="text-ink text-weight-bold">Pending Approvals</span>
            </div>
            <span class="card-sub">{{ data.pendingRegistrations.length }} awaiting review</span>
          </div>
          <q-input outlined dense rounded v-model="searchFilter" placeholder="Search" class="search-input" style="width:140px;">
            <template #prepend><Icon icon="mdi:magnify" :width="15" :height="15" /></template>
          </q-input>
        </div>
        <div class="pending-body">
          <q-markup-table v-if="filteredPending.length" flat class="bg-transparent text-left dashboard-table">
            <thead>
              <tr>
                <th style="width:36px;"></th>
                <th>Name</th>
                <th>Role</th>
                <th>Joined</th>
                <th style="width:84px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredPending" :key="user.name + user.time">
                <td>
                  <q-avatar size="34px" :color="user.color" text-color="white" class="text-weight-bold" style="font-size:13px;border-radius:8px;">{{ user.initials }}</q-avatar>
                </td>
                <td class="text-ink text-weight-medium" style="max-width:140px;"><span class="ellipsis" style="display:inline-block;">{{ user.name }}</span></td>
                <td>
                  <q-chip dense :color="user.role === 'Landlord' ? 'primary' : 'secondary'" :text-color="user.role === 'Landlord' ? 'white' : 'white'" class="text-weight-bold" style="font-size:10px;margin:0;height:20px;">{{ user.role }}</q-chip>
                </td>
                <td style="font-size:12px;color:var(--c-muted)">{{ user.time }}</td>
                <td class="text-right">
                  <q-btn unelevated dense color="primary" text-color="white" no-caps class="review-btn" @click="$router.push('/verifications')">Review</q-btn>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
          <div v-else class="full-width flex-center text-muted text-caption q-pa-xl column">
            <Icon icon="mdi:check-decagram-outline" :width="30" :height="30" class="q-mb-sm" />
            All caught up — no pending approvals.
          </div>
        </div>
      </q-card>

      <!-- Students by college -->
      <q-card flat class="bg-surface border-token card-radius q-pa-md column area-college tile rise-in" style="animation-delay:120ms;">
        <div class="card-head compact">
          <div class="row items-center no-wrap card-head-title" style="gap:8px;">
            <div class="card-head-ico"><Icon icon="mdi:school-outline" :width="15" :height="15" /></div>
            <span class="text-ink text-weight-bold">By College</span>
          </div>
          <span class="card-sub">{{ data.students.total }} boarders</span>
        </div>
        <div v-if="data.studentsByCollege.length" class="college-list flex-1 column" style="gap:9px;overflow:auto;">
          <div v-for="c in data.studentsByCollege" :key="c.name" class="column" style="gap:3px;">
            <div class="row items-center justify-between no-wrap" style="gap:8px;">
              <span class="text-ink text-weight-medium ellipsis" style="font-size:12px;">{{ c.name }}</span>
              <span class="text-muted" style="font-size:11px;">{{ c.val }} · {{ c.pct }}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" :style="{ width: `${c.ratio * 100}%` }"></div></div>
          </div>
        </div>
        <div v-else class="full-width flex-center text-muted text-caption flex-1 column">
          <Icon icon="mdi:school-outline" :width="28" :height="28" class="q-mb-xs" />No data
        </div>
      </q-card>

      <!-- Most occupied -->
      <q-card flat class="bg-surface border-token card-radius q-pa-md column area-occupied tile rise-in" style="animation-delay:180ms;">
        <div class="card-head compact">
          <div class="row items-center no-wrap card-head-title" style="gap:8px;">
            <div class="card-head-ico"><Icon icon="mdi:home-city-outline" :width="15" :height="15" /></div>
            <span class="text-ink text-weight-bold">Most Occupied</span>
          </div>
          <span class="card-sub">Top properties</span>
        </div>
        <div class="chart-wrap flex flex-center">
          <apexchart v-if="data.topOccupied.length" type="bar" height="100%" :options="topOptions" :series="topSeries" />
          <div v-else class="full-width flex-center text-muted text-caption">No occupancy data</div>
        </div>
      </q-card>

      <!-- Demographics -->
      <q-card flat class="bg-surface border-token card-radius q-pa-md column area-demo tile rise-in" style="animation-delay:360ms;">
        <div class="card-head compact">
          <div class="row items-center no-wrap card-head-title" style="gap:8px;">
            <div class="card-head-ico"><Icon icon="mdi:account-details-outline" :width="15" :height="15" /></div>
            <span class="text-ink text-weight-bold">Demographics</span>
          </div>
          <span class="card-sub">Gender &amp; year</span>
        </div>
        <div class="row no-wrap flex-1 items-center demo-body" style="gap:14px;min-height:0;">
          <div class="chart-wrap flex-1 flex flex-center" style="max-width:140px;">
            <apexchart v-if="genderTotal" type="donut" width="100%" height="100%" :options="genderOptions" :series="genderSeries" />
            <div v-else class="text-muted text-caption">No data</div>
          </div>
          <div class="col column justify-center" style="gap:8px;">
            <div v-for="y in data.studentsByYear" :key="y.year" class="column" style="gap:2px;">
              <div class="row items-center justify-between no-wrap">
                <span class="text-ink text-weight-medium" style="font-size:11px;">{{ y.year }}</span>
                <span class="text-muted" style="font-size:11px;">{{ y.val }}</span>
              </div>
              <div class="progress-track"><div class="progress-fill accent" :style="{ width: `${yearMax ? (y.val / yearMax) * 100 : 0}%` }"></div></div>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Room types -->
      <q-card flat class="bg-surface border-token card-radius q-pa-md column area-roomtypes tile rise-in" style="animation-delay:420ms;">
        <div class="card-head compact">
          <div class="row items-center no-wrap card-head-title" style="gap:8px;">
            <div class="card-head-ico"><Icon icon="mdi:bed-outline" :width="15" :height="15" /></div>
            <span class="text-ink text-weight-bold">Room Types</span>
          </div>
          <span class="card-sub">Capacity share</span>
        </div>
        <div class="chart-wrap flex flex-center">
          <apexchart v-if="data.roomsByType.length" type="donut" width="100%" height="100%" :options="typeOptions" :series="typeSeries" />
          <div v-else class="full-width flex-center text-muted text-caption">No room data</div>
        </div>
      </q-card>

    </section>

    <q-inner-loading :showing="loading && !hasData">
      <q-spinner-dots size="40px" color="primary" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useDashboardStats } from '@/composables/useDashboardStats'
import { Icon } from '@iconify/vue'
import { chartTheme, donutTotal } from '@/utils/chartTheme'

const { loading, data, load } = useDashboardStats()
const hasData = ref(false)
const searchFilter = ref('')

onMounted(async () => {
  await load()
  hasData.value = true
})

const periodLabel = 'Last 7 months'

const now = new Date()
const hour = now.getHours()
const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

function refresh() {
  load()
}

const kpis = computed(() => [
  { label: 'Total Students', value: data.students.total.toLocaleString(), delta: `+${data.students.newThisMonth}`, deltaLabel: 'new this month', trend: 'up' as const, icon: 'mdi:account-group-outline', feature: true },
  { label: 'Active Properties', value: data.properties.accredited.toLocaleString(), delta: `${data.queue.pendingProperties} pending`, deltaLabel: 'review queue', trend: data.queue.pendingProperties > 0 ? 'up' as const : 'flat' as const, icon: 'mdi:home-city-outline' },
  { label: 'Occupancy Rate', value: `${data.rooms.occupancyPct}%`, delta: `${data.activeLeases} leases`, deltaLabel: 'currently active', trend: 'flat' as const, icon: 'mdi:chart-pie' },
  { label: 'Open Concerns', value: data.concerns.open.toLocaleString(), delta: `${data.concerns.urgent} urgent`, deltaLabel: 'needs attention', trend: data.concerns.urgent > 0 ? 'up' as const : 'flat' as const, icon: 'mdi:alert-circle-outline' },
])

const kpiGrid = [
  { gridColumn: '1', gridRow: '1' },
  { gridColumn: '2', gridRow: '1' },
  { gridColumn: '1', gridRow: '2' },
  { gridColumn: '2', gridRow: '2' },
]
const kpiPlace = (i: number) => kpiGrid[i] ?? {}

const filteredPending = computed(() => {
  if (!searchFilter.value) return data.pendingRegistrations
  const q = searchFilter.value.toLowerCase()
  return data.pendingRegistrations.filter(u => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q))
})

const concernCats = computed(() => {
  const ct = chartTheme()
  return data.concernsByCategory.slice(0, 4).map((c, i) => ({
    ...c,
    color: ct.palette[i % ct.palette.length],
  }))
})

const genderTotal = computed(() => data.gender.female + data.gender.male + data.gender.other)
const genderSeries = computed(() => [data.gender.female, data.gender.male, data.gender.other])
const yearMax = computed(() => Math.max(1, ...data.studentsByYear.map((y) => y.val)))

/* ---- Registration trends: smooth area ---- */
const regOptions = computed(() => {
  const ct = chartTheme()
  return {
    chart: { type: 'area' as const, toolbar: { show: false }, fontFamily: ct.fontFamily, height: '100%', background: 'transparent', animations: { enabled: true, speed: 500 } },
    colors: [ct.palette[0], ct.palette[1]],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' as const, width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.04, stops: [0, 90, 100] } },
    xaxis: {
      categories: data.registrationsByMonth.map(r => r.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: ct.axisColor, fontWeight: 500, fontSize: '10px' } },
    },
    yaxis: { show: false },
    grid: { show: true, borderColor: ct.gridColor, strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { left: 0, right: 0, top: 0, bottom: 0 } },
    legend: { show: false },
    tooltip: { theme: ct.tooltipTheme, shared: true, intersect: false },
  }
})
const regSeries = computed(() => [
  { name: 'Students', data: data.registrationsByMonth.map(r => r.students) },
  { name: 'Landlords', data: data.registrationsByMonth.map(r => r.landlords) },
])

/* ---- Most occupied: horizontal bar ---- */
const topOptions = computed(() => {
  const ct = chartTheme()
  return {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: ct.fontFamily, height: '100%', background: 'transparent' },
    plotOptions: { bar: { horizontal: true, borderRadius: 5, columnWidth: '60%', distributed: false } },
    colors: [ct.palette[0]],
    dataLabels: { enabled: true, formatter: (val: number) => `${val}%`, style: { fontSize: '10px', colors: [ct.surface] }, offsetX: 0 },
    xaxis: {
      categories: data.topOccupied.map(t => t.name),
      max: 100,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: ct.axisColor, fontWeight: 500, fontSize: '10px' } },
    },
    yaxis: { labels: { style: { colors: ct.inkColor, fontWeight: 600, fontSize: '11px' } } },
    grid: { show: true, borderColor: ct.gridColor, strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { theme: ct.tooltipTheme, y: { formatter: (v: number) => `${v}%` } },
  }
})
const topSeries = computed(() => [
  { name: 'Occupancy', data: data.topOccupied.map(t => Math.round(t.val * 100)) },
])

/* ---- Room types: donut with center total ---- */
const typeOptions = computed(() => {
  const ct = chartTheme()
  return {
    chart: { type: 'donut' as const, toolbar: { show: false }, height: '100%', fontFamily: ct.fontFamily, background: 'transparent' },
    labels: data.roomsByType.map(t => t.type),
    colors: ct.palette,
    dataLabels: { enabled: false },
    legend: { position: 'bottom' as const, fontSize: '10px', labels: { colors: ct.axisColor }, markers: { width: 8, height: 8, radius: 4 } },
    plotOptions: { pie: { donut: { size: '58%', labels: { show: true, total: { show: true, label: 'Beds', color: ct.inkColor, fontSize: '13px', fontWeight: 700, formatter: (w: any) => String(donutTotal(w)) } } } } },
    stroke: { colors: [ct.surface], width: 2 },
    tooltip: { theme: ct.tooltipTheme },
  }
})
const typeSeries = computed(() => data.roomsByType.map(t => t.capacity))

/* ---- Concerns: donut + bars ---- */
const concernSeries = computed(() => [data.concerns.open, data.concerns.inProgress, data.concerns.resolved, data.concerns.rejected])
const concernOptions = computed(() => {
  const ct = chartTheme()
  return {
    chart: { type: 'donut' as const, toolbar: { show: false }, height: '100%', fontFamily: ct.fontFamily, background: 'transparent' },
    labels: ['Open', 'In Prog.', 'Resolved', 'Rejected'],
    colors: [ct.palette[3] ?? ct.palette[0], ct.palette[1], ct.palette[4] ?? ct.palette[0], ct.palette[5] ?? '#b8c0cc'],
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: { pie: { donut: { size: '60%', labels: { show: true, total: { show: true, label: 'Total', color: ct.inkColor, fontSize: '12px', fontWeight: 700, formatter: (w: any) => String(donutTotal(w)) } } } } },
    stroke: { colors: [ct.surface], width: 2 },
    tooltip: { theme: ct.tooltipTheme },
  }
})

/* ---- Demographics: gender donut ---- */
const genderOptions = computed(() => {
  const ct = chartTheme()
  return {
    chart: { type: 'donut' as const, toolbar: { show: false }, height: '100%', fontFamily: ct.fontFamily, background: 'transparent' },
    labels: ['Female', 'Male', 'Other'],
    colors: [ct.palette[2], ct.palette[0], ct.palette[5] ?? '#b8c0cc'],
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: { pie: { donut: { size: '60%', labels: { show: true, total: { show: true, label: 'Students', color: ct.inkColor, fontSize: '11px', fontWeight: 700, formatter: (w: any) => String(donutTotal(w)) } } } } },
    stroke: { colors: [ct.surface], width: 2 },
    tooltip: { theme: ct.tooltipTheme },
  }
})
</script>

<style scoped>
.dash-page {
  background-color: var(--c-bg);
  min-height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  padding: var(--sp-4);
  box-sizing: border-box;
}

/* ---- Header ---- */
.dash-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  flex-wrap: wrap;
  padding-bottom: var(--sp-2);
}
.head-left { min-width: 0; }
.greet-row { display: flex; align-items: baseline; gap: 6px; line-height: 1.1; }
.greet { font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--c-primary); }
.who { font-family: var(--font-display); font-size: 1.25rem; font-weight: 600; color: var(--c-ink); }
.dash-date { font-size: 12.5px; color: var(--c-muted); font-weight: 500; margin-top: 2px; }
.head-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.period-chip {
  background: var(--c-surface-2);
  color: var(--c-muted);
  font-weight: 600;
  font-size: 12px;
  border: 1px solid var(--c-border);
  height: 34px;
}
.refresh-btn { border-radius: 8px; }

/* ---- KPI tiles (live inside .main-grid) ---- */
.kpi-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--sp-2);
  padding: 14px 16px;
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-sm);
  min-height: 96px;
}
.kpi-feature {
  background: linear-gradient(135deg, var(--c-primary) 0%, #0B5A53 100%);
  color: #fff;
  box-shadow: var(--shadow);
}
.kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.kpi-label { font-size: 11.5px; font-weight: 600; letter-spacing: 0.02em; color: var(--c-muted); }
.kpi-feature .kpi-label { color: rgba(255, 255, 255, 0.85); }
.kpi-ico { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex: none; }
.kpi-ico.on-light { background: var(--c-primary-soft); }
.kpi-ico.on-feature { background: rgba(255, 255, 255, 0.16); }
.kpi-val { font-size: 1.85rem; line-height: 1; font-weight: 600; color: var(--c-ink); }
.kpi-feature .kpi-val { color: #fff; }
.kpi-foot { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
}
.trend.on-light { background: var(--c-primary-soft); color: var(--c-primary); }
.trend.neutral.on-light { background: var(--c-surface-2); color: var(--c-muted); }
.trend.on-feature { background: rgba(255, 255, 255, 0.18); color: #fff; }
.trend.neutral.on-feature { background: rgba(255, 255, 255, 0.14); color: #fff; }
.kpi-foot-label { font-size: 11.5px; color: var(--c-muted); }
.kpi-feature .kpi-foot-label { color: rgba(255, 255, 255, 0.82); }

/* ---- Bento grid: 4-col x 4-row ---- */
/* Row1-2: KPIs (2x2) | Registrations | Trends
   Row3:   By College (span2) | Most Occupied (span2)
   Row4:   Demographics (span2) | Room Types (span2) */
.main-grid {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: minmax(160px, 0.75fr) minmax(160px, 0.75fr) minmax(220px, 1fr) minmax(220px, 1fr);
  gap: var(--sp-4);
  min-height: 0;
}

.main-grid > .q-card {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Desktop Grid Assignments (explicit start + span) */
.area-kpi      { min-height: 96px; }
.area-regis    { grid-column: 3; grid-row: 1 / span 2; }
.area-trends   { grid-column: 4; grid-row: 1 / span 2; }
.area-college  { grid-column: 1 / span 2; grid-row: 3; }
.area-occupied { grid-column: 3 / span 2; grid-row: 3; }
.area-demo     { grid-column: 1 / span 2; grid-row: 4; }
.area-roomtypes{ grid-column: 3 / span 2; grid-row: 4; }

.tile { transition: transform var(--t), box-shadow var(--t); }
.tile:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

/* ---- Card heads ---- */
.card-head { display: flex; flex-direction: column; gap: 1px; margin-bottom: var(--sp-2); flex: none; }
.card-head.compact { margin-bottom: 6px; }
.card-head-title { font-size: 14px; }
.card-head-ico {
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--c-primary-soft); color: var(--c-primary);
  display: flex; align-items: center; justify-content: center; flex: none;
}
.card-sub { font-size: 11.5px; color: var(--c-muted); font-weight: 500; padding-left: 36px; }
.card-head.compact .card-sub { padding-left: 36px; }
.legend { flex: none; margin-left: auto; padding-left: 0; }

/* ---- Charts ---- */
.chart-wrap { position: relative; flex: 1 1 auto; min-height: 0; width: 100%; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }

/* ---- Pending table ---- */
.search-input :deep(.q-field__control) { border-radius: 30px; background: var(--c-surface); }
.pending-head { flex: 0 0 auto; border-bottom: 1px solid var(--c-border); }
.pending-body { flex: 1 1 auto; min-height: 0; overflow: auto; }

.dashboard-table { border-collapse: collapse; width: 100%; }
.dashboard-table thead th {
  padding: 8px 10px;
  border-bottom: 1px solid var(--c-border);
  position: sticky; top: 0; background: var(--c-surface-2); z-index: 1;
  color: var(--c-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em;
}
.dashboard-table tbody td { padding: 6px 10px; border-bottom: 1px solid var(--c-surface-2); color: var(--c-ink); }
.dashboard-table tbody tr { transition: background var(--t-fast); }
.dashboard-table tbody tr:hover td { background: var(--c-surface-2); }

.ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ---- Progress bars ---- */
.progress-track { height: 7px; background: var(--c-surface-2); border-radius: 999px; overflow: hidden; flex: none; }
.progress-fill { height: 100%; border-radius: 999px; background: var(--c-primary); transition: width 0.4s ease; }
.progress-fill.accent { background: var(--c-accent); }

/* ---- Responsive Breakpoints ---- */

/* Tablet & Smaller Laptops */
@media (max-width: 1024px) {
  .main-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: none;
    grid-auto-rows: minmax(220px, auto);
  }
  .main-grid > .q-card {
    grid-column: auto !important;
    grid-row: auto !important;
  }
  /* KPIs naturally form a 2x2; keep them compact */
  .area-kpi { grid-column: auto !important; grid-row: auto !important; min-height: 92px; }
  .area-regis, .area-trends { min-height: 260px; }
}

/* Mobile */
@media (max-width: 768px) {
  .dash-page { padding: var(--sp-2); gap: var(--sp-2); }
  .main-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-auto-rows: auto;
  }
  .main-grid > .q-card {
    grid-column: span 1 !important;
    grid-row: auto !important;
    min-height: 300px;
  }
  .area-kpi { min-height: 92px; }
  .area-demo { min-height: auto; }

  /* Stack inner horizontal layouts on mobile */
  .demo-body {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  .demo-body .chart-wrap {
    min-height: 180px;
    margin-bottom: 16px;
  }
}
</style>