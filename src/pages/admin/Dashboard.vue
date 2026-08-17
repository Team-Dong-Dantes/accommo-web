<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">
    <!-- Page header -->
    <header class="dash-header rise-in">
      <div class="col">
        <div class="greeting">{{ greet }}, Admin</div>
        <div class="dash-date">{{ today }}</div>
      </div>
      <div class="row items-center no-wrap header-actions">
        <q-btn flat round color="primary" icon="mdi:refresh" @click="refresh" aria-label="Refresh data" />
        <q-btn unelevated color="teal-7" text-color="white" no-caps class="rounded-button text-weight-bold" @click="window.print()">
          <Icon icon="mdi:download" :width="16" :height="16" class="q-mr-xs" /> Export Report
        </q-btn>
      </div>
    </header>

    <!-- KPI strip -->
    <section class="kpi-row" aria-label="Key metrics">
      <q-card
        v-for="(kpi, i) in kpis"
        :key="kpi.label"
        flat
        class="kpi-card rise-in"
        :class="kpi.feature ? 'kpi-feature' : 'bg-surface border-token'"
        :style="{ animationDelay: i * 60 + 'ms' }"
      >
        <div class="kpi-top">
          <span class="kpi-label">{{ kpi.label }}</span>
          <div class="kpi-icon" :class="kpi.feature ? 'on-feature' : 'on-light'">
            <Icon :icon="kpi.icon" :width="18" :height="18" :color="kpi.feature ? 'white' : 'var(--c-primary)'" />
          </div>
        </div>
        <div class="kpi-value text-display">{{ kpi.value }}</div>
        <div class="kpi-foot">
          <span class="trend-pill" :class="kpi.feature ? 'on-feature' : 'on-light'">
            <Icon :icon="kpi.trend === 'up' ? 'mdi:arrow-up-right' : 'mdi:arrow-down-right'" :width="13" :height="13" />
            {{ kpi.delta }}
          </span>
          <span class="kpi-foot-label" :class="kpi.feature ? 'on-feature' : ''">{{ kpi.deltaLabel }}</span>
        </div>
      </q-card>
    </section>

    <!-- Bento grid -->
    <section class="main-grid">
      <!-- Registration trends -->
      <q-card flat class="bg-surface border-token card-radius q-pa-md column area-trends tile rise-in" style="animation-delay:0ms;">
        <div class="card-head">
          <div class="row items-center no-wrap card-head-title" style="gap:8px;">
            <div class="card-head-icon"><Icon icon="mdi:chart-line" :width="16" :height="16" /></div>
            <span class="text-ink text-weight-bold">Registration Trends</span>
          </div>
          <span class="card-sub">Students &amp; landlords · last 7 months</span>
        </div>
        <div class="row justify-end q-mt-xs q-mb-xs legend" style="gap:14px;">
          <div class="row items-center" style="gap:5px;"><span class="dot" style="background:var(--c-primary)" /><span class="text-caption text-weight-bold" style="color:var(--c-ink)">Students</span></div>
          <div class="row items-center" style="gap:5px;"><span class="dot" style="background:var(--c-accent)" /><span class="text-caption text-weight-bold" style="color:var(--c-ink)">Landlords</span></div>
        </div>
        <div class="chart-wrap flex-1">
          <apexchart type="bar" height="100%" :options="regOptions" :series="regSeries" />
        </div>
      </q-card>

      <!-- Pending approvals -->
      <q-card flat class="bg-surface border-token card-radius column area-pending tile rise-in" style="animation-delay:60ms;">
        <div class="q-pa-md row justify-between items-center pending-head">
          <div>
            <div class="row items-center no-wrap" style="gap:8px;">
              <div class="card-head-icon"><Icon icon="mdi:account-clock-outline" :width="16" :height="16" /></div>
              <span class="text-ink text-weight-bold">Pending Approvals</span>
            </div>
            <span class="card-sub">{{ data.pendingRegistrations.length }} awaiting review</span>
          </div>
          <q-input outlined dense rounded v-model="searchFilter" placeholder="Search" class="search-input" style="width:150px;">
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
                <th>Status</th>
                <th>Joined</th>
                <th style="width:96px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredPending" :key="user.name + user.time">
                <td>
                  <q-avatar size="40px" :color="user.color" text-color="white" class="text-weight-bold" style="font-size:15px;border-radius:8px;">{{ user.initials }}</q-avatar>
                </td>
                <td class="text-ink text-weight-medium" style="max-width:150px;"><span class="ellipsis" style="display:inline-block;">{{ user.name }}</span></td>
                <td>
                  <q-chip dense :color="user.role === 'Landlord' ? 'primary' : 'grey-2'" :text-color="user.role === 'Landlord' ? 'white' : 'grey-8'" class="text-weight-bold" style="font-size:10px;margin:0;">{{ user.role }}</q-chip>
                </td>
                <td>
                  <span class="flex items-center text-weight-medium" style="gap:5px;font-size:12px;" :class="user.status === 'Pending' ? 'text-warning' : 'text-info'">
                    <span class="dot" :style="user.status === 'Pending' ? 'background:var(--c-warning)' : 'background:var(--c-info)'" />
                    {{ user.status }}
                  </span>
                </td>
                <td style="font-size:12px;color:var(--c-ink)">{{ user.time }}</td>
                <td class="text-right">
                  <q-btn unelevated dense color="primary" text-color="white" no-caps class="text-weight-bold review-btn" @click="$router.push('/verifications')" aria-label="Review pending approval">
                    Review <Icon icon="mdi:chevron-right" class="q-ml-xs" :width="12" :height="12" />
                  </q-btn>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
          <div v-else class="full-width flex-center text-muted text-caption q-pa-xl column">
            <Icon icon="mdi:check-decagram-outline" :width="34" :height="34" class="q-mb-sm" />
            No pending approvals.
          </div>
        </div>
      </q-card>

      <!-- Quick actions -->
      <q-card flat class="bg-surface border-token card-radius q-pa-md column area-actions tile rise-in" style="animation-delay:120ms;">
        <div class="card-head">
          <div class="row items-center no-wrap card-head-title" style="gap:8px;">
            <div class="card-head-icon"><Icon icon="mdi:lightning-bolt" :width="16" :height="16" /></div>
            <span class="text-ink text-weight-bold">Quick Actions</span>
          </div>
        </div>
        <div class="actions-grid">
          <q-btn
            v-for="a in quickActions"
            :key="a.label"
            flat
            no-caps
            class="action-btn"
            @click="a.action ? a.action() : $router.push(a.to)"
          >
            <div class="row items-center no-wrap full-width" style="gap:10px;">
              <div class="action-icon"><Icon :icon="a.icon" :width="16" :height="16" /></div>
              <span class="col text-left ellipsis action-label">{{ a.label }}</span>
              <Icon icon="mdi:chevron-right" :width="14" :height="14" class="action-chevron" />
            </div>
          </q-btn>
        </div>
      </q-card>

      <!-- Most occupied -->
      <q-card flat class="bg-surface border-token card-radius q-pa-md column area-occupied tile rise-in" style="animation-delay:180ms;">
        <div class="card-head">
          <div class="row items-center no-wrap card-head-title" style="gap:8px;">
            <div class="card-head-icon"><Icon icon="mdi:home-city-outline" :width="16" :height="16" /></div>
            <span class="text-ink text-weight-bold">Most Occupied</span>
          </div>
          <span class="card-sub">Top properties by occupancy</span>
        </div>
        <div class="chart-wrap flex-1 flex flex-center">
          <apexchart v-if="data.topOccupied.length" type="bar" height="100%" :options="topOptions" :series="topSeries" />
          <div v-else class="full-width flex-center text-muted text-caption h-full">No occupancy data yet</div>
        </div>
      </q-card>

      <!-- Priority alerts -->
      <q-card flat class="bg-surface border-token card-radius q-pa-md column area-alerts tile rise-in" style="animation-delay:240ms;">
        <div class="card-head">
          <div class="row items-center no-wrap card-head-title" style="gap:8px;">
            <div class="card-head-icon"><Icon icon="mdi:alert-octagon" :width="16" :height="16" /></div>
            <span class="text-ink text-weight-bold">Priority Alerts</span>
          </div>
        </div>
        <div class="column alerts-list" style="gap:10px;">
          <div class="row items-center justify-between q-pa-sm radius-sm alert-row" :class="data.complaints.urgent > 0 ? 'alert-danger' : 'alert-neutral'">
            <div class="row items-center no-wrap" style="gap:8px;">
              <Icon icon="mdi:shield-alert" :color="data.complaints.urgent > 0 ? 'var(--c-danger)' : 'var(--c-muted)'" :width="17" :height="17" />
              <div class="column">
                <span class="text-weight-bold text-ink" style="font-size:12px;">Urgent complaints</span>
                <span class="text-muted" style="font-size:10px;">{{ data.complaints.open }} open total</span>
              </div>
            </div>
            <q-badge :color="data.complaints.urgent > 0 ? 'negative' : 'grey-5'" text-color="white" class="text-weight-bold" style="border-radius:8px;">{{ data.complaints.urgent }}</q-badge>
          </div>
          <div class="row items-center justify-between q-pa-sm radius-sm alert-neutral">
            <div class="row items-center no-wrap" style="gap:8px;">
              <Icon icon="mdi:file-document-clock-outline" color="var(--c-muted)" :width="17" :height="17" />
              <div class="column">
                <span class="text-weight-bold text-ink" style="font-size:12px;">Leases expiring</span>
                <span class="text-muted" style="font-size:10px;">next 30 days</span>
              </div>
            </div>
            <q-badge :color="data.expiringLeases.length > 0 ? 'warning' : 'grey-5'" text-color="white" class="text-weight-bold" style="border-radius:8px;">{{ data.expiringLeases.length }}</q-badge>
          </div>
          <div class="row items-center justify-between q-pa-sm radius-sm alert-neutral">
            <div class="row items-center no-wrap" style="gap:8px;">
              <Icon icon="mdi:certificate-outline" color="var(--c-muted)" :width="17" :height="17" />
              <div class="column">
                <span class="text-weight-bold text-ink" style="font-size:12px;">Accreditations expiring</span>
                <span class="text-muted" style="font-size:10px;">next 30 days</span>
              </div>
            </div>
            <q-badge :color="data.expiringAccreditations > 0 ? 'warning' : 'grey-5'" text-color="white" class="text-weight-bold" style="border-radius:8px;">{{ data.expiringAccreditations }}</q-badge>
          </div>

          <div v-if="data.expiringLeases.length" class="recent-wrap q-mt-xs">
            <div class="text-caption text-weight-bold text-uppercase q-mb-xs recent-head">Upcoming lease ends</div>
            <div v-for="l in data.expiringLeases.slice(0, 2)" :key="l.id" class="row items-center justify-between q-pa-xs radius-sm q-mb-xs recent-item">
              <span class="text-ink text-weight-medium ellipsis" style="font-size:11px;max-width:120px;">Lease {{ l.id.slice(0, 6) }}</span>
              <span class="text-muted" style="font-size:11px;">{{ formatDate(l.end_date) }}</span>
            </div>
          </div>

          <div v-if="data.recentComplaints.length" class="recent-wrap q-mt-xs">
            <div class="text-caption text-weight-bold text-uppercase q-mb-xs recent-head">Recent open complaints</div>
            <div v-for="c in data.recentComplaints" :key="c.id" class="row items-center justify-between q-pa-xs radius-sm q-mb-xs recent-item">
              <span class="text-ink text-weight-medium ellipsis" style="font-size:11px;max-width:140px;">{{ c.subject }}</span>
              <q-badge :color="c.priority === 'urgent' ? 'negative' : c.priority === 'high' ? 'warning' : 'grey-5'" text-color="white" class="text-weight-bold" style="border-radius:6px;font-size:10px;">{{ c.priority }}</q-badge>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Room types -->
      <q-card flat class="bg-surface border-token card-radius q-pa-md column area-types tile rise-in" style="animation-delay:300ms;">
        <div class="card-head">
          <div class="row items-center no-wrap card-head-title" style="gap:8px;">
            <div class="card-head-icon"><Icon icon="mdi:bed-outline" :width="16" :height="16" /></div>
            <span class="text-ink text-weight-bold">Room Types</span>
          </div>
          <span class="card-sub">Capacity per type</span>
        </div>
        <div class="chart-wrap flex-1 flex flex-center">
          <apexchart v-if="data.roomsByType.length" type="donut" width="100%" height="100%" :options="typeOptions" :series="typeSeries" />
          <div v-else class="full-width flex-center text-muted text-caption h-full">No room data yet</div>
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
import { chartTheme } from '@/utils/chartTheme'

