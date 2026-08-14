<template>
  <q-page class="q-pa-md column no-wrap" style="background-color: var(--c-bg); height: calc(100vh - 60px); overflow: hidden;">

    <!-- Top Navigation Row -->
    <div class="row justify-between items-end q-mb-md shrink-0">
      <div>
        <div class="text-h5 text-weight-bold text-dark" style="line-height: 1.2;">Audit Logs</div>
        <div class="text-grey-6 q-mt-xs text-caption tracking-wide">Track system events, user activity, and data modifications</div>
      </div>

      <div class="row q-gutter-x-sm">
        <q-btn
          outline
          color="grey-5"
          text-color="dark"
          no-caps
          class="text-weight-bold bg-surface"
          style="border-radius: 8px; padding: 6px 16px;"
        >
          <Icon icon="mdi:calendar-range" class="on-left" width="16" height="16" />Last 30 Days
        </q-btn>
        <q-btn
          unelevated
          color="teal-7"
          no-caps
          class="text-weight-bold"
          style="border-radius: 8px; padding: 6px 16px;"
        >
          <Icon icon="mdi:download" class="on-left" width="16" height="16" />Export CSV
        </q-btn>
      </div>
    </div>

    <!-- Main Table Card -->
    <q-card flat class="bg-surface table-container col column no-wrap" style="border-radius: 12px; overflow: hidden;">

      <!-- Toolbar -->
      <div class="row items-center justify-between q-pa-md border-bottom shrink-0">
        <div class="row items-center q-gutter-x-sm">
          <SearchInput v-model="searchQuery" placeholder="Search user, action, or target..." style="width: 320px;" />
          <FilterDropdown />
          <div class="text-grey-6 text-weight-medium q-ml-sm" style="font-size: 13px;">
            <q-badge color="grey-2" text-color="grey-7" class="q-px-sm q-py-xs text-weight-bold" style="border-radius: 6px;">
              {{ filteredLogs.length }} events
            </q-badge>
          </div>
        </div>
      </div>

      <!-- Dynamic Data Table -->
      <q-table
        flat
        :rows="paginatedLogs"
        :columns="columns"
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

              <!-- Timestamp Column -->
              <div v-if="col.name === 'timestamp'" class="column">
                <div class="text-weight-bold text-dark" style="font-size: 13px;">{{ props.row.date }}</div>
                <div class="text-grey-5" style="font-size: 11px;">{{ props.row.time }}</div>
              </div>

              <!-- Actor Column -->
              <div v-else-if="col.name === 'actor'" class="row items-center no-wrap">
                <q-avatar size="32px" :color="props.row.actor.color" text-color="white" class="text-weight-bold q-mr-sm shrink-0" style="border-radius: 8px; font-size: 12px;">
                  <Icon v-if="props.row.actor.isSystem" icon="mdi:server" width="16" height="16" />
                  <span v-else>{{ props.row.actor.initials }}</span>
                </q-avatar>
                <div class="column">
                  <div class="text-weight-bold text-dark ellipsis" style="font-size: 13px;">{{ props.row.actor.name }}</div>
                  <div class="text-grey-6 ellipsis" style="font-size: 11px;">{{ props.row.actor.role }}</div>
                </div>
              </div>

              <!-- Action Column -->
              <div v-else-if="col.name === 'action'">
                <q-badge
                  :color="getActionColor(props.row.action).bg"
                  :text-color="getActionColor(props.row.action).text"
                  class="q-px-sm q-py-xs text-weight-bold text-uppercase tracking-wide"
                  style="border-radius: 6px; font-size: 10px;"
                >
                  {{ props.row.action }}
                </q-badge>
              </div>

              <!-- Target Column -->
              <div v-else-if="col.name === 'target'" class="column">
                <div class="text-weight-bold text-dark ellipsis" style="font-size: 13px;">{{ props.row.target.name }}</div>
                <div class="text-grey-6 ellipsis" style="font-size: 11px;">{{ props.row.target.type }} • {{ props.row.target.id }}</div>
              </div>

              <!-- Details Column -->
              <div v-else-if="col.name === 'details'" class="text-dark" style="font-size: 13px; line-height: 1.4;">
                <div v-if="props.row.changes" class="row items-center q-gutter-x-xs no-wrap text-grey-8">
                  <span>{{ props.row.changes.field }}:</span>
                  <span class="text-weight-bold text-strike text-grey-5">{{ props.row.changes.old }}</span>
                  <Icon icon="mdi:arrow-right" width="12" height="12" class="text-teal-6" />
                  <span class="text-weight-bold text-teal-7">{{ props.row.changes.new }}</span>
                </div>
                <div v-else class="text-grey-7 ellipsis">
                  {{ props.row.description }}
                </div>
              </div>

              <!-- IP Address Column -->
              <div v-else-if="col.name === 'ip'" class="text-grey-5 text-weight-medium" style="font-family: monospace; font-size: 12px;">
                {{ col.value }}
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
        :totalItems="filteredLogs.length"
        :rowsPerPage="15"
        itemName="events"
      />
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchInput from '@/components/common/SearchInput.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import TablePagination from '@/components/common/TablePagination.vue'

const searchQuery = ref('')
const currentPage = ref(1)

