<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <ExportButton class="q-mb-md" @click="handleExport" />
    </div>

    <div class="users-body">
    <TableCard
      v-model:search="search"
      :search-placeholder="'Search by name, email, or student ID…'"
      v-model:active-filters="activeFilters"
        v-model:page="currentPage"
        :filters="filterConfig"
        :loading="loading"
        :total-label="`${filteredRows.length} total ${filteredRows.length === 1 ? 'user' : 'users'}`"
        :rows="paginatedRows"
        :columns="columns"
        row-key="rawId"
        :total-items="filteredRows.length"
        item-name="users"
        @clear-filters="clearFilters"
        @refresh="fetchUsers"
      >
      <template #empty>
        <div class="full-width row flex-center text-muted q-pa-xl column">
          <Icon :icon="fetchError ? 'mdi:alert-circle-outline' : 'mdi:account-group-off-outline'" width="48" height="48" class="q-mb-md" />
          <div class="text-h6 text-weight-bold">{{ fetchError ? 'Could not load users' : 'No users found' }}</div>
          <div v-if="fetchError" class="text-caption q-mt-xs" style="color: var(--c-danger)">{{ fetchError }}</div>
          <div v-else>There are currently no registered users matching your criteria.</div>
        </div>
      </template>

      <template #body="{ props }">
        <q-tr :props="props" :key="props.row.rawId" class="cursor-pointer smart-row" @click.stop="openUser(props.row)">
            <q-td key="user" :props="props">
              <UserInfoCell
                :initials="props.row.initials"
                :name="props.row.name"
                :email="props.row.email"
                :avatar-color="props.row.avatarColor"
              />
            </q-td>
          <q-td key="id" :props="props" class="text-muted text-weight-medium" style="font-family: var(--font-mono)">{{ props.row.id }}</q-td>
          <q-td key="contact" :props="props" class="text-ink">{{ props.row.contact }}</q-td>
          <q-td key="role" :props="props">
            <BadgePill :tone="props.row.roleStyle.tone" :icon="props.row.roleStyle.icon" :label="cap(props.row.role)" />
          </q-td>
          <q-td key="status" :props="props">
            <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.status" />
          </q-td>
          <q-td key="joined" :props="props" class="text-muted">{{ props.row.joined }}</q-td>
        </q-tr>
      </template>
    </TableCard>

    <DetailDrawer
      v-model="drawerOpen"
      expandable
      v-model:expanded="drawerExpanded"
      anchored
      position="right"
      close-on-backdrop
      :preview="userPreview"
      :loading="detailLoading"
      :management-actions="userManagementActions"
      @manage="onManageUser"
    />

    </div><!-- /users-body -->

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'

import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import ExportButton from '@/components/ui/ExportButton.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import { getStatus, getTone, type StatusTone } from '@/utils/status.config'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import { buildUserPreview, cap, composeAddress, fmtDate, periodLabel } from '@/features/users/userPreview'
import type { DrawerPreview } from '@/components/ui/DetailDrawer.vue'

const loading = ref(true)
const fetchError = ref('')
const rawUsers = ref<any[]>([])
const search = ref('')
const currentPage = ref(1)
const activeTab = ref('users')
const activeFilters = ref({ role: [] as string[], status: [] as string[] })
const route = useRoute()

const drawerOpen = ref(false)
const drawerExpanded = ref(false)
const selectedUser = ref<any | null>(null)
const userDetail = ref<any | null>(null)
const userReviews = ref<any[]>([])
const detailLoading = ref(false)

const sectionTab = ref<string>('overview')
const housing = ref<any | null>(null)
const boardingHistory = ref<any[]>([])
const accommodationRows = ref<any[]>([])

const tabs = [
  { name: 'users', label: 'Users' },
]

const filterConfig = [
  { label: 'Role', key: 'role', options: [ { label: 'Student', value: 'Student' }, { label: 'Accommodation Manager', value: 'Accommodation Manager' } ] },
  { label: 'Status', key: 'status', options: [ { label: 'Verified', value: 'Verified' }, { label: 'Pending', value: 'Pending' }, { label: 'Reviewing', value: 'Reviewing' }, { label: 'Rejected', value: 'Rejected' }, { label: 'Suspended', value: 'Suspended' }, { label: 'Unverified', value: 'Unverified' } ] }
]

const columns = [
  { name: 'user', required: true, label: 'USER', align: 'left', field: 'name' },
  { name: 'id', label: 'USER ID', align: 'left', field: 'id' },
  { name: 'contact', label: 'CONTACT', align: 'left', field: 'contact' },
  { name: 'role', label: 'ROLE', align: 'left', field: 'role' },
  { name: 'status', label: 'STATUS', align: 'left', field: 'status' },
  { name: 'joined', label: 'JOINED', align: 'left', field: 'joined' },
]

function clearFilters() {
  activeFilters.value = { role: [], status: [] }
}