const { loading, data, load } = useDashboardStats()
const hasData = ref(false)
const searchFilter = ref('')

onMounted(async () => {
  await load()
  hasData.value = true
})

async function refresh() {
  await load()
}

const now = new Date()
const hour = now.getHours()
const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

function formatDate(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const quickActions = [
  { icon: 'mdi:bullhorn-outline', label: 'Announcement', to: '/announcements' },
  { icon: 'mdi:history', label: 'Audit Logs', to: '/audit-logs' },
  { icon: 'mdi:map-outline', label: 'Property Map', to: '/map-view' },
  { icon: 'mdi:account-group-outline', label: 'User Directory', to: '/users' },
  { icon: 'mdi:download', label: 'Export Report', action: () => window.print() },
]

const kpis = computed(() => [
  { label: 'Total Students', value: data.students.total.toLocaleString(), delta: `+${data.students.newThisMonth}`, deltaLabel: 'new this month', trend: 'up' as const, icon: 'mdi:account-group-outline', feature: true },
  { label: 'Active Properties', value: data.properties.accredited, delta: `${data.properties.total}`, deltaLabel: 'listed total', trend: 'up' as const, icon: 'mdi:home-city-outline' },
  { label: 'Available Rooms', value: data.rooms.available, delta: `${data.rooms.total}`, deltaLabel: 'rooms total', trend: 'up' as const, icon: 'mdi:bed-outline' },
  { label: 'Occupancy Rate', value: `${data.rooms.occupancyPct}%`, delta: `${data.rooms.occupied}`, deltaLabel: 'of capacity', trend: 'up' as const, icon: 'mdi:chart-pie' },
])

const filteredPending = computed(() => {
  if (!searchFilter.value) return data.pendingRegistrations
  const q = searchFilter.value.toLowerCase()
  return data.pendingRegistrations.filter(u => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q))
})

