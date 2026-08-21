<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <q-btn
        unelevated
        color="teal-7"
        no-caps
        class="text-weight-bold rounded-button q-mb-md"
      >
        <Icon icon="mdi:download" class="on-left" width="18" height="18" />Export
      </q-btn>
    </div>

    <div class="prop-hub-body">
      <TableCard
        v-model:search="search"
        v-model:active-filters="activeFilters"
        v-model:page="currentPage"
        :filters="filterConfig"
        :loading="loading"
        :total-label="`${filteredProperties.length} propert${filteredProperties.length === 1 ? 'y' : 'ies'}`"
        :total-items="filteredProperties.length"
        item-name="properties"
        @clear-filters="clearFilters"
        @refresh="fetchProperties"
      >
      <template #panels>
        <q-tab-panels v-model="activeTab" animated style="background: transparent; height: 100%;">

          <!-- OVERVIEW -->
          <q-tab-panel name="overview" class="q-pa-none">
            <DataTable :rows="paginatedProperties" :columns="overviewColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="mdi:home-search-outline" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No boarding houses yet</div>
                  <div>When landlords list properties, they'll show up here.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click="openProperty(props.row)">
                  <q-td key="property" :props="props">
                    <UserInfoCell :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :subtitle="props.row.type" />
                  </q-td>
                  <q-td key="landlord" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.landlord }}</q-td>
                  <q-td key="rooms" :props="props" class="text-center text-ink" style="font-size: 13px;">{{ props.row.totalRooms }}</q-td>
                  <q-td key="occupants" :props="props" class="text-center text-ink" style="font-size: 13px;">{{ props.row.totalStudents }}</q-td>
                  <q-td key="status" :props="props">
                    <BadgePill :tone="props.row.verified ? 'success' : 'warning'" :icon="props.row.verified ? 'mdi:check-circle' : 'mdi:clock-outline'" :label="props.row.verified ? 'Accredited' : 'Pending'" />
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- COMPLIANCE (one row per house; a capsule per required permit) -->
          <q-tab-panel name="compliance" class="q-pa-none">
            <DataTable :rows="paginatedProperties" :columns="complianceColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="mdi:file-check-outline" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No boarding houses yet</div>
                  <div>Permit compliance per house is shown once documents are uploaded.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click="openProperty(props.row)">
                  <q-td key="property" :props="props">
                    <UserInfoCell :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :subtitle="props.row.type" />
                  </q-td>
                  <q-td v-for="perm in requiredPermits" :key="perm" :props="props" class="text-center">
                    <BadgePill
                      :tone="PERMIT_STATE[permitStatus(props.row, perm)].tone"
                      :icon="PERMIT_STATE[permitStatus(props.row, perm)].icon"
                      :label="PERMIT_STATE[permitStatus(props.row, perm)].label"
                    />
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- PERFORMANCE -->
          <q-tab-panel name="performance" class="q-pa-none">
            <DataTable :rows="paginatedProperties" :columns="performanceColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="mdi:chart-box-outline" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No performance data</div>
                  <div>Ratings and reviews aren't populated yet.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click="openProperty(props.row)">
                  <q-td key="property" :props="props">
                    <UserInfoCell :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :subtitle="props.row.type" />
                  </q-td>
                  <q-td key="landlord" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.landlord }}</q-td>
                  <q-td key="rating" :props="props" class="text-ink" style="font-size: 13px;">
                    <span class="text-orange-5 text-weight-bold row items-center no-wrap">
                      <Icon icon="mdi:star" width="14" height="14" class="q-mr-xs" /> {{ props.row.rating }}
                    </span>
                  </q-td>
                  <q-td key="response" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.responseRate != null ? `${props.row.responseRate}%` : '—' }}</q-td>
                  <q-td key="occupancy" :props="props" class="text-ink text-weight-medium text-center" style="font-size: 13px;">
                    {{ props.row.totalStudents }}/{{ props.row.totalCapacity }}
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

        </q-tab-panels>
      </template>
    </TableCard>

    <!-- DETAIL DRAWER: docks to the right edge of the table, flush, no margin -->
    <DetailDrawer
      v-model="drawerOpen"
      :width="'540px'"
      anchored
      position="right"
      close-on-backdrop
      :preview="propertyPreview"
    />

    </div><!-- /prop-hub-body -->

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import DataTable from '@/components/table/DataTable.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import type { DrawerPreview, PreviewChip } from '@/components/ui/DetailDrawer.vue'
import type { StatusTone } from '@/utils/status.config'
import { useProperties } from '@/composables/useProperties'

const search = ref('')
const activeTab = ref('overview')
const currentPage = ref(1)
const activeFilters = ref<Record<string, any[]>>({})

const { loading, properties: realProperties, load: loadProperties } = useProperties()

const route = useRoute()

const tabs = [
  { name: 'overview', label: 'Overview' },
  { name: 'compliance', label: 'Compliance' },
  { name: 'performance', label: 'Performance' },
]

