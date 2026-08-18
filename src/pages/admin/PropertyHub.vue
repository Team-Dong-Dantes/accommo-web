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

          <!-- AUDIT -->
          <q-tab-panel name="audit" class="q-pa-none">
            <DataTable :rows="paginatedProperties" :columns="auditColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="mdi:clipboard-text-outline" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No properties found</div>
                  <div>No properties matching your criteria.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click="openProperty(props.row)">
                      <q-td key="property" :props="props">
                        <UserInfoCell :initials="props.row.initials" :name="props.row.name" :avatar-color="props.row.avatarColor" :subtitle="props.row.id" />
                      </q-td>
                  <q-td key="landlord" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.landlord }}</q-td>
                  <q-td key="lastInspected" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.audit.lastInspected }}</q-td>
                  <q-td key="auditResult" :props="props">
                    <BadgePill :bg="getAuditColor(props.row.audit.result).bg" :text-color="getAuditColor(props.row.audit.result).text" :label="props.row.audit.result" />
                  </q-td>
                  <q-td key="nextInspection" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.audit.nextInspection }}</q-td>
                  <q-td key="inspector" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.audit.inspector }}</q-td>
                  <q-td key="notes" :props="props" class="text-muted ellipsis" style="font-size: 12px; max-width: 100%;">{{ props.row.audit.notes }}</q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- COMPLIANCE -->
          <q-tab-panel name="compliance" class="q-pa-none">
            <DataTable :rows="paginatedProperties" :columns="complianceColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="mdi:file-check-outline" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No properties found</div>
                  <div>No properties matching your criteria.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click="openProperty(props.row)">
                      <q-td key="property" :props="props">
                        <UserInfoCell :initials="props.row.initials" :name="props.row.name" :avatar-color="props.row.avatarColor" :subtitle="props.row.id" />
                      </q-td>
                  <q-td key="landlord" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.landlord }}</q-td>
                  <q-td v-for="permit in ['business','sanitary','fire','water']" :key="permit" :props="props">
                    <div class="column items-center justify-center">
                      <BadgePill :bg="getComplianceColor(props.row.compliance[permit].status).bg" :text-color="getComplianceColor(props.row.compliance[permit].status).text" :label="props.row.compliance[permit].status" />
                      <div class="text-muted q-mt-xs text-weight-medium" style="font-size: 10px;">{{ props.row.compliance[permit].date }}</div>
                    </div>
                  </q-td>
                  <q-td key="overall" :props="props">
                    <div class="column items-center justify-center">
                      <BadgePill :bg="getComplianceColor(props.row.compliance.overall).bg" :text-color="getComplianceColor(props.row.compliance.overall).text" :label="props.row.compliance.overall" />
                    </div>
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- ACCREDITATION -->
          <q-tab-panel name="accreditation" class="q-pa-none">
            <DataTable :rows="paginatedProperties" :columns="accreditationColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="mdi:certificate-outline" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No properties found</div>
                  <div>No properties matching your criteria.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click="openProperty(props.row)">
                      <q-td key="property" :props="props">
                        <UserInfoCell :initials="props.row.initials" :name="props.row.name" :avatar-color="props.row.avatarColor" :subtitle="props.row.id" />
                      </q-td>
                  <q-td key="landlord" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.landlord }}</q-td>
                  <q-td key="rooms" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.accreditation.rooms }}</q-td>
                  <q-td key="status" :props="props">
                    <BadgePill :bg="getAccreditationColor(props.row.accreditation.status).bg" :text-color="getAccreditationColor(props.row.accreditation.status).text" :icon="getAccreditationColor(props.row.accreditation.status).icon" :label="props.row.accreditation.status" />
                  </q-td>
                  <q-td key="lastRenewed" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.accreditation.lastRenewed }}</q-td>
                  <q-td key="nextRenewal" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.accreditation.nextRenewal }}</q-td>
                  <q-td key="cycle" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.accreditation.cycle }}</q-td>
                  <q-td key="inspector" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.accreditation.inspector }}</q-td>
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
                  <div class="text-h6 text-weight-bold">No properties found</div>
                  <div>No properties matching your criteria.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click="openProperty(props.row)">
                  <q-td key="rank" :props="props" class="text-muted text-weight-bold" style="font-size: 13px;">#{{ props.row.performance.rank }}</q-td>
                      <q-td key="property" :props="props">
                        <UserInfoCell :initials="props.row.initials" :name="props.row.name" :avatar-color="props.row.avatarColor" :subtitle="props.row.id" />
                      </q-td>
                  <q-td key="landlord" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.landlord }}</q-td>
                  <q-td v-for="metric in ['grievance','inspection','renewal']" :key="metric" :props="props">
                    <div class="row items-center no-wrap" style="width: 100%;">
                      <q-linear-progress :value="props.row.performance[metric] / 100" :color="getPerformanceColor(props.row.performance[metric])" class="col q-mr-sm" style="border-radius: 4px;" size="6px" />
                      <span :class="`text-${getPerformanceColor(props.row.performance[metric])}`" class="text-weight-bold shrink-0" style="font-size: 12px; width: 22px;">{{ props.row.performance[metric] }}</span>
                    </div>
                  </q-td>
                  <q-td key="response" :props="props" class="text-ink text-weight-medium" style="font-size: 12px;">{{ props.row.performance.response }}</q-td>
                  <q-td key="score" :props="props" :class="`text-${getPerformanceColor(props.row.performance.score)}`" class="text-weight-bold text-center" style="font-size: 14px;">{{ props.row.performance.score }}</q-td>
                  <q-td key="trend" :props="props" class="text-center">
                    <Icon :icon="getTrend(props.row.performance.trend).icon" :color="getTrend(props.row.performance.trend).color" width="18" height="18" />
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

        </q-tab-panels>
      </template>
    </TableCard>

    <DetailDrawer v-model="drawerOpen">
      <template #banner>
        <ProfileHero
          :name="selectedProperty?.name"
          :initials="selectedProperty?.initials"
          :avatar-color="selectedProperty?.avatarColor"
          role-label="Boarding House"
          :role-style="{ icon: 'mdi:home-city' }"
          :status-label="selectedProperty?.accreditation.status"
          :status-style="getAccreditationColor(selectedProperty?.accreditation.status)"
        />
      </template>

      <template v-if="selectedProperty">
        <SegmentedToggle v-model="sectionTab" :options="sectionOptions" />

        <transition name="ph-fade" mode="out-in">
          <div :key="sectionTab" class="ph-section">

            <!-- OVERVIEW -->
            <template v-if="sectionTab === 'overview'">
              <InfoCard title="Basic Info">
                <InfoRow icon="mdi:identifier" label="Property ID" :value="selectedProperty.id" :mono="true" />
                <InfoRow icon="mdi:account-tie" label="Landlord" :value="selectedProperty.landlord" />
                <InfoRow icon="mdi:bed" label="Total Rooms" :value="selectedProperty.accreditation.rooms != null ? String(selectedProperty.accreditation.rooms) : '—'" :last="true" />
              </InfoCard>

              <InfoCard title="Accreditation">
                <InfoRow icon="mdi:certificate" label="Status" :value="selectedProperty.accreditation.status" />
                <InfoRow icon="mdi:calendar-clock" label="Next Renewal" :value="selectedProperty.accreditation.nextRenewal" />
                <InfoRow icon="mdi:account-search" label="Inspector" :value="selectedProperty.accreditation.inspector" :last="true" />
              </InfoCard>
            </template>

            <!-- COMPLIANCE -->
            <template v-else-if="sectionTab === 'compliance'">
              <InfoCard title="Permits">
                <InfoRow icon="mdi:domain" label="Business Permit" :value="fmtPermit(selectedProperty.compliance.business)" />
                <InfoRow icon="mdi:spray-bottle" label="Sanitary Permit" :value="fmtPermit(selectedProperty.compliance.sanitary)" />
                <InfoRow icon="mdi:fire" label="Fire Certificate" :value="fmtPermit(selectedProperty.compliance.fire)" />
                <InfoRow icon="mdi:water" label="Water Permit" :value="fmtPermit(selectedProperty.compliance.water)" />
                <InfoRow icon="mdi:shield-check" label="Overall" :value="selectedProperty.compliance.overall" :last="true" />
              </InfoCard>
            </template>

          </div>
        </transition>
      </template>

      <template #footer>
        <div class="row items-center justify-end">
          <q-btn unelevated no-caps color="primary" text-color="white" class="text-weight-bold ph-close-btn" @click="drawerOpen = false">
            Close
          </q-btn>
        </div>
      </template>
    </DetailDrawer>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