const typeOptions = computed(() => {
  const ct = chartTheme()
  return {
    chart: { type: 'donut' as const, toolbar: { show: false }, height: '100%', fontFamily: ct.fontFamily, background: 'transparent' },
    labels: data.roomsByType.map(t => t.type),
    colors: ct.palette,
    dataLabels: { enabled: false },
    legend: { position: 'bottom' as const, fontSize: '11px', labels: { colors: ct.axisColor } },
    plotOptions: { pie: { donut: { size: '58%' } } },
    stroke: { colors: [ct.surface], width: 2 },
    tooltip: { theme: ct.tooltipTheme },
  }
})

const typeSeries = computed(() => data.roomsByType.map(t => t.capacity))

const regOptions = computed(() => {
  const ct = chartTheme()
  return {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: ct.fontFamily, height: '100%', background: 'transparent' },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '60%' } },
    colors: [ct.palette[0], ct.palette[1]],
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: data.registrationsByMonth.map(r => r.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: ct.axisColor, fontWeight: 500, fontSize: '10px' } },
    },
    yaxis: { show: false },
    grid: { show: true, borderColor: ct.gridColor, strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    legend: { show: false },
    tooltip: { theme: ct.tooltipTheme },
  }
})

const regSeries = computed(() => [
  { name: 'Students', data: data.registrationsByMonth.map(r => r.students) },
  { name: 'Landlords', data: data.registrationsByMonth.map(r => r.landlords) },
])