const filterConfig = [
  {
    label: 'Status', key: 'status', options: [
      { label: 'Accredited', value: 'accredited' },
      { label: 'Pending', value: 'pending' },
    ],
  },
  {
    label: 'Property Type', key: 'type', options: [
      { label: 'Boarding House', value: 'Boarding House' },
      { label: 'Apartment', value: 'Apartment' },
    ],
  },
]

function clearFilters() {
  activeFilters.value = {}
}

async function fetchProperties() {
  await loadProperties()
}

onMounted(async () => {
  await fetchProperties()

  // Deep-link support: ?property=<id> from Map View opens that house's detail.
  const targetId = route.query.property
  if (targetId && typeof targetId === 'string') {
    const row = properties.value.find((p) => p.id === targetId)
    if (row) openProperty(row)
  }
})

const drawerOpen = ref(false)
const selectedProperty = ref<any | null>(null)

function openProperty(row: any) {
  selectedProperty.value = row
  drawerOpen.value = true
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const overviewColumns = [
  { name: 'property', align: 'left', label: 'Boarding House', field: 'name', headerStyle: 'width: 28%' },
  { name: 'landlord', align: 'left', label: 'Landlord', field: 'landlord', headerStyle: 'width: 18%' },
  { name: 'rooms', align: 'center', label: 'Rooms', field: 'totalRooms', headerStyle: 'width: 12%' },
  { name: 'occupants', align: 'center', label: 'Occupants', field: 'totalStudents', headerStyle: 'width: 14%' },
  { name: 'status', align: 'left', label: 'Status', field: 'verified', headerStyle: 'width: 18%' },
]

const complianceColumns = [
  { name: 'property', align: 'left', label: 'Boarding House', field: 'name', headerStyle: 'width: 22%' },
  { name: 'fire', align: 'center', label: 'Fire Permit', field: 'fire', headerStyle: 'width: 19%' },
  { name: 'business', align: 'center', label: 'Business Permit', field: 'business', headerStyle: 'width: 19%' },
  { name: 'sanitary', align: 'center', label: 'Sanitary Permit', field: 'sanitary', headerStyle: 'width: 20%' },
  { name: 'building', align: 'center', label: 'Building Permit', field: 'building', headerStyle: 'width: 20%' },
]

const performanceColumns = [
  { name: 'property', align: 'left', label: 'Boarding House', field: 'name', headerStyle: 'width: 28%' },
  { name: 'landlord', align: 'left', label: 'Landlord', field: 'landlord', headerStyle: 'width: 20%' },
  { name: 'rating', align: 'left', label: 'Rating', field: 'rating', headerStyle: 'width: 14%' },
  { name: 'response', align: 'left', label: 'Response', field: 'responseRate', headerStyle: 'width: 14%' },
  { name: 'occupancy', align: 'center', label: 'Occupancy', field: 'totalStudents', headerStyle: 'width: 24%' },
]

// Map real Supabase properties straight through — no invented audit/compliance
// fields. The rows carry the real boarding-house fields plus rooms + occupants.
const properties = computed(() => realProperties.value.map((p) => ({
  id: p.id,
  name: p.name,
  type: p.propertyType,
  initials: p.landlordInitials,
  landlord: p.landlord,
  contact: p.contact,
  verified: p.verified,
  status: p.status,
  rating: p.rating,
  address: p.address,
  floors: p.floors,
  totalRooms: p.totalRooms,
  occupiedRooms: p.occupiedRooms,
  totalStudents: p.totalStudents,
  totalCapacity: p.totalCapacity,
  occupancyRate: p.occupancyRate,
  femaleCount: p.femaleCount,
  maleCount: p.maleCount,
  roomType: p.roomType,
  description: p.description,
  accreditationStatus: p.accreditationStatus,
  accreditedAt: p.accreditedAt,
  accreditationExpiresAt: p.accreditationExpiresAt,
  responseRate: p.responseRate,
  rooms: p.rooms,
  permits: p.permits,
})))

// Set of permits a boarding house is required to submit for accreditation.
// Each becomes its own column in the Compliance tab.
const requiredPermits = ['fire', 'business', 'sanitary', 'building']

// True if the property has a submitted document matching the given required
// permit keyword. Matching is case-insensitive and bidirectional so labels like
// "fire certificate" or "business permit" both count against fire / business.
function findPermit(prop: any, requiredType: string): any {
  const kw = requiredType.toLowerCase()
  return (prop.permits ?? []).find((pm: any) => {
    const t = String(pm.type || '').toLowerCase()
    return t.includes(kw) || kw.includes(t)
  })
}

// Compliance state of one required permit for a property.
//   'missing'  -> no document uploaded
//   'expired'  -> document past its expiry date
//   'expiring' -> document valid but expires within 30 days
//   'valid'    -> document present and not expiring soon
function permitStatus(prop: any, requiredType: string): 'missing' | 'expired' | 'expiring' | 'valid' {
  const pm = findPermit(prop, requiredType)
  if (!pm) return 'missing'

  const exp = pm.expiresAt ? new Date(pm.expiresAt).getTime() : null
  if (exp == null) return 'valid' // no expiry recorded -> treat as valid

  const today = Date.now()
  const days30 = 30 * 24 * 60 * 60 * 1000
  if (exp < today) return 'expired'
  if (exp < today + days30) return 'expiring'
  return 'valid'
}

// Presentational settings for each compliance state, reusing BadgePill tones
// so each permit renders as a capsule in the table (no separate legend needed).
const PERMIT_STATE = {
  missing: { tone: 'neutral', icon: 'mdi:close-circle-outline', label: 'Not Submitted' },
  expired: { tone: 'danger', icon: 'mdi:close-circle', label: 'Expired' },
  expiring: { tone: 'warning', icon: 'mdi:clock-alert-outline', label: 'Expiring' },
  valid: { tone: 'success', icon: 'mdi:check-circle', label: 'Valid' },
} as const

const filteredProperties = computed(() => {
  let result = [...properties.value]

  const statusFilter = activeFilters.value.status
  if (statusFilter && statusFilter.length > 0) {
    result = result.filter((p) => statusFilter.includes(p.verified ? 'accredited' : 'pending'))
  }
  const typeFilter = activeFilters.value.type
  if (typeFilter && typeFilter.length > 0) {
    result = result.filter((p) => typeFilter.includes(p.type))
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.landlord.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    )
  }

  return result
})

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredProperties.value.slice(start, start + 10)
})

