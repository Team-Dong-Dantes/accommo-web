<template>
  <q-page class="layout-bg q-pa-lg">
    <!-- Header -->
    <div class="q-mb-lg">
      <h4 class="text-h4 text-weight-bold text-dark q-my-none" style="letter-spacing:-0.04em;">Good morning, Admin</h4>
      <p class="text-grey-7 q-mt-sm text-body1">Monitor boarding house performance, track registrations, and resolve tickets.</p>
    </div>

    <!-- Row 1: Students + KPIs + Chart -->
    <div class="row q-col-gutter-lg q-mb-lg">
      <!-- Col 1: Students card -->
      <div class="col-12 col-lg-4">
        <q-card flat class="rounded-xl q-pa-lg bg-white h-full column">
          <div class="row justify-between items-center q-mb-md">
            <span class="text-grey-7 text-weight-medium">Total Students</span>
            <q-btn flat dense rounded color="grey-7" label="ISU" size="sm" class="bg-grey-1 q-px-sm">
              <Icon icon="mdi:chevron-down" width="14" height="14" class="q-ml-xs" />
            </q-btn>
          </div>
          <div class="text-h3 text-weight-bold text-dark q-mb-sm" style="letter-spacing:-0.04em;">{{ data.students.total.toLocaleString() }}</div>
          <div class="row items-center q-mb-lg" style="gap:8px;">
            <q-chip dense color="green-1" text-color="green-7" class="text-weight-bold text-caption" style="margin:0;">
              <Icon icon="mdi:arrow-up" width="14" height="14" class="q-mr-xs" />{{ data.students.newThisMonth }} new
            </q-chip>
            <span class="text-grey-5 text-caption">this month</span>
          </div>

          <div class="row q-col-gutter-sm q-mb-xl">
            <div class="col-6">
              <q-btn unelevated rounded color="dark" text-color="white" label="View Map" class="full-width text-weight-bold" style="padding:10px 0;" @click="$router.push('/map-view')">
                <Icon icon="mdi:map" width="18" height="18" class="q-mr-xs" />
              </q-btn>
            </div>
            <div class="col-6">
              <q-btn outline rounded color="grey-4" text-color="dark" label="Verify Users" class="full-width text-weight-bold bg-grey-1" style="padding:10px 0;" @click="$router.push('/verifications')">
                <Icon icon="mdi:account-check" width="18" height="18" class="q-mr-xs" />
              </q-btn>
            </div>
          </div>

          <div class="bg-grey-1 rounded-lg q-pa-md q-mt-auto">
            <div class="row justify-between items-center q-mb-sm">
              <span class="text-grey-7 text-caption text-weight-bold">Colleges &middot; {{ data.studentsByCollege.length }}</span>
            </div>
            <div class="row q-col-gutter-sm" style="flex-wrap:nowrap;overflow-x:auto;">
              <q-card v-for="col in data.studentsByCollege.slice(0,3)" :key="col.name" flat bordered class="bg-white rounded-box q-pa-sm" style="min-width:110px;">
                <div class="row justify-between items-center q-mb-sm">
                  <div class="row items-center" style="gap:4px;">
                    <span class="dot" :class="'bg-'+col.color" />
                    <span class="text-caption text-weight-bold">{{ shortName(col.name) }}</span>
                  </div>
                  <Icon icon="mdi:dots-vertical" width="14" height="14" color="#9ca3af" />
                </div>
                <div class="text-subtitle2 text-weight-bold text-dark">{{ col.val }}</div>
                <div class="text-grey-5" style="font-size:10px;">{{ col.pct }} of total</div>
                <div class="text-teal-6 text-weight-bold q-mt-xs" style="font-size:10px;">Active</div>
              </q-card>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Col 2: KPI Grid -->
      <div class="col-12 col-lg-4">
        <div class="row q-col-gutter-md" style="height:100%;">
          <div v-for="(kpi,i) in kpis" :key="i" class="col-6">
            <q-card flat class="rounded-xl q-pa-md h-full column justify-between dashboard-kpi" :class="i===0?'bg-teal text-white':'bg-white text-dark'" style="border:1px solid #f0f0f0;">
              <div>
                <div class="row justify-between items-start q-mb-md">
                  <span class="text-caption text-weight-medium" :class="i===0?'text-teal-1':'text-grey-7'">{{ kpi.label }}</span>
                  <div class="kpi-icon-circle" :class="i===0?'bg-teal-7':'bg-grey-1'">
                    <Icon :icon="kpi.icon" width="16" height="16" :color="i===0?'white':'grey-7'" />
                  </div>
                </div>
                <div class="text-h4 text-weight-bold q-mb-sm" style="letter-spacing:-0.04em;">{{ kpi.value }}</div>
              </div>
              <div class="row items-center" style="gap:4px;">
                <q-chip dense :color="i===0?'teal-7':'green-1'" :text-color="i===0?'white':'green-7'" class="text-weight-bold text-caption" style="margin:0;">
                  <Icon :icon="kpi.trendIcon" width="12" height="12" class="q-mr-xs" />{{ kpi.sub }}
                </q-chip>
                <span class="text-caption" :class="i===0?'text-teal-2':'text-grey-5'">This month</span>
              </div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Col 3: Registration Chart -->
      <div class="col-12 col-lg-4">
        <q-card flat class="rounded-xl q-pa-lg bg-white h-full column">
          <div class="text-h6 text-weight-bold text-dark q-mb-xs">Registration Trends</div>
          <div class="text-caption text-grey-6 q-mb-lg">Registrations in a given period</div>
          <div class="row justify-end q-mb-md" style="gap:16px;">
            <div class="row items-center" style="gap:4px;"><span class="dot bg-teal" /><span class="text-caption text-grey-7 text-weight-bold">Students</span></div>
            <div class="row items-center" style="gap:4px;"><span class="dot bg-dark" /><span class="text-caption text-grey-7 text-weight-bold">Landlords</span></div>
          </div>
          <div style="flex:1;min-height:0;">
            <apexchart type="bar" height="220" :options="regOptions" :series="regSeries" />
          </div>
        </q-card>
      </div>
    </div>

    <!-- Row 2: Capacity + Alerts + Tickets -->
    <div class="row q-col-gutter-lg">
      <!-- Col 1: Capacity + Alerts -->
      <div class="col-12 col-lg-4">
        <div style="display:flex;flex-direction:column;gap:24px;">
          <!-- Capacity bar -->
          <q-card flat class="rounded-xl q-pa-lg bg-white">
            <div class="text-subtitle1 text-weight-bold text-dark q-mb-lg">Overall Capacity</div>
            <div class="row no-wrap items-center q-mb-sm" style="gap:4px;">
              <div class="bg-teal rounded-borders" :style="{height:'12px',width:capPct+'%'}" />
              <div class="bg-grey-2 rounded-borders flex-grow" style="height:12px;" />
            </div>
            <div class="row justify-between text-caption text-weight-bold">
              <span class="text-dark">{{ capUsed }} housed out of</span>
              <span class="text-grey-6">{{ data.rooms.capacity }} slots</span>
            </div>
          </q-card>

          <!-- Priority Alerts -->
          <q-card flat class="rounded-xl q-pa-lg bg-white" style="flex:1;">
            <div class="row justify-between items-center q-mb-md">
              <div class="row items-center" style="gap:8px;">
                <Icon icon="mdi:alert-octagon" width="20" height="20" color="#11181c" />
                <span class="text-subtitle1 text-weight-bold text-dark">Priority Alerts</span>
              </div>
              <q-btn flat dense rounded color="grey-7" label="View all" size="sm" class="bg-grey-1 q-px-sm">
                <Icon icon="mdi:plus" width="16" height="16" class="q-mr-xs" />
              </q-btn>
            </div>
            <div class="row q-col-gutter-md">
              <!-- Dark Card -->
              <div class="col-12 col-sm-6">
                <q-card flat class="rounded-xl bg-dark text-white q-pa-md alert-card column justify-between">
                  <div class="row justify-between items-start">
                    <q-chip dense color="white" text-color="dark" class="text-weight-bold" style="font-size:10px;margin:0;">
                      {{ data.complaints.urgent>0?'Urgent':'Clear' }}
                    </q-chip>
                    <Icon icon="mdi:shield-alert" width="20" height="20" color="#9ca3af" />
                  </div>
                  <div>
                    <div class="text-caption text-grey-4 q-mb-xs">{{ data.complaints.open }} open complaints</div>
                    <div class="text-weight-bold" style="line-height:1.2;font-size:13px;">
                      {{ data.complaints.urgent>0 ? `${data.complaints.urgent} urgent case(s) need attention` : 'No urgent complaints' }}
                    </div>
                    <div class="row justify-between q-mt-md text-grey-4" style="font-size:10px;">
                      <span>{{ data.concerns.open }} concerns open</span>
                      <span>{{ data.complaints.urgent>0?'Pending':'Clear' }}</span>
                    </div>
                  </div>
                </q-card>
              </div>
              <!-- Teal Card -->
              <div class="col-12 col-sm-6">
                <q-card flat class="rounded-xl bg-teal text-white q-pa-md alert-card column justify-between relative-position overflow-hidden">
                  <div class="card-glow" />
                  <div class="row justify-between items-start relative-position" style="z-index:1;">
                    <q-chip dense color="white" text-color="teal" class="text-weight-bold" style="font-size:10px;margin:0;">Active</q-chip>
                    <Icon icon="mdi:file-document-check" width="20" height="20" color="#99f6e4" />
                  </div>
                  <div class="relative-position" style="z-index:1;">
                    <div class="text-caption text-teal-1 q-mb-xs">{{ data.activeLeases }} active leases</div>
                    <div class="text-weight-bold" style="line-height:1.2;font-size:13px;">{{ data.rooms.occupied }} rooms occupied</div>
                    <div class="row justify-between q-mt-md text-teal-1" style="font-size:10px;">
                      <span>{{ data.rooms.available }} available</span>
                      <span>Active</span>
                    </div>
                  </div>
                </q-card>
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- Col 2: Pending Approvals Table -->
      <div class="col-12 col-lg-8">
        <q-card flat class="rounded-xl bg-white h-full column">
          <div class="q-pa-lg row justify-between items-center" style="border-bottom:1px solid #f0f0f0;">
            <span class="text-h6 text-weight-bold text-dark">Pending Approvals</span>
            <div class="row" style="gap:8px;">
              <q-input outlined dense rounded v-model="searchFilter" placeholder="Search" class="search-input bg-white" style="width:200px;">
                <template #prepend><Icon icon="mdi:magnify" width="18" height="18" /></template>
              </q-input>
              <q-btn outline rounded color="grey-4" text-color="dark" label="Filter" class="bg-white">
                <Icon icon="mdi:filter-variant" width="16" height="16" class="q-mr-xs" />
              </q-btn>
            </div>
          </div>

          <q-markup-table flat class="bg-transparent text-left dashboard-table">
            <thead>
              <tr class="bg-grey-1">
                <th class="text-grey-6 text-weight-bold" style="font-size:13px;width:48px;"></th>
                <th class="text-grey-6 text-weight-bold" style="font-size:13px;">Name</th>
                <th class="text-grey-6 text-weight-bold" style="font-size:13px;">Role</th>
                <th class="text-grey-6 text-weight-bold" style="font-size:13px;">Status</th>
                <th class="text-grey-6 text-weight-bold" style="font-size:13px;">Joined</th>
                <th style="width:40px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredPending" :key="user.name+user.time">
                <td>
                  <q-avatar size="32px" :color="user.color" text-color="white" class="text-weight-bold" style="font-size:11px;border-radius:8px;">{{ user.initials }}</q-avatar>
                </td>
                <td class="text-dark text-weight-medium" style="max-width:200px;"><span class="ellipsis" style="display:inline-block;">{{ user.name }}</span></td>
                <td>
                  <q-chip dense :color="user.role==='Landlord'?'indigo-1':'teal-1'" :text-color="user.role==='Landlord'?'indigo':'teal'" class="text-weight-bold" style="font-size:10px;margin:0;">{{ user.role }}</q-chip>
                </td>
                <td>
                  <span class="flex items-center text-weight-medium" style="gap:4px;" :class="user.status==='Pending'?'text-orange':'text-blue'">
                    <span class="dot" :class="user.status==='Pending'?'bg-orange':'bg-blue'" />
                    {{ user.status }}
                  </span>
                </td>
                <td class="text-grey-7">{{ user.time }}</td>
                <td><q-btn flat round dense size="sm" color="grey-5"><Icon icon="mdi:dots-horizontal" width="18" height="18" /></q-btn></td>
              </tr>
              <tr v-if="filteredPending.length===0">
                <td colspan="6" class="text-center text-grey-5 text-caption q-py-lg">No pending approvals.</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>
    </div>

    <q-inner-loading :showing="loading && !hasData">
      <q-spinner-dots size="40px" color="teal-7" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useDashboardStats } from '@/composables/useDashboardStats'