const topOptions = computed(() => {
  const ct = chartTheme()
  return {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: ct.fontFamily, height: '100%', background: 'transparent' },
    plotOptions: { bar: { horizontal: true, borderRadius: 5, columnWidth: '60%' } },
    colors: [ct.palette[0]],
    dataLabels: { enabled: true, formatter: (val: number) => `${val}%`, style: { fontSize: '10px', colors: [ct.surface] } },
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
    tooltip: { theme: ct.tooltipTheme },
  }
})

const topSeries = computed(() => [
  { name: 'Occupancy', data: data.topOccupied.map(t => Math.round(t.val * 100)) },
])
</script>

<style scoped>
.users-page {
  background-color: var(--c-bg);
  height: 100% !important;
  overflow: hidden !important;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  box-sizing: border-box;
}

/* ---- Header ---- */
.dash-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sp-3);
}
.greeting {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--c-primary);
}
.dash-date {
  font-size: 13px;
  color: var(--c-muted);
  font-weight: 500;
}
.header-actions { gap: 10px; }

/* ---- KPI row ---- */
.kpi-row {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-4);
}
.kpi-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-4);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-sm);
  min-height: 132px;
}
.kpi-feature {
  background: linear-gradient(135deg, var(--c-primary) 0%, #0B5A53 100%);
  color: #fff;
  box-shadow: var(--shadow);
}
.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.kpi-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--c-muted);
}
.kpi-feature .kpi-label { color: rgba(255, 255, 255, 0.82); }
.kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.kpi-icon.on-light { background: var(--c-primary-soft); }
.kpi-icon.on-feature { background: rgba(255, 255, 255, 0.16); }
.kpi-value {
  font-size: 2.1rem;
  line-height: 1;
  font-weight: 600;
  color: var(--c-ink);
}
.kpi-feature .kpi-value { color: #fff; }
.kpi-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.trend-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.trend-pill.on-light { background: var(--c-primary-soft); color: var(--c-primary); }
.trend-pill.on-feature { background: rgba(255, 255, 255, 0.18); color: #fff; }
.kpi-foot-label { font-size: 12px; color: var(--c-muted); }
.kpi-feature .kpi-foot-label { color: rgba(255, 255, 255, 0.82); }

/* ---- Main grid ---- */
.main-grid {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-areas:
    "trends trends trends trends trends trends trends pending pending pending pending pending"
    "actions actions actions occupied occupied occupied occupied alerts alerts alerts types types";
  gap: var(--sp-4);
}
.area-trends   { grid-area: trends; min-height: 380px; }
.area-pending  { grid-area: pending; min-height: 380px; }
.area-actions  { grid-area: actions; }
.area-occupied { grid-area: occupied; }
.area-alerts   { grid-area: alerts; }
.area-types    { grid-area: types; }

.main-grid > .q-card {
  min-height: 340px;
  overflow: hidden;
}

.tile { transition: transform var(--t), box-shadow var(--t); }
.tile:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

/* ---- Card heads ---- */
.card-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--sp-3);
  flex: none;
}
.card-head-title { font-size: 15px; }
.card-head-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.card-sub {
  font-size: 12px;
  color: var(--c-muted);
  font-weight: 500;
  padding-left: 38px;
}

