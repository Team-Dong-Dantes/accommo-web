<template>
  <!-- Locked the page height and hid overflow -->
  <q-page class="q-pa-md column no-wrap" style="background-color: #f4f6f8; height: calc(100vh - 60px); overflow: hidden;">

    <!-- Top Navigation Row -->
    <div class="row justify-between items-end q-mb-none shrink-0">

      <!-- Folder Clip Tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        no-caps
        align="left"
        class="folder-tabs text-dark"
      >
        <q-tab name="audit" label="Audit" class="text-weight-bold" />
        <q-tab name="compliance" label="Compliance" class="text-weight-bold" />
        <q-tab name="accreditation" label="Accreditation" class="text-weight-bold" />
        <q-tab name="performance" label="Performance" class="text-weight-bold" />
      </q-tabs>

      <!-- Export Button -->
      <q-btn
        unelevated
        color="teal-7"
        no-caps
        class="text-weight-bold"
        style="border-radius: 8px; padding: 6px 16px; margin-bottom: 12px;"
      >
        <Icon icon="mdi:download" class="on-left" width="18" height="18" />Export
      </q-btn>
    </div>

    <!-- Main Table Card (Fills remaining height) -->
    <q-card flat class="bg-white table-container q-mt-none col column no-wrap" style="border-radius: 0 12px 12px 12px; overflow: hidden;">

      <!-- Toolbar -->
      <div class="row items-center q-pa-md border-bottom q-gutter-x-sm shrink-0">
        <SearchInput v-model="search" placeholder="Search property or landlord..." style="width: 300px;" />
        <FilterDropdown />
        <div class="text-grey-6 text-weight-medium q-ml-sm" style="font-size: 13px;">
          <q-badge color="grey-2" text-color="grey-7" class="q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px;">
            {{ filteredProperties.length }} properties
          </q-badge>
        </div>
      </div>

      <!-- Dynamic Data Table (Scrolls internally if needed) -->
      <q-table
        flat
        :rows="paginatedProperties"
        :columns="currentColumns"
        row-key="id"
        :rows-per-page-options="[15]"
        hide-pagination
        class="col custom-table"
      >
        <!-- Header Styling -->
        <template v-slot:header="props">
          <q-tr :props="props" class="bg-grey-1 border-bottom">
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              class="text-grey-6 text-weight-bold text-uppercase tracking-wide"
              :style="[col.headerStyle || '', 'font-size: 11px; padding: 12px 16px;']"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <!-- Body Rows -->
        <template v-slot:body="props">
          <q-tr :props="props" class="table-row">

            <q-td v-for="col in props.cols" :key="col.name" :props="props" style="padding: 12px 16px; white-space: normal;">

              <!-- GLOBAL: Property Column -->
              <div v-if="col.name === 'property'" class="row items-center no-wrap">
                <q-avatar size="36px" :color="props.row.avatarColor" text-color="white" class="text-weight-bold q-mr-md" style="font-size: 13px; flex-shrink: 0;">
                  {{ props.row.initials }}
                </q-avatar>
                <div class="column">
                  <div class="text-weight-bold text-dark" style="font-size: 13px;">{{ props.row.name }}</div>
                  <div class="text-grey-5" style="font-size: 11px;">{{ props.row.id }}</div>
                </div>
              </div>

              <!-- GLOBAL: Landlord Column -->
              <div v-else-if="col.name === 'landlord'" class="text-grey-8" style="font-size: 13px;">
                {{ col.value }}
              </div>

              <!-- ============================================== -->
              <!-- AUDIT TAB CELLS -->
              <!-- ============================================== -->
              <div v-else-if="col.name === 'auditResult'">
                <q-badge :color="getAuditColor(col.value).bg" :text-color="getAuditColor(col.value).text" class="q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px; font-size: 11px;">
                  {{ col.value }}
                </q-badge>
              </div>
              <div v-else-if="['lastInspected', 'nextInspection', 'inspector'].includes(col.name)" class="text-grey-8" style="font-size: 13px;">
                {{ col.value }}
              </div>
              <div v-else-if="col.name === 'notes'" class="text-grey-6 ellipsis" style="font-size: 12px; max-width: 100%;">
                {{ col.value }}
              </div>

              <!-- ============================================== -->
              <!-- COMPLIANCE TAB CELLS -->
              <!-- ============================================== -->
              <div v-else-if="['business', 'sanitary', 'fire', 'water'].includes(col.name)" class="column items-center justify-center">
                <q-badge :color="getComplianceColor(col.value.status).bg" :text-color="getComplianceColor(col.value.status).text" class="text-weight-bold" style="border-radius: 6px; padding: 4px 8px; font-size: 10px;">
                  {{ col.value.status }}
                </q-badge>
                <div class="text-grey-5 q-mt-xs text-weight-medium" style="font-size: 10px;">{{ col.value.date }}</div>
              </div>
              <div v-else-if="col.name === 'overall'" class="column items-center justify-center">
                <q-badge :color="getComplianceColor(col.value).bg" :text-color="getComplianceColor(col.value).text" class="text-weight-bold" style="border-radius: 6px; padding: 4px 8px; font-size: 10px;">
                  {{ col.value }}
                </q-badge>
              </div>

              <!-- ============================================== -->
              <!-- ACCREDITATION TAB CELLS -->
              <!-- ============================================== -->
              <div v-else-if="col.name === 'status'">
                <q-badge :color="getAccreditationColor(col.value).bg" :text-color="getAccreditationColor(col.value).text" class="q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px; font-size: 11px;">
                  <Icon :icon="getAccreditationColor(col.value).icon" width="12" height="12" class="q-mr-xs" />
                  {{ col.value }}
                </q-badge>
              </div>
              <div v-else-if="['rooms', 'lastRenewed', 'nextRenewal', 'cycle'].includes(col.name)" class="text-grey-8" style="font-size: 13px;">
                {{ col.value }}
              </div>

              <!-- ============================================== -->
              <!-- PERFORMANCE TAB CELLS -->
              <!-- ============================================== -->
              <div v-else-if="col.name === 'rank'" class="text-grey-6 text-weight-bold" style="font-size: 13px;">
                #{{ col.value }}
              </div>
              <div v-else-if="['grievance', 'inspection', 'renewal'].includes(col.name)" class="row items-center no-wrap" style="width: 100%;">
                <q-linear-progress :value="col.value / 100" :color="getPerformanceColor(col.value)" class="col q-mr-sm" style="border-radius: 4px;" size="6px" />
                <span :class="`text-${getPerformanceColor(col.value)}`" class="text-weight-bold shrink-0" style="font-size: 12px; width: 22px;">{{ col.value }}</span>
              </div>
              <div v-else-if="col.name === 'response'" class="text-grey-8 text-weight-medium" style="font-size: 12px;">
                {{ col.value }}
              </div>
              <div v-else-if="col.name === 'score'" :class="`text-${getPerformanceColor(col.value)}`" class="text-weight-bold text-center" style="font-size: 14px;">
                {{ col.value }}
              </div>
              <div v-else-if="col.name === 'trend'" class="text-center">
                <Icon :icon="getTrend(col.value).icon" :color="getTrend(col.value).color" width="18" height="18" class="text-weight-bold" />
              </div>

            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <!-- Pagination (Locked to bottom) -->
    <div class="q-mt-md shrink-0">
      <TablePagination
        v-model="currentPage"
        :totalItems="filteredProperties.length"
        :rowsPerPage="10"
        itemName="properties"
      />
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import TablePagination from '@/components/common/TablePagination.vue'