const { loading, data, load } = useDashboardStats()
const hasData = ref(false)
const searchFilter = ref('')

onMounted(async () => { await load(); hasData.value = true })

function shortName(name:string):string {
  const parts = name.split(' ')
  if (parts.length===1) return name.slice(0,3).toUpperCase()
  if (parts[0].length<=3) return parts[0].toUpperCase()
  return parts.map(p=>p[0]).join('').toUpperCase()
}

const filteredPending = computed(() => {
  if(!searchFilter.value) return data.pendingRegistrations
  const q = searchFilter.value.toLowerCase()
  return data.pendingRegistrations.filter(u => u.name.toLowerCase().includes(q)||u.role.toLowerCase().includes(q))
})

const kpis = computed(() => [
  { label:'Total Rooms',value:data.rooms.total,sub:`${data.rooms.available} avail`,icon:'mdi:bed',trendIcon:'mdi:arrow-up',isMain:true},
  { label:'Active Properties',value:data.properties.accredited,sub:`${data.properties.total} total`,icon:'mdi:home-city',trendIcon:'mdi:arrow-up',isMain:false},
  { label:'Occupancy',value:`${data.rooms.occupancyPct}%`,sub:`${data.rooms.occupied} occ`,icon:'mdi:chart-pie',trendIcon:'mdi:arrow-up',isMain:false},
  { label:'Need Approval',value:data.unverifiedUsers.total,sub:`${data.unverifiedUsers.pending} pend`,icon:'mdi:account-plus',trendIcon:'mdi:clock-outline',isMain:false},
])

