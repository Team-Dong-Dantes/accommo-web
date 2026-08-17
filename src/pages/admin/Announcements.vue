<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <!-- Top bar -->
    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <q-btn
        unelevated
        color="primary"
        no-caps
        class="text-weight-bold rounded-button q-mb-md"
      >
        <Icon :icon="activeTab === 'announcements' ? 'mdi:bullhorn' : 'mdi:gavel'" class="on-left" width="18" height="18" />
        {{ activeTab === 'announcements' ? 'New Announcement' : 'New Policy' }}
      </q-btn>
    </div>

    <TableCard
      v-model:search="searchQuery"
      v-model:page="currentPage"
      :filters="[]"
      :active-filters="{ }"
      :search-placeholder="searchPlaceholder"
      :total-label="`${filteredData.length} ${activeTab === 'announcements' ? 'announcements' : 'policies'}`"
      :total-items="filteredData.length"
      :item-name="activeTab === 'announcements' ? 'announcements' : 'policies'"
      @refresh="simulateLoad"
    >
      <template #panels>
        <q-tab-panels v-model="activeTab" animated style="background: transparent; height: 100%;">
          <!-- Announcements tab -->
          <q-tab-panel name="announcements" class="q-pa-none">
            <DataTable :rows="paginatedData" :columns="announcementColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="mdi:bullhorn-outline" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">Nothing here yet</div>
                  <div>No announcements found.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props">
                  <q-td key="title" :props="props">
                    <div class="column">
                      <div class="text-weight-bold text-ink ellipsis" style="font-size: 14px;">{{ props.row.title }}</div>
                      <div class="text-muted ellipsis" style="font-size: 12px; margin-top: 2px;">{{ props.row.description }}</div>
                    </div>
                  </q-td>
                  <q-td key="status" :props="props">
                    <BadgePill :bg="getStatusColor(props.row.status).bg" :text-color="getStatusColor(props.row.status).text" :icon="getStatusIcon(props.row.status)" :label="props.row.status" />
                  </q-td>
                  <q-td key="audience" :props="props" class="row items-center q-gutter-x-xs">
                    <BadgePill v-for="target in props.row.audience" :key="target" :bg="getAudienceColor(target).bg" :text-color="getAudienceColor(target).text" :label="target" />
                  </q-td>
                  <q-td key="author" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.author }}</q-td>
                  <q-td key="date" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.date }}</q-td>
                  <q-td key="actions" :props="props" class="row items-center justify-end q-gutter-x-sm no-wrap">
                    <q-btn flat dense color="grey-6" size="sm" class="custom-radius"><Icon icon="mdi:eye" width="18" height="18" /><q-tooltip>View</q-tooltip></q-btn>
                    <q-btn flat dense color="teal-7" size="sm" class="custom-radius"><Icon icon="mdi:pencil" width="18" height="18" /><q-tooltip>Edit</q-tooltip></q-btn>
                    <q-btn flat dense color="red-5" size="sm" class="custom-radius"><Icon icon="mdi:delete" width="18" height="18" /><q-tooltip>Delete</q-tooltip></q-btn>
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- Policies tab -->
          <q-tab-panel name="policies" class="q-pa-none">
            <DataTable :rows="paginatedData" :columns="policyColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="mdi:gavel" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">Nothing here yet</div>
                  <div>No policies found.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props">
                  <q-td key="title" :props="props">
                    <div class="column">
                      <div class="text-weight-bold text-ink ellipsis" style="font-size: 14px;">{{ props.row.title }}</div>
                      <div class="text-muted ellipsis" style="font-size: 12px; margin-top: 2px;">{{ props.row.description }}</div>
                    </div>
                  </q-td>
                  <q-td key="version" :props="props">
                    <q-badge color="grey-2" text-color="dark" class="text-weight-bold q-px-sm" style="border-radius: 6px; font-size: 11px;">{{ props.row.version }}</q-badge>
                  </q-td>
                  <q-td key="status" :props="props">
                    <BadgePill :bg="getStatusColor(props.row.status).bg" :text-color="getStatusColor(props.row.status).text" :icon="getStatusIcon(props.row.status)" :label="props.row.status" />
                  </q-td>
                  <q-td key="updatedAt" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.updatedAt }}</q-td>
                  <q-td key="author" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.author }}</q-td>
                  <q-td key="actions" :props="props" class="row items-center justify-end q-gutter-x-sm no-wrap">
                    <q-btn flat dense color="grey-6" size="sm" class="custom-radius"><Icon icon="mdi:eye" width="18" height="18" /><q-tooltip>View</q-tooltip></q-btn>
                    <q-btn flat dense color="teal-7" size="sm" class="custom-radius"><Icon icon="mdi:pencil" width="18" height="18" /><q-tooltip>Edit</q-tooltip></q-btn>
                    <q-btn flat dense color="red-5" size="sm" class="custom-radius"><Icon icon="mdi:delete" width="18" height="18" /><q-tooltip>Delete</q-tooltip></q-btn>
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
import { ref, computed, watch, onMounted } from 'vue'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import DataTable from '@/components/table/DataTable.vue'
import BadgePill from '@/components/user/BadgePill.vue'