const activeTab = ref('audit')
const currentPage = ref(1)
const activeFilters = ref<Record<string, any[]>>({})

const { loading, error: propsError, properties: realProperties, load: loadProperties } = useProperties()

const tabs = [
  { name: 'audit', label: 'Audit' },
  { name: 'compliance', label: 'Compliance' },
  { name: 'accreditation', label: 'Accreditation' },
  { name: 'performance', label: 'Performance' },
]

const filterConfig = [
  { label: 'Accreditation', key: 'accr', options: [
    { label: 'Fully Accredited', value: 'Fully Accredited' },
    { label: 'Provisional', value: 'Provisional' },
    { label: 'Under Review', value: 'Under Review' },
  ]},
  { label: 'Audit Result', key: 'audit', options: [
    { label: 'Pass', value: 'Pass' },
    { label: 'Warning', value: 'Warning' },
    { label: 'Fail', value: 'Fail' },
  ]},
]

function clearFilters() {
  activeFilters.value = {}
}

async function fetchProperties() {
  await loadProperties()
}

onMounted(fetchProperties)

const drawerOpen = ref(false)
const selectedProperty = ref<any | null>(null)
const sectionTab = ref('overview')

function openProperty(row: any) {
  selectedProperty.value = row
  sectionTab.value = 'overview'
  drawerOpen.value = true
}

