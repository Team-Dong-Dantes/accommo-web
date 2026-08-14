<template>
  <q-page class="q-pa-md column no-wrap" style="background-color: var(--c-bg); height: calc(100vh - 60px); overflow: hidden;">

    <!-- Top Navigation Row -->
    <div class="row justify-between items-end q-mb-none shrink-0">

      <!-- Seamless Folder Tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        no-caps
        align="left"
        class="folder-tabs text-dark"
      >
        <q-tab name="announcements" label="Announcements" class="text-weight-bold" />
        <q-tab name="policies" label="Policies & Guidelines" class="text-weight-bold" />
      </q-tabs>

      <!-- Dynamic Create Button -->
      <q-btn
        unelevated
        color="teal-7"
        no-caps
        class="text-weight-bold"
        style="border-radius: 8px; padding: 6px 16px; margin-bottom: 12px;"
      >
        <Icon :icon="activeTab === 'announcements' ? 'mdi:bullhorn' : 'mdi:gavel'" class="on-left" width="18" height="18" />
        {{ activeTab === 'announcements' ? 'New Announcement' : 'New Policy' }}
      </q-btn>
    </div>

    <!-- Main Table Card -->
    <q-card flat class="bg-surface table-container q-mt-none col column no-wrap" style="border-radius: 0 12px 12px 12px; overflow: hidden;">

      <!-- Toolbar -->
      <div class="row items-center justify-between q-pa-md border-bottom shrink-0">
        <div class="row items-center q-gutter-x-sm">
          <SearchInput v-model="searchQuery" :placeholder="searchPlaceholder" style="width: 320px;" />
          <FilterDropdown />
          <div class="text-grey-6 text-weight-medium q-ml-sm" style="font-size: 13px;">
            <q-badge color="grey-2" text-color="grey-7" class="q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px;">
              {{ filteredData.length }} {{ activeTab === 'announcements' ? 'announcements' : 'policies' }}
            </q-badge>
          </div>
        </div>
      </div>

      <!-- Dynamic Data Table -->
      <q-table
        flat
        :rows="paginatedData"
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

              <!-- Title & Description Column -->
              <div v-if="col.name === 'title'" class="column">
                <div class="text-weight-bold text-dark ellipsis" style="font-size: 14px;">{{ props.row.title }}</div>
                <div class="text-grey-6 ellipsis" style="font-size: 12px; margin-top: 2px;">{{ props.row.description }}</div>
              </div>

              <!-- Status Column -->
              <div v-else-if="col.name === 'status'">
                <q-badge
                  :color="getStatusColor(props.row.status).bg"
                  :text-color="getStatusColor(props.row.status).text"
                  class="q-px-sm q-py-xs text-weight-bold"
                  style="border-radius: 6px; font-size: 11px;"
                >
                  <Icon v-if="props.row.status === 'Draft'" icon="mdi:note-edit-outline" width="12" height="12" class="q-mr-xs" />
                  <Icon v-else-if="props.row.status === 'Published' || props.row.status === 'Active'" icon="mdi:check-circle" width="12" height="12" class="q-mr-xs" />
                  <Icon v-else icon="mdi:archive-outline" width="12" height="12" class="q-mr-xs" />
                  {{ props.row.status }}
                </q-badge>
              </div>

              <!-- Audience Tags (Announcements Only) -->
              <div v-else-if="col.name === 'audience'" class="row q-gutter-x-xs">
                <q-badge
                  v-for="target in props.row.audience"
                  :key="target"
                  :color="getAudienceColor(target)"
                  class="text-weight-bold q-px-sm"
                  style="border-radius: 4px; font-size: 10px; padding: 2px 6px;"
                >
                  {{ target }}
                </q-badge>
              </div>

              <!-- Version Tag (Policies Only) -->
              <div v-else-if="col.name === 'version'">
                <q-badge color="grey-2" text-color="dark" class="text-weight-bold q-px-sm" style="border-radius: 6px; font-size: 11px;">
                  {{ props.row.version }}
                </q-badge>
              </div>

              <!-- Generic Text Columns (Author, Date, etc.) -->
              <div v-else-if="['author', 'date', 'updatedAt'].includes(col.name)" class="text-grey-8 text-weight-medium" style="font-size: 13px;">
                {{ col.value }}
              </div>

              <!-- Actions Column -->
              <div v-else-if="col.name === 'actions'" class="row items-center justify-end q-gutter-x-sm no-wrap">
                <q-btn flat dense color="grey-6" size="sm" class="custom-radius">
                  <Icon icon="mdi:eye" width="18" height="18" />
                  <q-tooltip>View</q-tooltip>
                </q-btn>
                <q-btn flat dense color="teal-7" size="sm" class="custom-radius">
                  <Icon icon="mdi:pencil" width="18" height="18" />
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn flat dense color="red-5" size="sm" class="custom-radius">
                  <Icon icon="mdi:delete" width="18" height="18" />
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </div>

            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <!-- Pagination -->
    <div class="q-mt-md shrink-0">
      <TablePagination
        v-model="currentPage"
        :totalItems="filteredData.length"
        :rowsPerPage="10"
        :itemName="activeTab === 'announcements' ? 'announcements' : 'policies'"
      />
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import TablePagination from '@/components/common/TablePagination.vue'