const activeTab = ref('announcements')
const searchQuery = ref('')
const currentPage = ref(1)
const loading = ref(true)

const tabs = [
  { name: 'announcements', label: 'Announcements' },
  { name: 'policies', label: 'Policies & Guidelines' },
]

function simulateLoad() {
  loading.value = true
  setTimeout(() => { loading.value = false }, 400)
}

onMounted(simulateLoad)

const searchPlaceholder = computed(() => {
  return activeTab.value === 'announcements' ? 'Search announcements...' : 'Search policies & guidelines...'
})

const announcementColumns = [
  { name: 'title', required: true, align: 'left', label: 'Announcement Title', field: 'title', headerStyle: 'width: 35%' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerStyle: 'width: 12%' },
  { name: 'audience', align: 'left', label: 'Target Audience', field: 'audience', headerStyle: 'width: 20%' },
  { name: 'author', align: 'left', label: 'Author', field: 'author', headerStyle: 'width: 13%' },
  { name: 'date', align: 'left', label: 'Publish Date', field: 'date', headerStyle: 'width: 12%' },
  { name: 'actions', align: 'right', label: '', field: 'actions', headerStyle: 'width: 8%' }
]

const policyColumns = [
  { name: 'title', required: true, align: 'left', label: 'Policy Name', field: 'title', headerStyle: 'width: 40%' },
  { name: 'version', align: 'left', label: 'Version', field: 'version', headerStyle: 'width: 10%' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerStyle: 'width: 12%' },
  { name: 'updatedAt', align: 'left', label: 'Last Updated', field: 'updatedAt', headerStyle: 'width: 15%' },
  { name: 'author', align: 'left', label: 'Modified By', field: 'author', headerStyle: 'width: 15%' },
  { name: 'actions', align: 'right', label: '', field: 'actions', headerStyle: 'width: 8%' }
]

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

watch(activeTab, () => {
  searchQuery.value = ''
  currentPage.value = 1
})

function getStatusColor(status: string) {
  if (status === 'Published' || status === 'Active') return { bg: 'green-1', text: 'green-7' }
  if (status === 'Draft') return { bg: 'orange-1', text: 'orange-7' }
  return { bg: 'grey-2', text: 'grey-7' }
}

function getStatusIcon(status: string) {
  if (status === 'Draft') return 'mdi:note-edit-outline'
  if (status === 'Published' || status === 'Active') return 'mdi:check-circle'
  return 'mdi:archive-outline'
}

function getAudienceColor(audience: string) {
  if (audience === 'All Users') return { bg: 'blue-grey-1', text: 'blue-grey-6' }
  if (audience === 'Students') return { bg: 'blue-1', text: 'blue-6' }
  if (audience === 'Landlords') return { bg: 'teal-1', text: 'teal-6' }
  return { bg: 'grey-2', text: 'grey-7' }
}
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}
.custom-radius {
  border-radius: 8px !important;
}
</style>