function cap(s: string | null | undefined) {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function fmtPermit(p: any) {
  if (!p || p.status === '—') return '—'
  return `${p.status}${p.date && p.date !== '—' ? ' · ' + p.date : ''}`
}

const sectionOptions = [
  { value: 'overview', label: 'Overview' },
  { value: 'compliance', label: 'Compliance' },
]

const auditColumns = [
  { name: 'property', align: 'left', label: 'Property', field: 'name', headerStyle: 'width: 22%' },
  { name: 'landlord', align: 'left', label: 'Landlord', field: 'landlord', headerStyle: 'width: 15%' },
  { name: 'lastInspected', align: 'left', label: 'Last Inspected', field: row => row.audit.lastInspected, headerStyle: 'width: 12%' },
  { name: 'auditResult', align: 'left', label: 'Result', field: row => row.audit.result, headerStyle: 'width: 10%' },
  { name: 'nextInspection', align: 'left', label: 'Next Inspection', field: row => row.audit.nextInspection, headerStyle: 'width: 12%' },
  { name: 'inspector', align: 'left', label: 'Inspector', field: row => row.audit.inspector, headerStyle: 'width: 12%' },
  { name: 'notes', align: 'left', label: 'Notes', field: row => row.audit.notes, headerStyle: 'width: 17%' }
]

const complianceColumns = [
  { name: 'property', align: 'left', label: 'Property', field: 'name', headerStyle: 'width: 22%' },
  { name: 'landlord', align: 'left', label: 'Landlord', field: 'landlord', headerStyle: 'width: 16%' },
  { name: 'business', align: 'center', label: 'Business Permit', field: row => row.compliance.business, headerStyle: 'width: 12%' },
  { name: 'sanitary', align: 'center', label: 'Sanitary Permit', field: row => row.compliance.sanitary, headerStyle: 'width: 12%' },
  { name: 'fire', align: 'center', label: 'Fire Certificate', field: row => row.compliance.fire, headerStyle: 'width: 12%' },
  { name: 'water', align: 'center', label: 'Water Permit', field: row => row.compliance.water, headerStyle: 'width: 12%' },
  { name: 'overall', align: 'center', label: 'Overall', field: row => row.compliance.overall, headerStyle: 'width: 14%' }
]

const accreditationColumns = [
  { name: 'property', align: 'left', label: 'Property', field: 'name', headerStyle: 'width: 24%' },
  { name: 'landlord', align: 'left', label: 'Landlord', field: 'landlord', headerStyle: 'width: 16%' },
  { name: 'rooms', align: 'left', label: 'Rooms', field: row => row.accreditation.rooms, headerStyle: 'width: 8%' },
  { name: 'status', align: 'left', label: 'Status', field: row => row.accreditation.status, headerStyle: 'width: 14%' },
  { name: 'lastRenewed', align: 'left', label: 'Last Renewed', field: row => row.accreditation.lastRenewed, headerStyle: 'width: 12%' },
  { name: 'nextRenewal', align: 'left', label: 'Next Renewal', field: row => row.accreditation.nextRenewal, headerStyle: 'width: 12%' },
  { name: 'cycle', align: 'left', label: 'Cycle', field: row => row.accreditation.cycle, headerStyle: 'width: 8%' },
  { name: 'inspector', align: 'left', label: 'Inspector', field: row => row.accreditation.inspector, headerStyle: 'width: 16%' }
]

const performanceColumns = [
  { name: 'rank', align: 'left', label: 'Rank', field: row => row.performance.rank, headerStyle: 'width: 6%' },
  { name: 'property', align: 'left', label: 'Property', field: 'name', headerStyle: 'width: 22%' },
  { name: 'landlord', align: 'left', label: 'Landlord', field: 'landlord', headerStyle: 'width: 14%' },
  { name: 'grievance', align: 'left', label: 'Grievance', field: row => row.performance.grievance, headerStyle: 'width: 14%' },
  { name: 'inspection', align: 'left', label: 'Inspection', field: row => row.performance.inspection, headerStyle: 'width: 14%' },
  { name: 'renewal', align: 'left', label: 'Renewal', field: row => row.performance.renewal, headerStyle: 'width: 14%' },
  { name: 'response', align: 'left', label: 'Response', field: row => row.performance.response, headerStyle: 'width: 6%' },
  { name: 'score', align: 'center', label: 'Score', field: row => row.performance.score, headerStyle: 'width: 6%' },
  { name: 'trend', align: 'center', label: 'Trend', field: row => row.performance.trend, headerStyle: 'width: 4%' }
]

const currentColumns = computed(() => {
  if (activeTab.value === 'compliance') return complianceColumns
  if (activeTab.value === 'accreditation') return accreditationColumns
  if (activeTab.value === 'performance') return performanceColumns
  return auditColumns
})

const properties = computed(() => {
  // Map real Supabase properties into the per-tab view shape. The DB carries
  // basic property + landlord-profile data only; audit results, inspectors,
  // compliance permit statuses and performance scores do not exist yet, so
  // those render as '—'.
  return realProperties.value.map((p) => {
    const accrLabel =
      p.accreditationStatus === 'accredited' || p.accreditationStatus === 'verified'
        ? 'Fully Accredited'
        : p.accreditationStatus
        ? p.accreditationStatus
        : '—'

    return {
      id: p.id,
      initials: p.landlordInitials,
      avatarColor: 'teal-6',
      name: p.name,
      landlord: p.landlord,
      // Audit — no source data in DB
      audit: {
        lastInspected: '—',
        result: '—',
        nextInspection: '—',
        inspector: '—',
        notes: '—',
      },
      // Compliance — permit tracking not in DB yet
      compliance: {
        business: { status: '—', date: '—' },
        sanitary: { status: '—', date: '—' },
        fire: { status: '—', date: '—' },
        water: { status: '—', date: '—' },
        overall: '—',
      },
      // Accreditation — from landlord_profiles
      accreditation: {
        rooms: p.totalRooms,
        status: accrLabel,
        lastRenewed: '—',
        nextRenewal: p.accreditationExpiresAt
          ? new Date(p.accreditationExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—',
        cycle: '—',
        inspector: '—',
      },
      // Performance — only response rate exists on landlord_profiles
      performance: {
        rank: 0,
        grievance: 0,
        inspection: 0,
        renewal: 0,
        response: p.responseRate != null ? `${p.responseRate}%` : '—',
        score: 0,
        trend: 'flat',
      },
    }
  })
})


const filteredProperties = computed(() => {
  let result = [...properties.value]

  // Apply active filters (accreditation / audit result)
  const accrFilter = activeFilters.value.accr
  if (accrFilter && accrFilter.length > 0) {
    result = result.filter(p => accrFilter.includes(p.accreditation.status))
  }
  const auditFilter = activeFilters.value.audit
  if (auditFilter && auditFilter.length > 0) {
    result = result.filter(p => auditFilter.includes(p.audit.result))
  }

  if (search.value) {
    const query = search.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.landlord.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    )
  }

  if (activeTab.value === 'performance') {
    result.sort((a, b) => a.performance.rank - b.performance.rank)
  } else {
    result.sort((a, b) => a.id.localeCompare(b.id))
  }

  return result
})

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredProperties.value.slice(start, start + 10)
})

