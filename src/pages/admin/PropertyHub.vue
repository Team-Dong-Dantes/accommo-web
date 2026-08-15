<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <q-btn
        unelevated
        color="teal-7"
        no-caps
        class="text-weight-bold export-btn"
        style="border-radius: 8px; padding: 6px 16px;"
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
                <q-tr :props="props" class="smart-row">
                  <q-td key="property" :props="props">
                    <div class="row items-center no-wrap">
                      <q-avatar size="40px" :color="props.row.avatarColor" text-color="white" class="text-weight-bold q-mr-md" style="font-size: 14px">{{ props.row.initials }}</q-avatar>
                      <div class="column">
                        <div class="text-weight-bold text-ink" style="font-size: 14px; line-height: 1.25">{{ props.row.name }}</div>
                        <div class="text-muted" style="font-size: 12px">{{ props.row.id }}</div>
                      </div>
                    </div>
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
                <q-tr :props="props" class="smart-row">
                  <q-td key="property" :props="props">
                    <div class="row items-center no-wrap">
                      <q-avatar size="40px" :color="props.row.avatarColor" text-color="white" class="text-weight-bold q-mr-md" style="font-size: 14px">{{ props.row.initials }}</q-avatar>
                      <div class="column">
                        <div class="text-weight-bold text-ink" style="font-size: 14px; line-height: 1.25">{{ props.row.name }}</div>
                        <div class="text-muted" style="font-size: 12px">{{ props.row.id }}</div>
                      </div>
                    </div>
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
                <q-tr :props="props" class="smart-row">
                  <q-td key="property" :props="props">
                    <div class="row items-center no-wrap">
                      <q-avatar size="40px" :color="props.row.avatarColor" text-color="white" class="text-weight-bold q-mr-md" style="font-size: 14px">{{ props.row.initials }}</q-avatar>
                      <div class="column">
                        <div class="text-weight-bold text-ink" style="font-size: 14px; line-height: 1.25">{{ props.row.name }}</div>
                        <div class="text-muted" style="font-size: 12px">{{ props.row.id }}</div>
                      </div>
                    </div>
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
                <q-tr :props="props" class="smart-row">
                  <q-td key="rank" :props="props" class="text-muted text-weight-bold" style="font-size: 13px;">#{{ props.row.performance.rank }}</q-td>
                  <q-td key="property" :props="props">
                    <div class="row items-center no-wrap">
                      <q-avatar size="40px" :color="props.row.avatarColor" text-color="white" class="text-weight-bold q-mr-md" style="font-size: 14px">{{ props.row.initials }}</q-avatar>
                      <div class="column">
                        <div class="text-weight-bold text-ink" style="font-size: 14px; line-height: 1.25">{{ props.row.name }}</div>
                        <div class="text-muted" style="font-size: 12px">{{ props.row.id }}</div>
                      </div>
                    </div>
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

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TabNav from '@/components/common/TabNav.vue'
import TableCard from '@/components/common/TableCard.vue'
import DataTable from '@/components/common/DataTable.vue'
import BadgePill from '@/components/common/BadgePill.vue'

const search = ref('')
const activeTab = ref('audit')
const currentPage = ref(1)
const loading = ref(true)
const activeFilters = ref<Record<string, any[]>>({})

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
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 400))
  loading.value = false
}

onMounted(fetchProperties)

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

