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
      :width="'460px'"
      anchored
      position="right"
      close-on-backdrop
    >
      <template #banner>
        <ProfileHero
          v-if="selectedProperty"
          :name="selectedProperty.name"
          :initials="selectedProperty.initials"
          avatar-color="primary"
          avatar-size="88px"
          avatar-font-size="32px"
          :role-label="selectedProperty.type"
          :role-style="{ icon: 'mdi:home-city' }"
          :status-label="selectedProperty.verified ? 'Accredited' : 'Pending'"
          :status-style="selectedProperty.verified ? { icon: 'mdi:check-circle' } : { icon: 'mdi:clock-outline' }"
        />
      </template>

      <template v-if="selectedProperty">
        <SegmentedToggle v-model="sectionTab" :options="sectionOptions" />

        <transition name="ph-fade" mode="out-in">
          <div :key="sectionTab" class="ph-section">

            <!-- DETAILS -->
            <template v-if="sectionTab === 'details'">
              <InfoCard title="Boarding House">
                <InfoRow icon="mdi:identifier" label="Property ID" :value="selectedProperty.id" :mono="true" />
                <InfoRow icon="mdi:domain" label="Type" :value="selectedProperty.type" />
                <InfoRow icon="mdi:account-tie" label="Landlord" :value="selectedProperty.landlord" />
                <InfoRow icon="mdi:map-marker" label="Address" :value="selectedProperty.address" />
                <InfoRow icon="mdi:floor-plan" label="Floors" :value="selectedProperty.floors ? String(selectedProperty.floors) : '—'" />
                <InfoRow icon="mdi:bed" label="Total Rooms" :value="selectedProperty.totalRooms ? String(selectedProperty.totalRooms) : '—'" :last="true" />
              </InfoCard>

              <InfoCard title="Occupancy">
                <InfoRow icon="mdi:account-group" label="Occupants" :value="String(selectedProperty.totalStudents)" />
                <InfoRow icon="mdi:gender-female" label="Female" :value="String(selectedProperty.femaleCount)" />
                <InfoRow icon="mdi:gender-male" label="Male" :value="String(selectedProperty.maleCount)" :last="true" />
              </InfoCard>
            </template>

            <!-- ROOMS & OCCUPANTS -->
            <template v-else>
              <div v-if="!selectedProperty.rooms?.length" class="text-muted q-pa-lg text-center">
                <Icon icon="mdi:bed-empty" width="40" height="40" class="q-mb-sm" />
                <div style="font-size: 13px;">No rooms listed yet.</div>
              </div>

              <div v-else class="column q-gutter-y-sm">
                <q-card v-for="room in selectedProperty.rooms" :key="room.id" flat bordered style="border-radius: 12px;">
                  <q-card-section class="q-py-sm row items-center justify-between">
                    <div class="row items-center no-wrap">
                      <div class="room-badge">
                        <Icon icon="mdi:bed-single" width="18" height="18" />
                      </div>
                      <div class="q-ml-sm">
                        <div class="text-weight-bold text-ink" style="font-size: 14px;">Room {{ room.name }}</div>
                        <div class="text-muted" style="font-size: 11px;">
                          Floor {{ room.floor ?? '—' }} · Capacity {{ room.capacity ?? '—' }}
                          <template v-if="room.monthlyRent != null"> · ₱{{ room.monthlyRent.toLocaleString('en-PH') }}/mo</template>
                        </div>
                      </div>
                    </div>
                    <BadgePill
                      :tone="room.status === 'occupied' ? 'success' : 'neutral'"
                      :label="room.status === 'occupied' ? 'Occupied' : 'Available'"
                    />
                  </q-card-section>

                  <q-separator v-if="room.occupants.length" />

                  <q-list v-if="room.occupants.length" dense class="q-pa-none">
                    <q-item v-for="o in room.occupants" :key="o.name" class="q-px-sm q-py-sm">
                      <q-item-section avatar>
                        <q-avatar size="34px" color="primary" text-color="white" class="text-weight-bold" style="font-size: 13px !important;">{{ o.initials }}</q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-bold text-ink" style="font-size: 13px;">{{ o.name }}</q-item-label>
                        <q-item-label caption class="text-muted">Since {{ o.since }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <Icon :icon="o.gender === 'female' ? 'mdi:gender-female' : 'mdi:gender-male'" :color="o.gender === 'female' ? '#e91e63' : '#42a5f5'" width="18" height="18" />
                      </q-item-section>
                    </q-item>
                  </q-list>

                  <q-card-section v-else class="q-py-sm">
                    <div class="text-muted text-caption">Vacant — no occupants.</div>
                  </q-card-section>
                </q-card>
              </div>
            </template>
          </div>
        </transition>
      </template>
    </DetailDrawer>

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
import ProfileHero from '@/components/user/ProfileHero.vue'
import SegmentedToggle from '@/components/ui/SegmentedToggle.vue'
import InfoCard from '@/components/ui/InfoCard.vue'
import InfoRow from '@/components/ui/InfoRow.vue'
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
const sectionTab = ref('details')

const sectionOptions = [
  { value: 'details', label: 'Details' },
  { value: 'rooms', label: 'Rooms & Occupants' },
]

function openProperty(row: any) {
  selectedProperty.value = row
  sectionTab.value = 'details'
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