const search = ref('')
const activeTab = ref('audit')
const currentPage = ref(1)

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
.folder-tabs {
  background-color: transparent !important;
  position: relative;
  z-index: 2;
  margin-bottom: -1px !important;
}

:deep(.folder-tabs .q-tab) {
  border-radius: 12px 12px 0 0;
  background-color: #e8ecef;
  margin-right: 4px;
  min-height: 48px;
  padding: 0 32px;
  transition: all 0.2s ease;
  color: #5c6a7a;
}

:deep(.folder-tabs .q-tab--active) {
  background-color: #ffffff;
  color: #0f8b7d !important;
  z-index: 10;
  border-bottom: 2px solid #ffffff;
  padding-bottom: 2px;
}

:deep(.folder-tabs .q-tab__indicator) {
  display: none !important;
}

.table-container {
  border-radius: 0 12px 12px 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
  position: relative;
  z-index: 1;
}

.border-bottom {
  border-bottom: 1px solid #f0f0f0;
}

.tracking-wide {
  letter-spacing: 0.3px;
}

.shrink-0 {
  flex-shrink: 0;
}

.custom-table {
  background: transparent;
  height: 100%;
}

.custom-table :deep(table) {
  table-layout: fixed;
  width: 100%;
}

.custom-table :deep(.q-table__container) {
  box-shadow: none !important;
  border: none !important;
  height: 100%;
}

/* Enables internal scrolling on small screens, locks table header */
.custom-table :deep(.q-table__middle) {
  max-height: 100%;
}
.custom-table :deep(thead tr th) {
  position: sticky;
  z-index: 1;
  top: 0;
  background-color: #f5f5f5;
}

.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #fafafa;
}

.table-row td {
  border-bottom: 1px solid #f0f0f0 !important;
}
</style>