watch(activeTab, () => {
  search.value = ''
  currentPage.value = 1
})

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=160&background=0F766E&color=fff&bold=true`

const propertyPreview = computed<DrawerPreview>(() => {
  const p = selectedProperty.value
  if (!p) return { title: 'Property Preview', name: '', avatar: '', stats: [], details: [] }
  const chips: PreviewChip[] = [
    { text: p.type, tone: 'primary', icon: 'mdi:home-city' },
    p.verified
      ? { text: 'Accredited', tone: 'success', icon: 'mdi:check-circle' }
      : { text: 'Pending', tone: 'warning', icon: 'mdi:clock-outline' },
  ]
  const occupancy = p.totalCapacity ? `${Math.round((p.totalStudents / p.totalCapacity) * 100)}%` : '—'
  const stats = [
    { label: 'Occupants', value: p.totalStudents },
    { label: 'Rooms', value: p.totalRooms },
    { label: 'Rating', value: p.rating != null ? `${p.rating} ★` : '—' },
    { label: 'Occupancy', value: occupancy },
  ]
  const details = [
    { label: 'Property ID', value: String(p.id) },
    { label: 'Type', value: p.type },
    { label: 'Landlord', value: p.landlord },
    { label: 'Address', value: p.address },
    { label: 'Floors', value: p.floors ? String(p.floors) : '—' },
    { label: 'Total Rooms', value: String(p.totalRooms) },
    { label: 'Occupants', value: `${p.totalStudents} / ${p.totalCapacity}` },
    { label: 'Female / Male', value: `${p.femaleCount} / ${p.maleCount}` },
  ]
  const card = {
    title: 'Accreditation',
    footerLink: 'View Compliance',
    head: {
      code: p.accreditationStatus,
      title: 'Permit Status',
      status: p.verified ? 'Accredited' : 'Pending',
      statusTone: (p.verified ? 'success' : 'warning') as StatusTone,
    },
    cells: [
      { label: 'Status', tone: (p.verified ? 'success' : 'warning') as StatusTone, value: p.verified ? 'Accredited' : 'Pending' },
      { label: 'Rating', value: p.rating != null ? `${p.rating} ★` : '—' },
      { label: 'Response', value: p.responseRate != null ? `${p.responseRate}%` : '—' },
      { label: 'Expires', value: p.accreditationExpiresAt || '—' },
    ],
  }
  const activity = (p.rooms || []).slice(0, 5).map((r: any) => ({
    text: `<strong>Room ${r.name}</strong> — Floor ${r.floor ?? '—'}`,
    time: `Capacity ${r.capacity ?? '—'} · ${r.status === 'occupied' ? 'Occupied' : 'Available'}`,
  }))
  if (!activity.length) activity.push({ text: `<strong>${p.name}</strong> listing created`, time: p.accreditationExpiresAt || '—' })

  return {
    title: 'Property Preview',
    positionLabel: p.type,
    viewDetailsLabel: 'View Full Details',
    name: p.name,
    avatar: avatarUrl(p.name),
    chips,
    meta: p.address,
    org: { name: p.landlord, icon: 'mdi:account-tie' },
    stats,
    details,
    card,
    activity,
  }
})
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

/* Holds the table + the right-docked detail drawer together so the drawer
   anchors flush to the table's right edge (no margin, inside the card area). */
.prop-hub-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.non-shrink {
  flex-shrink: 0;
}

.room-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

/* Section transition (matches Users detail drawer) */
.ph-fade-enter-active,
.ph-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.ph-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.ph-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