function handleExport() {
  const rows = filteredRows.value
  const headers = ['Name', 'User ID', 'Email', 'Contact', 'Role', 'Status', 'Joined']
  const escapeCsv = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(
      [r.name, r.id, r.email, r.contact, cap(r.role), r.status, r.joined]
        .map(escapeCsv)
        .join(',')
    )
  }
  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function fetchUsers() {
  loading.value = true
  fetchError.value = ''

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      fetchError.value = error.message
      console.error('Supabase Query Error:', error.message)
    } else if (data) {
      const ids = data.map((u: any) => u.id)
      let sidMap: Record<string, string> = {}
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('student_profiles')
          .select('user_id, student_id')
          .in('user_id', ids)
        ;(profiles || []).forEach((p: any) => {
          if (p.user_id) sidMap[p.user_id] = p.student_id || ''
        })
      }
      rawUsers.value = data.map((u: any) => mapUserData(u, sidMap[u.id] || ''))
    }
  } catch (err) {
    fetchError.value = err instanceof Error ? err.message : String(err)
    console.error('Unexpected error fetching users:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchUsers()
  openUserFromRoute()
})

function openUserFromRoute() {
  const userId = route.query.user
  if (typeof userId !== 'string') return
  const row = rawUsers.value.find((user) => user.rawId === userId)
  if (row && selectedUser.value?.rawId !== userId) void openUser(row)
}

watch(() => route.query.user, openUserFromRoute)

async function openUser(row: any) {
  selectedUser.value = row
  userDetail.value = null
  housing.value = null
  boardingHistory.value = []
  accommodationRows.value = []
  userReviews.value = []
  sectionTab.value = 'overview'
  drawerExpanded.value = false
  drawerOpen.value = true
  await fetchDetail(row.rawId, row.role)
}

async function fetchDetail(userId: string, role: string) {
  detailLoading.value = true
  try {
    const normalized = (role || '').toLowerCase()
    let detail: any = null

    if (normalized === 'student') {
      const { data } = await supabase
        .from('student_profiles')
        .select('college, program, year_level, student_id, osas_verified_at, emergency_contact_json, school_id_url, assessment_of_fees_url')
        .eq('user_id', userId)
        .maybeSingle()
      detail = data

      // Active placement
      const { data: lease } = await supabase
        .from('leases')
        .select('start_date, status, accommodation_manager:accommodation_manager_id(full_name), room:room_id(accommodation:accommodation_id(id, name, room_type, address, barangay, city))')
        .eq('student_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      housing.value = lease
        ? {
            placed: true,
            accommodationId: lease.room?.accommodation?.id,
            accommodationName: lease.room?.accommodation?.name || '—',
            roomType: cap(lease.room?.accommodation?.room_type),
            accommodationManagerName: lease.accommodation_manager?.full_name || '—',
            address: composeAddress(lease.room?.accommodation),
            moveIn: lease.start_date,
          }
        : { placed: false }

      // Boarding history
      const { data: hist } = await supabase
        .from('boarding_history')
        .select('id, accommodation_name, room_type, period_start, period_end, accommodation:accommodations(id, name, address, barangay, city)')
        .eq('student_id', userId)
        .order('period_start', { ascending: false })
      boardingHistory.value = (hist || []).map((h: any) => ({
        id: h.id,
        accommodationId: h.accommodation?.id,
        accommodationName: h.accommodation_name || h.accommodation?.name || '—',
        roomType: cap(h.room_type),
        address: composeAddress(h.accommodation),
        period: periodLabel(h.period_start, h.period_end),
      }))
    } else if (normalized === 'accommodation_manager') {
      const { data } = await supabase
        .from('accommodation_manager_profiles')
        .select('response_rate, avg_response_minutes, government_id_url')
        .eq('user_id', userId)
        .maybeSingle()
      detail = data

      // Listed accommodations
      const { data: props } = await supabase
        .from('accommodations')
        .select('id, name, status, room_type, total_rooms, address, barangay, city, rating_avg, reviews_count')
        .eq('accommodation_manager_id', userId)
        .order('name', { ascending: true })
      accommodationRows.value = props || []
    }

    // Reviews — accommodation manager = reviews received; student = tenant reviews received.
    if (normalized === 'accommodation_manager') {
      const res = (await supabase
        .from('accommodation_manager_reviews')
        .select('rating, comment, created_at, student_id(full_name)')
        .eq('accommodation_manager_id', userId)
        .order('created_at', { ascending: false })) as any
      const revs = (res?.data || []) as any[]
      userReviews.value = revs.map((r: any) => ({
        author_name: r.student_id?.full_name || 'Anonymous',
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
      }))
    } else if (normalized === 'student') {
      const res = (await supabase
        .from('tenant_reviews')
        .select('rating, comment, created_at, accommodation_manager_id(full_name)')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })) as any
      const revs = (res?.data || []) as any[]
      userReviews.value = revs.map((r: any) => ({
        author_name: r.accommodation_manager_id?.full_name || 'Anonymous',
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
      }))
    } else {
      userReviews.value = []
    }

    userDetail.value = detail
  } catch (err) {
    console.error('Failed to load user detail:', err)
    userDetail.value = null
  } finally {
    detailLoading.value = false
  }
}

