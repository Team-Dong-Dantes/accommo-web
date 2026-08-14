<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-center non-shrink q-mb-md">
      <div>
        <p class="page-sub text-muted">Students and landlords across the platform.</p>
      </div>
      <ExportButton @click="handleExport" />
    </div>

    <div class="table-wrapper">
      <q-card flat class="table-container">
        <div class="row items-center justify-between q-pa-md table-bar">
          <div class="row items-center q-gutter-x-sm">
            <SearchInput v-model="search" placeholder="Search by name, email, or ID..." style="width: 300px;" />
            <FilterDropdown
              :filters="filterConfig"
              :activeFilters="activeFilters"
              @update:activeFilters="activeFilters = $event"
              @clear="clearFilters"
            />
          </div>

          <div class="row items-center q-gutter-x-md">
            <q-btn flat dense color="grey-6" class="refresh-btn" @click="fetchUsers" :loading="loading">
              <Icon icon="mdi:refresh" width="18" height="18" />
              <q-tooltip>Refresh</q-tooltip>
            </q-btn>
            <q-badge color="grey-2" text-color="grey-7" class="q-px-sm q-py-xs text-weight-bold total-badge">
              {{ filteredRows.length }} total {{ filteredRows.length === 1 ? 'user' : 'users' }}
            </q-badge>
          </div>
        </div>

        <DataTable :rows="paginatedRows" :columns="columns" rowKey="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
          <template #no-data>
            <div class="full-width row flex-center text-muted q-pa-xl column">
              <Icon icon="mdi:account-group-off-outline" width="48" height="48" class="q-mb-md" />
              <div class="text-h6 text-weight-bold">No users found</div>
              <div>There are currently no registered users matching your criteria.</div>
            </div>
          </template>

          <template #body="{ props }">
            <q-tr :props="props">
              <q-td key="user" :props="props">
                <div class="row items-center no-wrap">
                  <q-avatar size="38px" :color="props.row.avatarColor" text-color="white" class="text-weight-bold q-mr-md" style="font-size: 14px">
                    {{ props.row.initials }}
                  </q-avatar>
                  <div class="column">
                    <div class="text-weight-bold text-ink" style="font-size: 14px; line-height: 1.2">{{ props.row.name }}</div>
                    <div class="text-muted" style="font-size: 12px">{{ props.row.email }}</div>
                  </div>
                </div>
              </q-td>
              <q-td key="id" :props="props" class="text-muted text-weight-medium" style="font-family: var(--font-mono)">{{ props.row.id }}</q-td>
              <q-td key="contact" :props="props" class="text-ink">{{ props.row.contact }}</q-td>
              <q-td key="role" :props="props">
                <BadgePill :bg="props.row.roleStyle.bg" :text-color="props.row.roleStyle.text" :icon="props.row.roleStyle.icon" :label="props.row.role" />
              </q-td>
              <q-td key="status" :props="props">
                <BadgePill :bg="props.row.statusStyle.bg" :text-color="props.row.statusStyle.text" :icon="props.row.statusStyle.icon" :label="props.row.status" />
              </q-td>
              <q-td key="joined" :props="props" class="text-muted">{{ props.row.joined }}</q-td>
              <q-td key="details" :props="props" class="text-muted ellipsis" style="max-width: 200px">{{ props.row.details }}</q-td>
            </q-tr>
          </template>
        </DataTable>
      </q-card>
    </div>

    <div class="non-shrink q-mt-md">
      <TablePagination
        v-model="currentPage"
        :totalItems="filteredRows.length"
        :rowsPerPage="10"
        itemName="users"
      />
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

import SearchInput from '@/components/common/SearchInput.vue'
import FilterDropdown from '@/components/common/FilterDropdown.vue'
import ExportButton from '@/components/common/ExportButton.vue'
import DataTable from '@/components/common/DataTable.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import BadgePill from '@/components/common/BadgePill.vue'

const loading = ref(false)
const rawUsers = ref<any[]>([])
const search = ref('')
const currentPage = ref(1)
const activeFilters = ref({ role: [] as string[], status: [] as string[] })