const columns = [
  { name: 'timestamp', align: 'left', label: 'Timestamp', field: 'date', headerStyle: 'width: 12%' },
  { name: 'actor', align: 'left', label: 'Actor', field: 'actor', headerStyle: 'width: 18%' },
  { name: 'action', align: 'left', label: 'Action', field: 'action', headerStyle: 'width: 12%' },
  { name: 'target', align: 'left', label: 'Target Entity', field: 'target', headerStyle: 'width: 20%' },
  { name: 'details', align: 'left', label: 'Event Details / Changes', field: 'details', headerStyle: 'width: 26%' },
  { name: 'ip', align: 'left', label: 'IP Address', field: 'ip', headerStyle: 'width: 12%' }
]

// Mock Data representing a hyper-realistic admin log
const logs = ref([
  {
    id: 1, date: 'Jun 17, 2026', time: '08:30:12 AM', action: 'UPDATE',
    actor: { name: 'Maria Admin', initials: 'MA', role: 'Super Admin', color: 'teal-7', isSystem: false },
    target: { type: 'Property', name: 'Pinzon Student Hub', id: 'HSE-001' },
    changes: { field: 'Status', old: 'Pending', new: 'Fully Accredited' },
    description: null, ip: '192.168.1.45'
  },
  {
    id: 2, date: 'Jun 17, 2026', time: '08:15:00 AM', action: 'CREATE',
    actor: { name: 'Officer Reyes', initials: 'OR', role: 'Compliance Officer', color: 'indigo-5', isSystem: false },
    target: { type: 'Announcement', name: 'Updated Dormitory Curfew Rules', id: 'ANN-102' },
    changes: null, description: 'Created a new announcement for Students and Landlords.', ip: '192.168.1.88'
  },
  {
    id: 3, date: 'Jun 16, 2026', time: '11:45:22 PM', action: 'SYSTEM',
    actor: { name: 'System Automator', initials: '', role: 'Automated Process', color: 'grey-8', isSystem: true },
    target: { type: 'Ticket', name: 'Water heater repair request', id: 'TKT-0045' },
    changes: { field: 'Priority', old: 'Medium', new: 'High' },
    description: 'SLA threshold breached. Auto-escalated priority.', ip: '127.0.0.1'
  },
  {
    id: 4, date: 'Jun 16, 2026', time: '04:20:10 PM', action: 'AUTH',
    actor: { name: 'Juan Dela Cruz', initials: 'JD', role: 'Landlord', color: 'orange-6', isSystem: false },
    target: { type: 'Session', name: 'User Login', id: 'SES-9982' },
    changes: null, description: 'Successful login via mobile application.', ip: '112.198.45.22'
  },
  {
    id: 5, date: 'Jun 16, 2026', time: '02:10:05 PM', action: 'DELETE',
    actor: { name: 'Maria Admin', initials: 'MA', role: 'Super Admin', color: 'teal-7', isSystem: false },
    target: { type: 'User Account', name: 'Fake Account Test', id: 'USR-9901' },
    changes: null, description: 'Permanently deleted spam registration account.', ip: '192.168.1.45'
  },
  {
    id: 6, date: 'Jun 15, 2026', time: '09:00:00 AM', action: 'UPDATE',
    actor: { name: 'Maria Admin', initials: 'MA', role: 'Super Admin', color: 'teal-7', isSystem: false },
    target: { type: 'Property', name: 'Magsaysay Inn', id: 'HSE-004' },
    changes: { field: 'Verification', old: 'Verified', new: 'Flagged' },
    description: null, ip: '192.168.1.45'
  },
  {
    id: 7, date: 'Jun 14, 2026', time: '01:15:30 PM', action: 'CREATE',
    actor: { name: 'System Automator', initials: '', role: 'Automated Process', color: 'grey-8', isSystem: true },
    target: { type: 'Report', name: 'Weekly Occupancy Digest', id: 'RPT-009' },
    changes: null, description: 'Generated weekly compliance and occupancy report.', ip: '127.0.0.1'
  }
])

const filteredLogs = computed(() => {
  let result = [...logs.value]
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(log =>
      log.actor.name.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.target.name.toLowerCase().includes(query) ||
      log.target.id.toLowerCase().includes(query)
    )
  }
  return result
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * 15
  return filteredLogs.value.slice(start, start + 15)
})

// Smart UI Helpers
function getActionColor(action: string) {
  switch(action) {
    case 'CREATE': return { bg: 'green-1', text: 'green-7' }
    case 'UPDATE': return { bg: 'blue-1', text: 'blue-7' }
    case 'DELETE': return { bg: 'red-1', text: 'red-6' }
    case 'AUTH': return { bg: 'orange-1', text: 'orange-7' }
    case 'SYSTEM': return { bg: 'deep-purple-1', text: 'deep-purple-6' }
    default: return { bg: 'grey-2', text: 'grey-7' }
  }
}
</script>

<style scoped>
.table-container {
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
  border: 1px solid var(--c-border-strong);
}

.border-bottom { border-bottom: 1px solid #f0f0f0; }
.tracking-wide { letter-spacing: 0.5px; }
.shrink-0 { flex-shrink: 0; }

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

.custom-table :deep(.q-table__middle) {
  max-height: 100%;
}

.custom-table :deep(thead tr th) {
  position: sticky;
  z-index: 1;
  top: 0;
  background-color: var(--c-primary-soft);
}

.table-row { transition: background-color 0.2s ease; }
.table-row:hover { background-color: var(--c-surface-2); }
.table-row td { border-bottom: 1px solid #f0f0f0 !important; }
</style>
