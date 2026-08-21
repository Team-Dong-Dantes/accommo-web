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
import { supabase } from '@/utils/supabase'

import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import ExportButton from '@/components/ui/ExportButton.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import { getStatus, getTone, type StatusTone } from '@/utils/status.config'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import type { DrawerPreview, PreviewChip } from '@/components/ui/DetailDrawer.vue'

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
const userReviews = ref<any[]>([])
const detailLoading = ref(false)

const sectionTab = ref<string>('overview')
const housing = ref<any | null>(null)
const boardingHistory = ref<any[]>([])
const landlordProps = ref<any[]>([])

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
            address: composeAddress(lease.room?.property),
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
        .select('business_name, accreditation_status, response_rate, accreditation_expires_at, avg_response_minutes, government_id_url')
        .eq('user_id', userId)
        .maybeSingle()
      detail = data

      // Listed properties
      const { data: props } = await supabase
        .from('properties')
        .select('id, name, status, room_type, total_rooms, address, barangay, city, rating_avg, reviews_count')
        .eq('landlord_id', userId)
        .order('name', { ascending: true })
      landlordProps.value = props || []
    }

    // Reviews — landlord = reviews received; student = tenant reviews received
    if (normalized === 'landlord') {
      const res = (await supabase
        .from('landlord_reviews')
        .select('rating, comment, created_at, student_id(full_name)')
        .eq('landlord_id', userId)
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
        .select('rating, comment, created_at, landlord_id(full_name)')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })) as any
      const revs = (res?.data || []) as any[]
      userReviews.value = revs.map((r: any) => ({
        author_name: r.landlord_id?.full_name || 'Anonymous',
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
const respTime = computed(() => fmtMinutes(userDetail.value?.avg_response_minutes))

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=160&background=0F766E&color=fff&bold=true`

function statusChip(label: string, tone: StatusTone, icon?: string): PreviewChip {
  const c: PreviewChip = { text: label, tone }
  if (icon) c.icon = icon
  return c
}

const userPreview = computed<DrawerPreview>(() => {
  const u = selectedUser.value
  if (!u) return { title: 'User Preview', name: '', avatar: '', stats: [], details: [] }
  const detail = userDetail.value

  const roleChip: PreviewChip = isStudent.value
    ? { text: 'Student', tone: 'neutral', icon: 'mdi:school' }
    : isLandlord.value
      ? { text: 'Landlord', tone: 'primary', icon: 'mdi:domain' }
      : { text: u.role, tone: 'neutral' }

  const chips: PreviewChip[] = [roleChip, statusChip(u.status, u.statusStyle?.tone ?? 'neutral', u.statusStyle?.icon)]

  const stats = isLandlord.value
    ? [
        { label: 'Properties', value: landlordProps.value.length },
        { label: 'Response Rate', value: detail?.response_rate != null ? `${detail.response_rate}%` : '—' },
        { label: 'Avg Response', value: respTime.value },
      ]
    : []

  const telLink = (c: string) => c.startsWith('+') ? `tel:${c.replace(/\s/g, '')}` : undefined
  type PDetail = NonNullable<DrawerPreview['details']>[number]
  const detailRow = (label: string, value: string, link?: string): PDetail => {
    const row: PDetail = { label, value }
    if (link) row.link = link
    return row
  }

  const details = isStudent.value
    ? [
        detailRow('Email', u.email, `mailto:${u.email}`),
        detailRow('Phone', u.contact, telLink(u.contact)),
        detailRow('College', detail?.college || '—'),
        detailRow('Program', detail?.program || '—'),
        detailRow('Year Level', detail?.year_level ?? '—'),
        detailRow('Student ID', detail?.student_id || '—'),
        detailRow('Joined', u.joined),
      ]
    : [
        detailRow('Email', u.email, `mailto:${u.email}`),
        detailRow('Phone', u.contact, telLink(u.contact)),
        detailRow('Joined', u.joined),
      ]

  let card: DrawerPreview['card']
  const historyCards: any[] = []
  if (isStudent.value) {
    if (housing.value?.placed) {
      const h = housing.value
      historyCards.push({
        icon: 'mdi:home',
        title: h.propertyName,
        status: 'Current',
        statusTone: 'success',
        active: true,
        roomType: h.roomType || '—',
        location: h.address,
        date: `Move-in ${fmtDate(h.moveIn)}`,
        propertyId: h.propertyId,
      })
    }
    boardingHistory.value.forEach((hh) => {
      historyCards.push({
        icon: 'mdi:history',
        title: hh.propertyName,
        status: 'Past',
        statusTone: 'neutral',
        roomType: hh.roomType || '—',
        location: hh.address,
        date: hh.period,
        propertyId: hh.propertyId,
      })
    })
  } else if (isLandlord.value && landlordProps.value.length) {
    const p = landlordProps.value[0]
    card = {
      title: 'Active Listing',
      propertyId: p.id,
      head: { title: p.name, location: composeAddress(p), status: cap(p.status), statusTone: getTone(p.status) },
      cells: [
        { label: 'Type', value: cap(p.room_type) },
        { label: 'Rooms', value: p.total_rooms != null ? String(p.total_rooms) : '—' },
        { label: 'Rating', value: p.rating_avg != null ? `${p.rating_avg.toFixed(1)} ★` : 'No rating' },
        { label: 'Reviews', value: String(p.reviews_count || 0) },
      ],
    }
  }

  type PReview = NonNullable<DrawerPreview['reviews']>
  const reviews: PReview = userReviews.value.map((r: any) => ({
    author: r.author_name || 'Anonymous',
    rating: r.rating,
    comment: r.comment || undefined,
    time: fmtDate(r.created_at),
  }))

  // Activity feed — what the user has actually done / experienced in the app,
  // derived from real lifecycle events (most recent first).
  type ActivityEvent = { text: string; time: string; ts: number; icon: string; tone: StatusTone }
  const events: ActivityEvent[] = []

  if (u.joined) {
    const ts = new Date(u.joined).getTime()
    if (!isNaN(ts)) {
      events.push({
        text: `<strong>${u.name}</strong> created their account`,
        time: fmtDate(u.joined),
        ts,
        icon: 'mdi:account-plus',
        tone: 'primary',
      })
    }
  }

  if (isStudent.value && detail?.osas_verified_at) {
    const ts = new Date(detail.osas_verified_at).getTime()
    if (!isNaN(ts)) {
      events.push({
        text: `<strong>${u.name}</strong> was verified by OSAS`,
        time: fmtDate(detail.osas_verified_at),
        ts,
        icon: 'mdi:shield-check',
        tone: 'success',
      })
    }
  }

  if (isStudent.value && housing.value?.placed && housing.value.moveIn) {
    const ts = new Date(housing.value.moveIn).getTime()
    if (!isNaN(ts)) {
      events.push({
        text: `Moved into <strong>${housing.value.propertyName}</strong>`,
        time: fmtDate(housing.value.moveIn),
        ts,
        icon: 'mdi:home',
        tone: 'success',
      })
    }
  }

  boardingHistory.value.forEach((hh) => {
    const ts = new Date(hh.period_start).getTime()
    if (isNaN(ts)) return
    events.push({
      text: `Boarded at <strong>${hh.propertyName}</strong>`,
      time: hh.period,
      ts,
      icon: 'mdi:history',
      tone: 'neutral',
    })
  })

  userReviews.value.forEach((r) => {
    const ts = new Date(r.created_at).getTime()
    if (isNaN(ts)) return
    const author = r.author_name && r.author_name !== 'Anonymous' ? ` from ${r.author_name}` : ''
    events.push({
      text: `Received a <strong>${r.rating}★</strong> review${author}`,
      time: fmtDate(r.created_at),
      ts,
      icon: 'mdi:star',
      tone: 'warning',
    })
  })

  events.sort((a, b) => b.ts - a.ts)

  const activity = events.length
    ? events.map((e) => ({ text: e.text, time: e.time, icon: e.icon, tone: e.tone }))
    : [{ text: `<strong>${u.name}</strong> has no recorded activity yet`, time: '', icon: 'mdi:calendar-blank', tone: 'neutral' as StatusTone }]

  const files: { name: string; url: string }[] = []
  if (isStudent.value) {
    if (detail?.school_id_url) files.push({ name: 'School ID', url: detail.school_id_url })
    if (detail?.assessment_of_fees_url) files.push({ name: 'Assessment of Fees', url: detail.assessment_of_fees_url })
  } else if (isLandlord.value) {
    if (detail?.government_id_url) files.push({ name: 'Government ID', url: detail.government_id_url })
  }

  type PHistory = NonNullable<DrawerPreview['history']>
  const history: PHistory = []
  let placement: DrawerPreview['placement']
  if (isStudent.value) {
    if (housing.value?.placed) {
      const h = housing.value
      placement = {
        status: 'Housed',
        statusTone: 'success',
        property: h.propertyName || 'Boarding House',
        roomType: h.roomType,
        landlord: h.landlordName,
        address: h.address,
        moveIn: fmtDate(h.moveIn),
      }
      history.push({
        title: h.propertyName || 'Active Placement',
        desc: [cap(h.roomType), h.landlordName, h.address].filter(Boolean).join(' · '),
        meta: `Move-in ${fmtDate(h.moveIn)}`,
        tone: 'success',
        icon: 'mdi:home',
        active: true,
      })
    } else {
      placement = { status: 'Not placed', statusTone: 'neutral', property: 'No active placement' }
      history.push({ title: 'No active placement', tone: 'neutral', icon: 'mdi:home-outline' })
    }
    boardingHistory.value.forEach((hh) => {
      history.push({
        title: hh.propertyName || 'Boarding',
        desc: [hh.roomType ? cap(hh.roomType) : '', hh.address].filter(Boolean).join(' · '),
        meta: hh.period,
        tone: 'neutral',
        icon: 'mdi:history',
      })
    })
  }

  const result: DrawerPreview = {
    title: 'User Preview',
    viewDetailsLabel: 'View Full Details',
    name: u.name,
    avatar: avatarUrl(u.name),
    chips,
    stats,
    details,
    activity,
  }
  if (card) result.card = card
  if (isStudent.value) {
    result.history = history
    result.historyCards = historyCards
    if (placement) result.placement = placement
  }
  result.files = files
  result.reviews = reviews
  return result
})

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