const filterConfig = [
  { label: 'Role', key: 'role', options: [ { label: 'Student', value: 'Student' }, { label: 'Landlord', value: 'Landlord' } ] },
  { label: 'Status', key: 'status', options: [ { label: 'Active', value: 'Active' }, { label: 'Pending', value: 'Pending' }, { label: 'Reviewing', value: 'Reviewing' }, { label: 'Suspended', value: 'Suspended' } ] }
]

const columns = [
  { name: 'user', required: true, label: 'USER', align: 'left', field: 'name' },
  { name: 'id', label: 'USER ID', align: 'left', field: 'id' },
  { name: 'contact', label: 'CONTACT', align: 'left', field: 'contact' },
  { name: 'role', label: 'ROLE', align: 'left', field: 'role' },
  { name: 'status', label: 'STATUS', align: 'left', field: 'status' },
  { name: 'joined', label: 'JOINED', align: 'left', field: 'joined' },
  { name: 'details', label: 'DETAILS', align: 'left', field: 'details' }
]

function clearFilters() {
  activeFilters.value = { role: [], status: [] }
}

function handleExport() {
  console.log('Export triggered for', filteredRows.value.length, 'users')
}

async function fetchUsers() {
  loading.value = true

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase Query Error:', error.message)
    } else if (data) {
      rawUsers.value = data.map(mapUserData)
    }
  } catch (err) {
    console.error('Unexpected error fetching users:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

function mapUserData(user: any) {
  const displayName = user.full_name || 'Unknown User'
  const contact = user.phone || 'No phone provided'

  let joinedDate = 'Unknown'
  if (user.created_at) {
    const dateObj = new Date(user.created_at)
    if (!isNaN(dateObj.getTime())) {
      joinedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const nameParts = displayName.split(' ')
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : `${nameParts[0][0]}`.toUpperCase()

  const isStudent = (user.role || '').toLowerCase() === 'student'
  const roleStyle = isStudent
    ? { bg: 'blue-1', text: 'blue-6', icon: 'mdi:school' }
    : { bg: 'teal-1', text: 'teal-6', icon: 'mdi:domain' }
  const avatarColor = isStudent ? 'indigo-5' : 'teal-7'

  let statusStyle = { bg: 'grey-2', text: 'grey-7', icon: 'mdi:help-circle-outline' }
  const status = user.status || 'Pending'

  if (status === 'Active') statusStyle = { bg: 'green-1', text: 'green-6', icon: 'mdi:check-circle' }
  else if (status === 'Pending') statusStyle = { bg: 'orange-1', text: 'orange-6', icon: 'mdi:clock-outline' }
  else if (status === 'Reviewing') statusStyle = { bg: 'indigo-1', text: 'indigo-5', icon: 'mdi:eye' }
  else if (status === 'Suspended') statusStyle = { bg: 'red-1', text: 'red-5', icon: 'mdi:cancel' }

  return {
    id: user.id.length > 10 ? `USR-${user.id.substring(0, 4).toUpperCase()}` : user.id,
    rawId: user.id,
    name: displayName,
    email: user.email,
    contact,
    role: user.role || 'Unknown',
    roleStyle,
    status,
    statusStyle,
    joined: joinedDate,
    details: `${user.role} Account`,
    initials,
    avatarColor
  }
}

const filteredRows = computed(() => {
  let result = rawUsers.value

  filterConfig.forEach(group => {
    const activeVals = activeFilters.value[group.key as keyof typeof activeFilters.value]
    if (activeVals && activeVals.length > 0) {
      result = result.filter(r => activeVals.includes(r[group.key as keyof typeof r]))
    }
  })

  if (search.value) {
    const needle = search.value.toLowerCase()
    result = result.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(needle)))
  }

  return result
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredRows.value.slice(start, start + 10)
})

watch([search, activeFilters], () => { currentPage.value = 1 }, { deep: true })
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

.page-sub {
  font-size: var(--fs-sm);
  margin: 2px 0 0;
}

.table-container {
  background: var(--c-surface);
  border-radius: var(--card-radius);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.table-bar { border-bottom: 1px solid var(--c-border); }
.refresh-btn { border-radius: 8px; }
.total-badge { border-radius: 6px; }

.non-shrink {
  flex-shrink: 0;
}

.table-wrapper {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}
</style>
