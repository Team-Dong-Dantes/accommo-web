<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <ExportButton class="q-mb-md" @click="handleExport" />
    </div>

    <div class="users-body">
      <TableCard
        v-model:search="search"
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
        <q-tr :props="props" :key="props.row.rawId" class="cursor-pointer smart-row" @click="openUser(props.row)">
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
            <BadgePill :tone="props.row.roleStyle.tone" :icon="props.row.roleStyle.icon" :label="props.row.role" />
          </q-td>
          <q-td key="status" :props="props">
            <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.status" />
          </q-td>
          <q-td key="joined" :props="props" class="text-muted">{{ props.row.joined }}</q-td>
          <q-td key="details" :props="props" class="text-muted ellipsis">{{ props.row.details }}</q-td>
        </q-tr>
      </template>
    </TableCard>

    <DetailDrawer v-model="drawerOpen" expandable v-model:expanded="drawerExpanded" anchored position="right" close-on-backdrop>
      <template #banner>
        <ProfileHero
          :name="selectedUser?.name"
          :initials="selectedUser?.initials"
          :avatar-color="selectedUser?.avatarColor"
          :role-label="cap(selectedUser?.role)"
          :status-label="selectedUser?.status"
          :role-style="selectedUser?.roleStyle"
          :status-style="selectedUser?.statusStyle"
        />
      </template>

      <template v-if="selectedUser">
        <SegmentedToggle v-if="!drawerExpanded" v-model="sectionTab" :options="sectionOptions" />

        <div class="usr-section">
          <!-- OVERVIEW -->
          <template v-if="drawerExpanded || sectionTab === 'overview'">
              <InfoCard title="Basic Info">
                <InfoRow icon="mdi:email-outline" label="Email" :value="selectedUser.email" />
                <InfoRow icon="mdi:phone-outline" label="Contact" :value="selectedUser.contact" />
                <InfoRow icon="mdi:calendar-clock" label="Joined" :value="selectedUser.joined" />
                <InfoRow icon="mdi:identifier" label="User ID" :value="selectedUser.id" :mono="true" :last="true" />
              </InfoCard>

              <InfoCard :title="isStudent ? 'Student Profile' : isLandlord ? 'Landlord Profile' : 'Profile'">
                <template v-if="detailLoading">
                  <InfoRow icon="mdi:school" label="College"><q-skeleton type="text" width="90px" /></InfoRow>
                  <InfoRow icon="mdi:book-open-variant" label="Program"><q-skeleton type="text" width="90px" /></InfoRow>
                  <InfoRow icon="mdi:calendar-star" label="Year Level"><q-skeleton type="text" width="90px" /></InfoRow>
                  <InfoRow icon="mdi:card-account-details" label="Student ID" :last="true"><q-skeleton type="text" width="90px" /></InfoRow>
                </template>

                <template v-else-if="userDetail && isStudent">
                  <InfoRow icon="mdi:school" label="College" :value="userDetail.college || '—'" />
                  <InfoRow icon="mdi:book-open-variant" label="Program" :value="userDetail.program || '—'" />
                  <InfoRow icon="mdi:calendar-star" label="Year Level" :value="userDetail.year_level ?? '—'" />
                  <InfoRow icon="mdi:card-account-details" label="Student ID" :value="userDetail.student_id || '—'" />
                  <InfoRow icon="mdi:check-decagram" label="OSAS Verified" :value="userDetail.osas_verified_at ? 'Yes' : 'No'" :last="true" />
                </template>

                <template v-else-if="userDetail && isLandlord">
                  <InfoRow icon="mdi:domain" label="Business Name" :value="userDetail.business_name || '—'" />
                  <InfoRow icon="mdi:certificate" label="Accreditation" :value="userDetail.accreditation_status || '—'" />
                  <InfoRow icon="mdi:flash" label="Response Rate" :value="userDetail.response_rate != null ? userDetail.response_rate + '%' : '—'" />
                  <InfoRow icon="mdi:clock-outline" label="Expires" :value="userDetail.accreditation_expires_at || '—'" :last="true" />
                </template>

                <EmptyState v-else icon="mdi:account-details" message="No extended profile available." />
              </InfoCard>
            </template>

            <!-- HOUSING (students) -->
            <template v-if="(drawerExpanded && isStudent) || (sectionTab === 'housing' && isStudent)">
              <InfoCard title="Housing">
                <template v-if="detailLoading">
                  <InfoRow icon="mdi:home-city" label="Placement"><q-skeleton type="text" width="90px" /></InfoRow>
                  <InfoRow icon="mdi:domain" label="Property"><q-skeleton type="text" width="90px" /></InfoRow>
                  <InfoRow icon="mdi:bed" label="Room Type"><q-skeleton type="text" width="90px" /></InfoRow>
                  <InfoRow icon="mdi:account-tie" label="Landlord" :last="true"><q-skeleton type="text" width="90px" /></InfoRow>
                </template>
                <template v-else-if="housing">
                  <InfoRow icon="mdi:home-city" label="Placement">
                    <span v-if="housing.placed" class="usr-pill usr-pill--ok">Housed</span>
                    <span v-else class="usr-pill usr-pill--muted">Not placed</span>
                  </InfoRow>
                  <template v-if="housing.placed">
                    <InfoRow icon="mdi:domain" label="Property">
                      <button class="usr-link" type="button" @click="router.push('/map-view')">{{ housing.propertyName }} →</button>
                    </InfoRow>
                    <InfoRow icon="mdi:bed" label="Room Type" :value="housing.roomType" />
                    <InfoRow icon="mdi:account-tie" label="Landlord" :value="housing.landlordName" />
                    <InfoRow icon="mdi:calendar-clock" label="Move-in" :value="fmtDate(housing.moveIn)" :last="true" />
                  </template>
                </template>
                <EmptyState v-else icon="mdi:home-city-outline" message="No housing data." />
              </InfoCard>

              <InfoCard title="Boarding History">
                <template v-if="detailLoading">
                  <div v-for="n in 2" :key="n" class="usr-skel-block">
                    <q-skeleton type="text" width="140px" />
                    <q-skeleton type="text" width="180px" class="q-mt-xs" />
                  </div>
                </template>
                <template v-else-if="boardingHistory.length">
                  <HistoryItem
                    v-for="h in boardingHistory"
                    :key="h.id"
                    :title="h.propertyName"
                    :chip="h.roomType"
                    :subtitle="h.address"
                    :meta="h.period"
                    :pin="true"
                  />
                </template>
                <EmptyState v-else icon="mdi:history" message="No boarding history." />
              </InfoCard>
            </template>

            <!-- PERFORMANCE (landlords) -->
            <template v-if="(drawerExpanded && isLandlord) || (sectionTab === 'performance' && isLandlord)">
              <StatGrid>
                <StatTile icon="mdi:domain" label="Properties Listed" :value="String(landlordProps.length)" accent="teal" />
                <StatTile icon="mdi:star" label="Avg Rating" :value="avgRating" accent="amber" />
                <StatTile icon="mdi:flash" label="Response Rate" :value="userDetail?.response_rate != null ? userDetail.response_rate + '%' : '—'" accent="green" />
                <StatTile icon="mdi:timer-outline" label="Avg Response" :value="respTime" accent="info" />
              </StatGrid>

              <InfoCard title="Listed Properties">
                <template v-if="detailLoading">
                  <div v-for="n in 2" :key="n" class="usr-skel-block">
                    <q-skeleton type="text" width="150px" />
                    <q-skeleton type="text" width="170px" class="q-mt-xs" />
                  </div>
                </template>
                <template v-else-if="landlordProps.length">
                  <HistoryItem
                    v-for="p in landlordProps"
                    :key="p.id"
                    :title="p.name"
                    :chip="cap(p.room_type)"
                    :subtitle="`${cap(p.status)} · ${p.rating_avg != null ? p.rating_avg.toFixed(1) + ' ★' : 'No rating'} · ${p.reviews_count || 0} reviews`"
                    clickable
                    @click="router.push('/map-view')"
                  />
                </template>
                <EmptyState v-else icon="mdi:domain-off" message="No listed properties." />
              </InfoCard>
            </template>
          </div>
      </template>
    </DetailDrawer>

    </div><!-- /users-body -->

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import ExportButton from '@/components/ui/ExportButton.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import { getStatus, getTone, type StatusTone } from '@/utils/status.config'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import ProfileHero from '@/components/user/ProfileHero.vue'
import SegmentedToggle from '@/components/ui/SegmentedToggle.vue'
import InfoCard from '@/components/ui/InfoCard.vue'
import InfoRow from '@/components/ui/InfoRow.vue'
import StatGrid from '@/components/ui/StatGrid.vue'
import StatTile from '@/components/ui/StatTile.vue'
import HistoryItem from '@/components/ui/HistoryItem.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const loading = ref(true)
const fetchError = ref('')
const rawUsers = ref<any[]>([])
const search = ref('')
const currentPage = ref(1)
const activeTab = ref('users')
const activeFilters = ref({ role: [] as string[], status: [] as string[] })