/* ---- Quick actions ---- */
.actions-grid {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
  align-content: start;
}
.action-btn {
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  text-align: left;
  transition: background var(--t-fast), border-color var(--t-fast), transform var(--t-fast);
}
.action-btn:hover { background: var(--c-primary-soft); border-color: var(--c-primary-soft); }
.action-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.action-label { font-size: 12px; font-weight: 600; color: var(--c-ink); }
.action-chevron { color: var(--c-muted); flex: none; }

/* ---- Charts ---- */
.chart-wrap { min-height: 220px; width: 100%; }
.legend { flex: none; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }

/* ---- Pending table ---- */
.search-input :deep(.q-field__control) { border-radius: 30px; background: var(--c-surface); }
.pending-head { flex: 0 0 auto; border-bottom: 1px solid var(--c-border); }
.pending-body { flex: 1 1 auto; min-height: 0; overflow: auto; }

.dashboard-table { border-collapse: collapse; width: 100%; }
.dashboard-table thead th {
  padding: 9px 10px;
  border-bottom: 1px solid var(--c-border);
  position: sticky;
  top: 0;
  background: var(--c-surface-2);
  z-index: 1;
  color: var(--c-muted);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.dashboard-table tbody td { padding: 7px 10px; border-bottom: 1px solid var(--c-surface-2); color: var(--c-ink); }
.dashboard-table tbody tr { transition: background var(--t-fast); }
.dashboard-table tbody tr:hover td { background: var(--c-surface-2); }

/* ---- Alerts ---- */
.alerts-list { overflow: hidden; }
.alert-row { transition: background var(--t-fast); }
.alert-neutral { background: var(--c-surface-2); border: 1px solid var(--c-border); }
.alert-danger { background: var(--c-danger-soft); border: 1px solid var(--c-danger-soft); }
.recent-wrap { overflow: hidden; }
.recent-head { color: var(--c-muted); letter-spacing: 0.04em; }
.recent-item { background: var(--c-surface-2); border: 1px solid var(--c-border); }

.ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ---- Responsive ---- */
@media (max-width: 1100px) {
  .users-page { padding: 0; }
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .main-grid {
    grid-template-columns: 1fr;
    grid-template-areas: none;
  }
  .area-trends, .area-pending, .area-actions, .area-occupied, .area-alerts, .area-types {
    grid-column: 1 / -1 !important;
    grid-row: auto !important;
    min-height: 340px;
  }
}
@media (max-width: 560px) {
  .kpi-row { grid-template-columns: 1fr; }
}
</style>