const capUsed = computed(() => data.rooms.capacity>0?Math.round(data.rooms.capacity*data.rooms.occupancyPct/100):0)
const capPct = computed(() => data.rooms.occupancyPct)

const regOptions = computed(() => ({
  chart:{type:'bar' as const,toolbar:{show:false},fontFamily:'Inter,sans-serif'},
  plotOptions:{bar:{borderRadius:4,columnWidth:'60%'}},
  colors:['#0d9488','#1a1a1a'],
  dataLabels:{enabled:false},
  stroke:{show:true,width:2,colors:['transparent']},
  xaxis:{categories:['Oct','Nov','Dec','Jan','Feb','Mar','Apr'],axisBorder:{show:false},axisTicks:{show:false},labels:{style:{colors:'#9ca3af',fontWeight:500}}},
  yaxis:{show:false},
  grid:{show:true,borderColor:'#f3f4f6',strokeDashArray:4,xaxis:{lines:{show:false}},yaxis:{lines:{show:true}}},
  legend:{show:false},
}))

const regSeries = computed(() => [
  {name:'Students',data:[0,0,0,0,0,0,0]},
  {name:'Landlords',data:[0,0,0,0,0,0,0]},
])
</script>

<style scoped>
.layout-bg { background-color:#f5f6f8; min-height:100vh; }

.rounded-xl { border-radius:24px; }
.rounded-lg { border-radius:16px; }
.rounded-box { border-radius:12px; }

.dashboard-kpi { border-radius:24px; }

.dot { width:8px;height:8px;border-radius:50%;flex:none; }

.kpi-icon-circle { width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center; }

.alert-card { height:160px; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1); }
.card-glow { position:absolute;top:-20px;right:-20px;width:100px;height:100px;background:rgba(255,255,255,0.15);border-radius:50%;filter:blur(20px); }

.search-input :deep(.q-field__control) { border-radius:30px;background:#fff; }

.dashboard-table { border-collapse:collapse; }
.dashboard-table thead th { padding:16px; border-bottom:1px solid #f0f0f0; }
.dashboard-table tbody td { padding:14px 16px; border-bottom:1px solid #f9fafb; }
.dashboard-table tbody tr:hover td { background:#fafbfc; }

.ellipsis { white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
</style>