const properties = ref([
  {
    id: 'HSE-001', initials: 'JD', avatarColor: 'teal-6', name: 'Pinzon Student Hub', landlord: 'Juan Dela Cruz',
    audit: { lastInspected: 'Jan 10, 2026', result: 'Pass', nextInspection: 'Jul 10, 2026', inspector: 'Officer Reyes', notes: 'All facilities in excellent condition.' },
    compliance: { business: { status: 'Valid', date: 'Dec 31, 2026' }, sanitary: { status: 'Valid', date: 'Jun 30, 2026' }, fire: { status: 'Expiring', date: 'May 10, 2026' }, water: { status: 'Valid', date: 'Dec 31, 2026' }, overall: 'Expiring' },
    accreditation: { rooms: 12, status: 'Fully Accredited', lastRenewed: 'Aug 1, 2025', nextRenewal: 'Aug 1, 2026', cycle: 'Annual', inspector: 'Officer Reyes' },
    performance: { rank: 4, grievance: 88, inspection: 94, renewal: 85, response: '2.1h', score: 88, trend: 'up' }
  },
  {
    id: 'HSE-002', initials: 'RM', avatarColor: 'indigo-5', name: 'ISU Gate Apartment', landlord: 'Rosa Mercado',
    audit: { lastInspected: 'Jan 15, 2026', result: 'Warning', nextInspection: 'Apr 15, 2026', inspector: 'Maria Admin', notes: 'Water permit missing. Corrective action required within 30 days.' },
    compliance: { business: { status: 'Valid', date: 'Dec 31, 2026' }, sanitary: { status: 'Expiring', date: 'Apr 28, 2026' }, fire: { status: 'Valid', date: 'Dec 31, 2026' }, water: { status: 'Missing', date: '—' }, overall: 'Missing' },
    accreditation: { rooms: 8, status: 'Fully Accredited', lastRenewed: 'Sep 5, 2025', nextRenewal: 'Sep 5, 2026', cycle: 'Annual', inspector: 'Maria Admin' },
    performance: { rank: 5, grievance: 85, inspection: 82, renewal: 88, response: '3h', score: 83, trend: 'up' }
  },
  {
    id: 'HSE-003', initials: 'NA', avatarColor: 'light-blue-6', name: 'Camarines View Residences', landlord: 'Noel Aquino',
    audit: { lastInspected: 'Feb 5, 2026', result: 'Warning', nextInspection: 'May 5, 2026', inspector: 'Officer Reyes', notes: 'Business permit expired. Provisional status granted pending renewal.' },
    compliance: { business: { status: 'Expired', date: 'Mar 1, 2026' }, sanitary: { status: 'Valid', date: 'Dec 31, 2026' }, fire: { status: 'Valid', date: 'Nov 30, 2026' }, water: { status: 'Valid', date: 'Dec 31, 2026' }, overall: 'Expired' },
    accreditation: { rooms: 6, status: 'Provisional', lastRenewed: 'Aug 10, 2025', nextRenewal: 'Feb 10, 2026', cycle: 'Semi-annual', inspector: 'Officer Reyes' },
    performance: { rank: 6, grievance: 75, inspection: 70, renewal: 80, response: '4.2h', score: 74, trend: 'down' }
  },
  {
    id: 'HSE-004', initials: 'PS', avatarColor: 'orange-5', name: 'Magsaysay Students Inn', landlord: 'Pedro Santos',
    audit: { lastInspected: 'Feb 10, 2026', result: 'Fail', nextInspection: 'Apr 10, 2026', inspector: 'Maria Admin', notes: 'Fire certificate expired. Immediate compliance required.' },
    compliance: { business: { status: 'Valid', date: 'Dec 31, 2026' }, sanitary: { status: 'Valid', date: 'Sep 30, 2026' }, fire: { status: 'Expired', date: 'Jan 15, 2026' }, water: { status: 'Expiring', date: 'Apr 30, 2026' }, overall: 'Expired' },
    accreditation: { rooms: 10, status: 'Under Review', lastRenewed: 'Jul 15, 2025', nextRenewal: 'Jul 15, 2026', cycle: 'Annual', inspector: 'Maria Admin' },
    performance: { rank: 7, grievance: 68, inspection: 72, renewal: 75, response: '5h', score: 70, trend: 'down' }
  },
  {
    id: 'HSE-005', initials: 'RC', avatarColor: 'deep-orange-5', name: 'Cruz Residence Dormitory', landlord: 'Ramon dela Cruz',
    audit: { lastInspected: 'Jan 20, 2026', result: 'Pass', nextInspection: 'Jul 20, 2026', inspector: 'Jose Reyes', notes: 'Outstanding facility. Zero violations in 2025.' },
    compliance: { business: { status: 'Valid', date: 'Dec 31, 2026' }, sanitary: { status: 'Valid', date: 'Dec 31, 2026' }, fire: { status: 'Valid', date: 'Dec 31, 2026' }, water: { status: 'Valid', date: 'Dec 31, 2026' }, overall: 'Valid' },
    accreditation: { rooms: 15, status: 'Fully Accredited', lastRenewed: 'Aug 1, 2025', nextRenewal: 'Aug 1, 2026', cycle: 'Annual', inspector: 'Jose Reyes' },
    performance: { rank: 1, grievance: 98, inspection: 96, renewal: 95, response: '1.2h', score: 97, trend: 'up' }
  },
  {
    id: 'HSE-006', initials: 'CD', avatarColor: 'teal-5', name: 'Sunrise Boarding House', landlord: 'Carla Domingo',
    audit: { lastInspected: 'Feb 20, 2026', result: 'Fail', nextInspection: 'Apr 20, 2026', inspector: 'Officer Reyes', notes: 'Fire certificate missing. Building temporarily flagged.' },
    compliance: { business: { status: 'Expiring', date: 'May 5, 2026' }, sanitary: { status: 'Expiring', date: 'May 1, 2026' }, fire: { status: 'Missing', date: '—' }, water: { status: 'Valid', date: 'Dec 31, 2026' }, overall: 'Missing' },
    accreditation: { rooms: 8, status: 'Provisional', lastRenewed: 'Oct 1, 2025', nextRenewal: 'Apr 1, 2026', cycle: 'Semi-annual', inspector: 'Officer Reyes' },
    performance: { rank: 8, grievance: 55, inspection: 50, renewal: 60, response: '8.5h', score: 54, trend: 'down' }
  },
  {
    id: 'HSE-007', initials: 'DF', avatarColor: 'orange-6', name: 'Flores Family Boarding', landlord: 'Dante Flores',
    audit: { lastInspected: 'Jan 25, 2026', result: 'Pass', nextInspection: 'Jul 25, 2026', inspector: 'Maria Admin', notes: 'Good standing. Water permit renewal recommended.' },
    compliance: { business: { status: 'Valid', date: 'Dec 31, 2026' }, sanitary: { status: 'Valid', date: 'Oct 31, 2026' }, fire: { status: 'Valid', date: 'Dec 31, 2026' }, water: { status: 'Missing', date: '—' }, overall: 'Missing' },
    accreditation: { rooms: 9, status: 'Fully Accredited', lastRenewed: 'Aug 5, 2025', nextRenewal: 'Aug 5, 2026', cycle: 'Annual', inspector: 'Maria Admin' },
    performance: { rank: 3, grievance: 90, inspection: 88, renewal: 90, response: '2.5h', score: 89, trend: 'flat' }
  },
  {
    id: 'HSE-008', initials: 'LP', avatarColor: 'green-5', name: 'Pascual Student Home', landlord: 'Leni Pascual',
    audit: { lastInspected: 'Jan 28, 2026', result: 'Pass', nextInspection: 'Jul 28, 2026', inspector: 'Jose Reyes', notes: 'All permits valid. Student satisfaction: 4.8/5.' },
    compliance: { business: { status: 'Valid', date: 'Dec 31, 2026' }, sanitary: { status: 'Valid', date: 'Dec 31, 2026' }, fire: { status: 'Valid', date: 'Dec 31, 2026' }, water: { status: 'Valid', date: 'Dec 31, 2026' }, overall: 'Valid' },
    accreditation: { rooms: 6, status: 'Fully Accredited', lastRenewed: 'Aug 8, 2025', nextRenewal: 'Aug 8, 2026', cycle: 'Annual', inspector: 'Jose Reyes' },
    performance: { rank: 2, grievance: 95, inspection: 92, renewal: 100, response: '1.8h', score: 95, trend: 'up' }
  },
  {
    id: 'HSE-009', initials: 'FG', avatarColor: 'teal-6', name: 'Gutierrez Inn', landlord: 'Fe Gutierrez',
    audit: { lastInspected: 'Apr 6, 2026', result: 'Warning', nextInspection: 'May 6, 2026', inspector: 'TBD', notes: 'First-time applicant. All permits submitted for review.' },
    compliance: { business: { status: 'Missing', date: '—' }, sanitary: { status: 'Missing', date: '—' }, fire: { status: 'Missing', date: '—' }, water: { status: 'Missing', date: '—' }, overall: 'Missing' },
    accreditation: { rooms: 4, status: 'Under Review', lastRenewed: '—', nextRenewal: '—', cycle: 'Annual', inspector: 'TBD' },
    performance: { rank: 10, grievance: 50, inspection: 45, renewal: 0, response: '1d', score: 38, trend: 'flat' }
  },
  {
    id: 'HSE-010', initials: 'MO', avatarColor: 'blue-grey-5', name: 'Oreta Lodging House', landlord: 'Manny Oreta',
    audit: { lastInspected: 'Jan 5, 2026', result: 'Fail', nextInspection: '—', inspector: 'Maria Admin', notes: 'Blacklisted. All permits missing. Property closed.' },
    compliance: { business: { status: 'Missing', date: '—' }, sanitary: { status: 'Missing', date: '—' }, fire: { status: 'Missing', date: '—' }, water: { status: 'Missing', date: '—' }, overall: 'Missing' },
    accreditation: { rooms: 7, status: 'Blacklisted', lastRenewed: 'Aug 1, 2024', nextRenewal: '—', cycle: '—', inspector: 'Maria Admin' },
    performance: { rank: 11, grievance: 10, inspection: 15, renewal: 20, response: '2d', score: 12, trend: 'down' }
  },
  {
    id: 'HSE-011', initials: 'JR', avatarColor: 'deep-purple-4', name: 'Reyes Dormitory', landlord: 'Jose Reyes',
    audit: { lastInspected: 'Mar 1, 2026', result: 'Fail', nextInspection: '—', inspector: 'Officer Reyes', notes: 'Accreditation expired. Fire cert approaching expiry.' },
    compliance: { business: { status: 'Valid', date: 'Dec 31, 2026' }, sanitary: { status: 'Valid', date: 'Dec 31, 2026' }, fire: { status: 'Expiring', date: 'Apr 25, 2026' }, water: { status: 'Valid', date: 'Dec 31, 2026' }, overall: 'Expiring' },
    accreditation: { rooms: 6, status: 'Expired', lastRenewed: 'Aug 1, 2024', nextRenewal: 'Aug 1, 2025', cycle: 'Annual', inspector: 'Officer Reyes' },
    performance: { rank: 9, grievance: 40, inspection: 38, renewal: 50, response: '12h', score: 40, trend: 'down' }
  }
])

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
  if (status === 'Fully Accredited') return { bg: 'green-1', text: 'green-7', icon: 'mdi:check-circle' }
  if (status === 'Provisional') return { bg: 'orange-1', text: 'orange-7', icon: 'mdi:alert' }
  if (status === 'Under Review') return { bg: 'indigo-1', text: 'indigo-5', icon: 'mdi:clock-outline' }
  if (status === 'Blacklisted') return { bg: 'red-1', text: 'red-6', icon: 'mdi:cancel' }
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

.export-btn {
  margin-bottom: 10px;
}

/* Row hover + border (cell renderers live here, table chrome lives in TableCard) */
:deep(.q-table tbody tr) {
  transition: background-color 0.2s ease;
}
:deep(.q-table tbody tr:hover) {
  background-color: var(--c-surface-2);
}
:deep(.q-table tbody td) {
  border-bottom: 1px solid var(--c-border);
}
</style>