function mapUserData(user: any, studentId = '') {
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
  const roleStyle = {
    tone: (isStudent ? 'neutral' : 'primary') as StatusTone,
    icon: isStudent ? 'mdi:school' : 'mdi:domain'
  }
  const avatarColor = isStudent ? 'indigo-5' : 'teal-7'

  const status = (user.status || 'unverified').toLowerCase()
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
  const statusStyle = {
    tone: getTone(status),
    icon: getStatus(status).icon || 'mdi:help-circle-outline'
  }

  return {
    id: user.id.length > 10 ? `USR-${user.id.substring(0, 4).toUpperCase()}` : user.id,
    rawId: user.id,
    name: displayName,
    email: user.email,
    contact,
    role: user.role || 'Unknown',
    roleStyle,
    status: statusLabel,
    statusStyle,
    joined: joinedDate,
    initials,
    avatarColor,
    studentId
  }
}

const filteredRows = computed(() => {
  let result = rawUsers.value

  filterConfig.forEach(group => {
    const activeVals = activeFilters.value[group.key as keyof typeof activeFilters.value]
    if (activeVals && activeVals.length > 0) {
      result = result.filter(r =>
        activeVals.some(v => String(v).toLowerCase() === String(r[group.key as keyof typeof r] ?? '').toLowerCase())
      )
    }
  })

  if (search.value) {
    const needle = search.value.toLowerCase()
    result = result.filter(row =>
      [row.name, row.email, row.studentId].some(val => String(val).toLowerCase().includes(needle))
    )
  }

  return result
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredRows.value.slice(start, start + 10)
})

watch([search, activeFilters], () => { currentPage.value = 1 }, { deep: true })

// Drawer preview — construction lives in features/users/userPreview.ts.
const userPreview = computed<DrawerPreview>(() =>
  buildUserPreview({
    selectedUser: selectedUser.value,
    userDetail: userDetail.value,
    housing: housing.value,
    boardingHistory: boardingHistory.value,
    accommodationRows: accommodationRows.value,
    userReviews: userReviews.value,
  })
)

type ManagementAction = { label: string; action: string; danger?: boolean }

const userManagementActions = computed<ManagementAction[]>(() => {
  const u = selectedUser.value
  if (!u) return []
  const status = (u.status || '').toLowerCase()
  const actions: ManagementAction[] = []

  if (status === 'suspended') {
    actions.push({ label: 'Reactivate Account', action: 'reactivate' })
  } else {
    actions.push({ label: 'Suspend Account', action: 'suspend', danger: true })
  }

  if (status === 'banned') {
    actions.push({ label: 'Unban Account', action: 'unban' })
  } else {
    actions.push({ label: 'Ban Account', action: 'ban', danger: true })
  }

  if (['pending', 'reviewing', 'unverified'].includes(status)) {
    actions.push({ label: 'Mark as Verified', action: 'verify' })
  }

  return actions
})

const STATUS_FOR_ACTION: Record<string, string> = {
  suspend: 'Suspended',
  reactivate: 'Verified',
  ban: 'Banned',
  unban: 'Verified',
  verify: 'Verified',
}

async function onManageUser(action: string) {
  const u = selectedUser.value
  if (!u || !u.rawId) return

  const newStatus = STATUS_FOR_ACTION[action]
  if (!newStatus) return

  try {
    const { error } = await supabase
      .from('users')
      .update({ status: newStatus as any })
      .eq('id', u.rawId)
    if (error) throw error

    const lower = newStatus.toLowerCase()
    const style = {
      tone: getTone(lower),
      icon: getStatus(lower).icon || 'mdi:help-circle-outline',
    }
    const label = newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
    u.status = label
    u.statusStyle = style

    const row = rawUsers.value.find(r => r.rawId === u.rawId)
    if (row) {
      row.status = label
      row.statusStyle = style
    }
  } catch (err) {
    console.error('Failed to update user status:', err)
  }
}

</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

/* Holds the table + the right-docked detail drawer together so the drawer
   anchors flush to the table's right edge (no margin, inside the card area). */
.users-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Pills (used inside InfoRow value slots) */
.usr-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.usr-pill--ok {
  background: var(--c-success-soft);
  color: var(--c-success);
}
.usr-pill--muted {
  background: var(--c-surface-2);
  color: var(--c-muted);
  border: 1px solid var(--c-border);
}

/* Link button (used inside InfoRow value slots) */
.usr-link {
  border: none;
  background: transparent;
  color: var(--c-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.usr-link:hover {
  text-decoration: underline;
}

/* Section transition */
.usr-fade-enter-active,
.usr-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.usr-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.usr-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Skeleton blocks (loading states) */
.usr-skel-block {
  padding: 8px 0;
}
</style>