const activeTab = ref('announcements')
const searchQuery = ref('')
const currentPage = ref(1)

const searchPlaceholder = computed(() => {
  return activeTab.value === 'announcements'
    ? 'Search announcements...'
    : 'Search policies & guidelines...'
})

// Column Definitions
const announcementColumns = [
  { name: 'title', align: 'left', label: 'Announcement Title', field: 'title', headerStyle: 'width: 35%' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerStyle: 'width: 12%' },
  { name: 'audience', align: 'left', label: 'Target Audience', field: 'audience', headerStyle: 'width: 20%' },
  { name: 'author', align: 'left', label: 'Author', field: 'author', headerStyle: 'width: 13%' },
  { name: 'date', align: 'left', label: 'Publish Date', field: 'date', headerStyle: 'width: 12%' },
  { name: 'actions', align: 'right', label: '', field: 'actions', headerStyle: 'width: 8%' }
]

const policyColumns = [
  { name: 'title', align: 'left', label: 'Policy Name', field: 'title', headerStyle: 'width: 40%' },
  { name: 'version', align: 'left', label: 'Version', field: 'version', headerStyle: 'width: 10%' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerStyle: 'width: 12%' },
  { name: 'updatedAt', align: 'left', label: 'Last Updated', field: 'updatedAt', headerStyle: 'width: 15%' },
  { name: 'author', align: 'left', label: 'Modified By', field: 'author', headerStyle: 'width: 15%' },
  { name: 'actions', align: 'right', label: '', field: 'actions', headerStyle: 'width: 8%' }
]

const currentColumns = computed(() => {
  return activeTab.value === 'announcements' ? announcementColumns : policyColumns
})

// Mock Data
const announcements = ref([
  { id: 1, title: 'OSAS System Maintenance', description: 'The portal will be down for 2 hours this weekend.', status: 'Draft', audience: ['All Users'], author: 'System Admin', date: '—' },
  { id: 2, title: 'Updated Dormitory Curfew Rules', description: 'Reminder regarding the standard 10:00 PM curfew across all university-accredited housing.', status: 'Published', audience: ['Students', 'Landlords'], author: 'Maria Admin', date: 'Jun 15, 2026' },
  { id: 3, title: 'Welcome to the New Accommo Portal', description: 'Explore the new features including instant grievance reporting and digital permits.', status: 'Published', audience: ['Students'], author: 'Officer Reyes', date: 'Jun 1, 2026' },
  { id: 4, title: 'Fire Safety Inspection Schedule', description: 'Annual fire safety checks for the Northern District boarding houses.', status: 'Archived', audience: ['Landlords'], author: 'Officer Reyes', date: 'Jan 10, 2026' }
])

const policies = ref([
  { id: 101, title: 'Boarding House Safety & Security Standards', description: 'Mandatory requirements including fire extinguishers, CCTV, and emergency exits.', version: 'v2.1', status: 'Active', updatedAt: 'Jan 15, 2026', author: 'Maria Admin' },
  { id: 102, title: 'Student Grievance & Escalation Protocol', description: 'Standard operating procedure for handling student complaints against landlords.', version: 'v1.0', status: 'Active', updatedAt: 'Mar 10, 2026', author: 'Officer Reyes' },
  { id: 103, title: 'Landlord Accreditation Requirements', description: 'Required permits (Business, Sanitary, Fire) for maintaining OSAS accreditation.', version: 'v3.0', status: 'Draft', updatedAt: 'May 20, 2026', author: 'System Admin' },
  { id: 104, title: 'Anti-Discrimination Policy', description: 'Zero-tolerance policy for housing discrimination based on gender, religion, or course.', version: 'v1.2', status: 'Active', updatedAt: 'Dec 05, 2025', author: 'Maria Admin' }
])

// Computed Logic
const currentDataArray = computed(() => {
  return activeTab.value === 'announcements' ? announcements.value : policies.value
})

const filteredData = computed(() => {
  let result = [...currentDataArray.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
  }
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredData.value.slice(start, start + 10)
})

// Reset pagination and search on tab switch
watch(activeTab, () => {
  searchQuery.value = ''
  currentPage.value = 1
})

// Helpers
function getStatusColor(status: string) {
  if (status === 'Published' || status === 'Active') return { bg: 'green-1', text: 'green-7' }
  if (status === 'Draft') return { bg: 'orange-1', text: 'orange-7' }
  return { bg: 'grey-2', text: 'grey-7' } // Archived
}

function getAudienceColor(audience: string) {
  if (audience === 'All Users') return 'dark'
  if (audience === 'Students') return 'blue-6'
  if (audience === 'Landlords') return 'purple-5'
  return 'grey-6'
}
</script>

<style scoped>
/* Seamless Folder Clip Tabs */
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

/* Master Table Card */
.table-container {
  border-radius: 0 12px 12px 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
  position: relative;
  z-index: 1;
  border: 1px solid var(--c-border-strong);
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

.custom-radius {
  border-radius: 8px !important;
}

/* Table Enhancements */
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
  background-color: var(--c-primary-soft);
}

.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: var(--c-surface-2);
}

.table-row td {
  border-bottom: 1px solid #f0f0f0 !important;
}
</style>