function getAuditColor(result: string) {
  if (result === 'Pass') return { bg: 'green-1', text: 'green-7' }
  if (result === 'Warning') return { bg: 'orange-1', text: 'orange-7' }
  return { bg: 'red-1', text: 'red-6' }
}

function getComplianceColor(status: string) {
  if (status === 'Valid') return { bg: 'green-1', text: 'green-7' }
  if (status === 'Expiring') return { bg: 'orange-1', text: 'orange-7' }
  if (status === 'Expired') return { bg: 'red-1', text: 'red-6' }
  return { bg: 'grey-3', text: 'grey-8' }
}

function getAccreditationColor(status: string) {
  const s = status.toLowerCase()
  if (s === 'fully accredited' || s === 'accredited' || s === 'verified') return { bg: 'green-1', text: 'green-7', icon: 'mdi:check-circle' }
  if (s === 'provisional' || s === 'reviewing') return { bg: 'indigo-1', text: 'indigo-5', icon: 'mdi:clock-outline' }
  if (s === 'under review' || s === 'pending') return { bg: 'orange-1', text: 'orange-7', icon: 'mdi:alert' }
  if (s === 'blacklisted' || s === 'rejected' || s === 'delisted') return { bg: 'red-1', text: 'red-6', icon: 'mdi:cancel' }
  return { bg: 'grey-2', text: 'grey-6', icon: 'mdi:sync' }
}

function getPerformanceColor(score: number) {
  if (score >= 85) return 'green-5'
  if (score >= 60) return 'orange-5'
  return 'red-5'
}

function getTrend(trend: string) {
  if (trend === 'up') return { icon: 'mdi:trending-up', color: 'green-5' }
  if (trend === 'down') return { icon: 'mdi:trending-down', color: 'red-5' }
  return { icon: 'mdi:minus', color: 'grey-5' }
}
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

.non-shrink {
  flex-shrink: 0;
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

.ph-close-btn {
  border-radius: var(--radius-btn);
  padding: 8px 22px;
}
</style>