const drawerOpen = ref(false)
const drawerExpanded = ref(false)
const selectedUser = ref<any | null>(null)
const userDetail = ref<any | null>(null)
const detailLoading = ref(false)

const sectionTab = ref<string>('overview')
const housing = ref<any | null>(null)
const boardingHistory = ref<any[]>([])
const landlordProps = ref<any[]>([])

const router = useRouter()

const tabs = [
  { name: 'users', label: 'Users' },
]

const filterConfig = [
  { label: 'Role', key: 'role', options: [ { label: 'Student', value: 'Student' }, { label: 'Landlord', value: 'Landlord' } ] },
  { label: 'Status', key: 'status', options: [ { label: 'Verified', value: 'Verified' }, { label: 'Pending', value: 'Pending' }, { label: 'Reviewing', value: 'Reviewing' }, { label: 'Rejected', value: 'Rejected' }, { label: 'Suspended', value: 'Suspended' }, { label: 'Unverified', value: 'Unverified' } ] }
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
      rawUsers.value = data.map(mapUserData)
    }
  } catch (err) {
    fetchError.value = err instanceof Error ? err.message : String(err)
    console.error('Unexpected error fetching users:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

async function openUser(row: any) {
  selectedUser.value = row
  userDetail.value = null
  housing.value = null
  boardingHistory.value = []
  landlordProps.value = []
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
        .select('college, program, year_level, student_id, osas_verified_at, emergency_contact_json')
        .eq('user_id', userId)
        .maybeSingle()
      detail = data

      // Active placement
      const { data: lease } = await supabase
        .from('leases')
        .select('start_date, status, landlord:landlord_id(full_name), room:room_id(property:properties(id, name, room_type, address, barangay, city))')
        .eq('student_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      housing.value = lease
        ? {
            placed: true,
            propertyId: lease.room?.property?.id,
            propertyName: lease.room?.property?.name || '—',
            roomType: cap(lease.room?.property?.room_type),
            landlordName: lease.landlord?.full_name || '—',
            moveIn: lease.start_date,
          }
        : { placed: false }

      // Boarding history
      const { data: hist } = await supabase
        .from('boarding_history')
        .select('id, property_name, room_type, period_start, period_end, property:properties(id, address, barangay, city)')
        .eq('student_id', userId)
        .order('period_start', { ascending: false })
      boardingHistory.value = (hist || []).map((h: any) => ({
        id: h.id,
        propertyId: h.property?.id,
        propertyName: h.property_name || h.property?.name || '—',
        roomType: cap(h.room_type),
        address: composeAddress(h.property),
        period: periodLabel(h.period_start, h.period_end),
      }))
    } else if (normalized === 'landlord') {
      const { data } = await supabase
        .from('landlord_profiles')
        .select('business_name, accreditation_status, response_rate, accreditation_expires_at, avg_response_minutes')
        .eq('user_id', userId)
        .maybeSingle()
      detail = data

      // Listed properties
      const { data: props } = await supabase
        .from('properties')
        .select('id, name, status, room_type, rating_avg, reviews_count')
        .eq('landlord_id', userId)
        .order('name', { ascending: true })
      landlordProps.value = props || []
    }

    userDetail.value = detail
  } catch (err) {
    console.error('Failed to load user detail:', err)
    userDetail.value = null
  } finally {
    detailLoading.value = false
  }
}

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

function cap(s: string | null | undefined) {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function composeAddress(p: any) {
  if (!p) return '—'
  const parts = [p.address, p.barangay, p.city].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function periodLabel(start: string | null, end: string | null) {
  const s = fmtDate(start)
  return end ? `${s} – ${fmtDate(end)}` : `${s} – Present`
}
function fmtMinutes(m: number | null | undefined) {
  if (m == null) return '—'
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

const isStudent = computed(() => (selectedUser.value?.role || '').toLowerCase() === 'student')
const isLandlord = computed(() => (selectedUser.value?.role || '').toLowerCase() === 'landlord')
const sectionOptions = computed(() =>
  isStudent.value
    ? [ { value: 'overview', label: 'Overview' }, { value: 'housing', label: 'Housing' } ]
    : [ { value: 'overview', label: 'Overview' }, { value: 'performance', label: 'Performance' } ]
)
const avgRating = computed(() => {
  const vals = landlordProps.value.map(p => p.rating_avg).filter((v: any) => v != null) as number[]
  if (!vals.length) return '—'
  return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) + ' ★'
})
const respTime = computed(() => fmtMinutes(userDetail.value?.avg_response_minutes))
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
