<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <q-btn
        unelevated
        color="teal-7"
        no-caps
        class="text-weight-bold rounded-button q-mb-md"
        @click="handleExport"
      >
        <Icon icon="lucide:download" class="on-left" width="18" height="18" />Export
      </q-btn>
    </div>

    <div class="prop-hub-body">
      <TableCard
        v-model:search="search"
        v-model:active-filters="activeFilters"
        v-model:page="currentPage"
        :search-placeholder="'Search accommodation, manager, or address…'"
        :filters="filterConfig"
        :loading="loading"
        :total-label="`${filteredAccommodations.length} accommodation${filteredAccommodations.length === 1 ? '' : 's'}`"
        :total-items="filteredAccommodations.length"
        item-name="accommodations"
        @clear-filters="clearFilters"
        @refresh="fetchAccommodations"
      >
      <template #panels>
        <q-tab-panels v-model="activeTab" animated style="background: transparent; height: 100%;">

          <!-- OVERVIEW -->
          <q-tab-panel name="overview" class="q-pa-none">
            <DataTable :rows="paginatedAccommodations" :columns="overviewColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="lucide:map-pin-house" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No accommodations yet</div>
                  <div>Listed accommodations will appear here.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click.stop="openAccommodation(props.row)">
                  <q-td key="accommodation" :props="props">
                    <UserInfoCell :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :subtitle="props.row.type" />
                  </q-td>
                  <q-td key="accommodationManager" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.accommodationManager }}</q-td>
                  <q-td key="rooms" :props="props" class="text-center text-ink" style="font-size: 13px;">{{ props.row.totalRooms }}</q-td>
                  <q-td key="occupants" :props="props" class="text-center text-ink" style="font-size: 13px;">{{ props.row.totalStudents }}</q-td>
                  <q-td key="status" :props="props">
                    <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.statusLabel" />
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- COMPLIANCE (one row per house; a capsule per required permit) -->
          <q-tab-panel name="compliance" class="q-pa-none">
            <DataTable :rows="paginatedAccommodations" :columns="complianceColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="lucide:file-check" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No accommodations yet</div>
                  <div>Permit compliance appears once documents are uploaded.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click.stop="openAccommodation(props.row)">
                  <q-td key="accommodation" :props="props">
                    <UserInfoCell :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :subtitle="props.row.type" />
                  </q-td>
                  <q-td v-for="perm in requiredPermits" :key="perm" :props="props" class="text-center">
                    <BadgePill
                      :tone="PERMIT_STATE[permitStatus(props.row, perm)].tone"
                      :icon="PERMIT_STATE[permitStatus(props.row, perm)].icon"
                      :label="PERMIT_STATE[permitStatus(props.row, perm)].label"
                    />
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- PERFORMANCE -->
          <q-tab-panel name="performance" class="q-pa-none">
            <DataTable :rows="paginatedAccommodations" :columns="performanceColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="lucide:chart-column" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No performance data</div>
                  <div>Ratings and reviews aren't populated yet.</div>
                </div>
              </template>
              <template #body="{ props }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click.stop="openAccommodation(props.row)">
                  <q-td key="accommodation" :props="props">
                    <UserInfoCell :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :subtitle="props.row.type" />
                  </q-td>
                  <q-td key="accommodationManager" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.accommodationManager }}</q-td>
                  <q-td key="rating" :props="props" class="text-ink" style="font-size: 13px;">
                    <span class="text-orange-5 text-weight-bold row items-center no-wrap">
                      <Icon icon="lucide:star" width="14" height="14" class="q-mr-xs" /> {{ props.row.rating }}
                    </span>
                  </q-td>
                  <q-td key="response" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.responseRate != null ? `${props.row.responseRate}%` : '—' }}</q-td>
                  <q-td key="occupancy" :props="props" class="text-ink text-weight-medium text-center" style="font-size: 13px;">
                    {{ props.row.totalStudents }}/{{ props.row.totalCapacity }}
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

        </q-tab-panels>
      </template>
    </TableCard>

    <!-- DETAIL DRAWER: docks to the right edge of the table, flush, no margin -->
    <DetailDrawer
      v-model="drawerOpen"
      :width="'540px'"
      anchored
      position="right"
      close-on-backdrop
      :loading="detailLoading"
        :preview="accommodationPreview"
      :management-actions="accommodationActions"
      @manage="onManageAccommodation"
    />

    </div><!-- /prop-hub-body -->

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import DataTable from '@/components/table/DataTable.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import type { DrawerPreview, PreviewChip } from '@/components/ui/DetailDrawer.vue'
import { getStatus, getTone, type StatusTone } from '@/utils/status.config'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { escapeHtml, formatDateTime, humanizeEnum } from '@/utils/format'
import { fetchAccommodationEvents, type AccommodationEventRow } from '@/api/accommodations'
import { downloadCsv } from '@/utils/csv'
import { useAccommodations } from '@/composables/useAccommodations'

const search = ref('')
const activeTab = ref('overview')
const currentPage = ref(1)
const activeFilters = ref<Record<string, any[]>>({})

const { loading, accommodations: realAccommodations, load: loadAccommodations } = useAccommodations()

const route = useRoute()

const tabs = [
  { name: 'overview', label: 'Overview' },
  { name: 'compliance', label: 'Compliance' },
  { name: 'performance', label: 'Performance' },
]

// Accommodation types are derived from the loaded rows rather than hardcoded.
// The fixed list read 'Boarding House' / 'Apartment' against a row value of
// 'Boarding House' built from the enum 'boarding_house', so the filter matched
// nothing; and the column also holds condominium_unit, residence_hall and a few
// stray room-type values no hardcoded list would have covered. Same pattern as
// AuditLogs.vue's computed filterConfig.
const filterConfig = computed(() => [
  {
    // Derived from the loaded rows, like the type filter below it: the fixed
    // pair offered Verified/Pending against eight real statuses, so filtering
    // for a rejected or expired property was not possible at all.
    label: 'Status', key: 'status', options: [
      ...new Set(accommodations.value.map((p) => String(p.status ?? '')).filter(Boolean)),
    ].sort().map((v) => ({ label: humanizeEnum(v), value: v })),
  },
  {
    label: 'Accommodation Type',
    key: 'type',
    options: [...new Set(accommodations.value.map((p) => p.type).filter(Boolean))]
      .sort()
      .map((t) => ({ label: t, value: t })),
  },
])

function clearFilters() {
  activeFilters.value = {}
}

function handleExport() {
  downloadCsv(
    'accommodations_export',
    ['Accommodation', 'Type', 'Accommodation Manager', 'Address', 'Status', 'Rooms', 'Occupants', 'Capacity', 'Rating'],
    filteredAccommodations.value.map((p) => [
      p.name, p.type, p.accommodationManager, p.address, p.status,
      p.totalRooms, p.totalStudents, p.totalCapacity, p.rating,
    ]),
  )
}

async function fetchAccommodations() {
  await loadAccommodations()
}

onMounted(async () => {
  await fetchAccommodations()

  // Deep-link support: ?accommodation=<id> from Map View opens that record's detail.
  const targetId = route.query.accommodation
  if (targetId && typeof targetId === 'string') {
    const row = accommodations.value.find((p) => p.id === targetId)
    if (row) openAccommodation(row)
  }
})

type ManagementAction = { label: string; action: string; danger?: boolean }

/**
 * OSAS pulling an accredited property is a different act from the manager
 * delisting their own, and from a refusal at accreditation — so it gets its own
 * status rather than another meaning loaded onto `rejected`. Same shape as the
 * account actions in Users.vue.
 */
const accommodationActions = computed<ManagementAction[]>(() => {
  const a = selectedAccommodation.value
  if (!a) return []
  const status = String(a.status || '').toLowerCase()
  if (status === 'suspended') {
    return [{ label: 'Restore Accreditation', action: 'restore' }]
  }
  if (status === 'accredited') {
    return [{ label: 'Suspend Property', action: 'suspend', danger: true }]
  }
  return []
})

async function onManageAccommodation(action: string) {
  const a = selectedAccommodation.value
  if (!a?.id) return
  const next = action === 'suspend' ? 'suspended' : action === 'restore' ? 'accredited' : null
  if (!next) return

  const reason =
    action === 'suspend'
      ? (window.prompt('Why is this property being suspended? This is recorded in the audit log.') ?? '').trim()
      : ''
  if (action === 'suspend' && !reason) return

  const { error } = await supabase
    .from('accommodations')
    .update({ status: next } as never)
    .eq('id', a.id)
  if (error) {
    notify.error('Could not change the property status', error.message)
    return
  }

  // Only now is the row actually in this state, so only now does the UI say so.
  const def = getStatus(next)
  selectedAccommodation.value = {
    ...a,
    status: next,
    verified: next === 'accredited',
    statusLabel: humanizeEnum(next),
    statusStyle: { tone: def.tone, icon: def.icon ?? 'lucide:circle' },
  }
  const row = accommodations.value.find((r) => r.id === a.id)
  if (row) Object.assign(row, selectedAccommodation.value)

  const actorId = (await supabase.auth.getUser()).data.user?.id || null
  const { error: auditErr } = await supabase.from('audit_logs').insert({
    action: `accommodation.${action}`,
    actor_id: actorId,
    entity_id: a.id,
    entity_type: 'accommodation',
    before_json: { status: a.status },
    after_json: { status: next, reason: reason || null },
  } as never)
  if (auditErr) notify.warning('Change not recorded in the audit log', auditErr.message)

  notify.success(action === 'suspend' ? 'Property suspended.' : 'Accreditation restored.')
  void loadAccommodationEvents(a.id)
}

const notify = useNotify()

const drawerOpen = ref(false)
const detailLoading = ref(false)
const selectedAccommodation = ref<any | null>(null)
const accommodationEvents = ref<AccommodationEventRow[]>([])

function openAccommodation(row: any) {
  selectedAccommodation.value = row
  accommodationEvents.value = []
  drawerOpen.value = true
  void fetchAccommodationDetail(row)
  void loadAccommodationEvents(row.id)
}

async function loadAccommodationEvents(id: string) {
  try {
    accommodationEvents.value = await fetchAccommodationEvents(id)
  } catch {
    // The audit trail is supporting detail; a failure here hides the Activity
    // tab rather than blocking the drawer.
    accommodationEvents.value = []
  }
}

async function fetchAccommodationDetail(row: any) {
  detailLoading.value = true
  try {
    const { data: p, error } = await supabase
      .from('accommodations')
      .select(
        `id, name, status, accreditation_status, accreditation_expires_at, rating_avg,
          address, barangay, city, accommodation_type, total_floors, total_rooms`
      )
      .eq('id', row.id)
      .single()
    if (error) throw error
    if (p) {
      const d = p as any
      selectedAccommodation.value = {
        ...row,
        name: d.name ?? row.name,
        status: d.status ?? row.status,
        verified: d.status === 'accredited',
        accreditationStatus: d.accreditation_status ?? row.accreditationStatus,
        accreditationExpiresAt: d.accreditation_expires_at ?? row.accreditationExpiresAt,
        rating: d.rating_avg != null ? d.rating_avg.toFixed(1) : row.rating,
        address: [d.address, d.barangay, d.city].filter(Boolean).join(', ') || row.address,
        type: d.accommodation_type ? cap(d.accommodation_type) : row.type,
        floors: d.total_floors ?? row.floors,
        totalRooms: d.total_rooms ?? row.totalRooms,
      }
    }
  } catch {
    // keep the row-based preview already assigned above
  } finally {
    detailLoading.value = false
  }
}

function cap(s: string | null | undefined) {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function roomTone(status: string | null | undefined): StatusTone {
  const s = (status || '').toLowerCase()
  if (s.includes('occup')) return 'warning'
  if (s.includes('avail')) return 'success'
  if (s.includes('maint')) return 'danger'
  if (s.includes('reserv')) return 'info'
  return 'neutral'
}

const overviewColumns = [
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'name', headerStyle: 'width: 28%' },
  { name: 'accommodationManager', align: 'left', label: 'Accommodation Manager', field: 'accommodationManager', headerStyle: 'width: 18%' },
  { name: 'rooms', align: 'center', label: 'Rooms', field: 'totalRooms', headerStyle: 'width: 12%' },
  { name: 'occupants', align: 'center', label: 'Occupants', field: 'totalStudents', headerStyle: 'width: 14%' },
  { name: 'status', align: 'left', label: 'Status', field: 'verified', headerStyle: 'width: 18%' },
]

const complianceColumns = [
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'name', headerStyle: 'width: 22%' },
  { name: 'fire', align: 'center', label: 'Fire Permit', field: 'fire', headerStyle: 'width: 19%' },
  { name: 'business', align: 'center', label: 'Business Permit', field: 'business', headerStyle: 'width: 19%' },
  { name: 'sanitary', align: 'center', label: 'Sanitary Permit', field: 'sanitary', headerStyle: 'width: 20%' },
  { name: 'building', align: 'center', label: 'Building Permit', field: 'building', headerStyle: 'width: 20%' },
]

const performanceColumns = [
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'name', headerStyle: 'width: 28%' },
  { name: 'accommodationManager', align: 'left', label: 'Accommodation Manager', field: 'accommodationManager', headerStyle: 'width: 20%' },
  { name: 'rating', align: 'left', label: 'Rating', field: 'rating', headerStyle: 'width: 14%' },
  { name: 'response', align: 'left', label: 'Response', field: 'responseRate', headerStyle: 'width: 14%' },
  { name: 'occupancy', align: 'center', label: 'Occupancy', field: 'totalStudents', headerStyle: 'width: 24%' },
]

// Map real Supabase accommodations straight through — no invented audit/compliance
// fields. The rows carry the real accommodation fields plus rooms + occupants.
const accommodations = computed(() => realAccommodations.value.map((p) => ({
  id: p.id,
  name: p.name,
  type: p.accommodationType,
  initials: p.accommodationManagerInitials,
  accommodationManager: p.accommodationManager,
  contact: p.contact,
  verified: p.verified,
  status: p.status,
  statusLabel: p.statusLabel,
  statusStyle: p.statusStyle,
  rating: p.rating,
  address: p.address,
  floors: p.floors,
  totalRooms: p.totalRooms,
  occupiedRooms: p.occupiedRooms,
  totalStudents: p.totalStudents,
  totalCapacity: p.totalCapacity,
  occupancyRate: p.occupancyRate,
  femaleCount: p.femaleCount,
  maleCount: p.maleCount,
  roomType: p.roomType,
  description: p.description,
  accreditationStatus: p.accreditationStatus,
  accreditedAt: p.accreditedAt,
  accreditationExpiresAt: p.accreditationExpiresAt,
  responseRate: p.responseRate,
  rooms: p.rooms,
  permits: p.permits,
})))

// Set of permits a boarding house is required to submit for verification.
// Each becomes its own column in the Compliance tab.
const requiredPermits = ['fire', 'business', 'sanitary', 'building']

// True if the accommodation has a submitted document matching the given required
// permit keyword. Matching is case-insensitive and bidirectional so labels like
// "fire certificate" or "business permit" both count against fire / business.
function findPermit(prop: any, requiredType: string): any {
  const kw = requiredType.toLowerCase()
  return (prop.permits ?? []).find((pm: any) => {
    const t = String(pm.type || '').toLowerCase()
    return t.includes(kw) || kw.includes(t)
  })
}

// Compliance state of one required permit for an accommodation.
//   'missing'  -> no document uploaded
//   'expired'  -> document past its expiry date
//   'expiring' -> document valid but expires within 30 days
//   'valid'    -> document present and not expiring soon
function permitStatus(prop: any, requiredType: string): 'missing' | 'expired' | 'expiring' | 'valid' {
  const pm = findPermit(prop, requiredType)
  if (!pm) return 'missing'

  const exp = pm.expiresAt ? new Date(pm.expiresAt).getTime() : null
  if (exp == null) return 'valid' // no expiry recorded -> treat as valid

  const today = Date.now()
  const days30 = 30 * 24 * 60 * 60 * 1000
  if (exp < today) return 'expired'
  if (exp < today + days30) return 'expiring'
  return 'valid'
}

// Presentational settings for each compliance state, reusing BadgePill tones
// so each permit renders as a capsule in the table (no separate legend needed).
const PERMIT_STATE = {
  missing: { tone: 'neutral', icon: 'lucide:circle-x', label: 'Not Submitted' },
  expired: { tone: 'danger', icon: 'lucide:circle-x', label: 'Expired' },
  expiring: { tone: 'warning', icon: 'lucide:clock-alert', label: 'Expiring' },
  valid: { tone: 'success', icon: 'lucide:circle-check', label: 'Valid' },
} as const

const filteredAccommodations = computed(() => {
  let result = [...accommodations.value]

  const statusFilter = activeFilters.value.status
  if (statusFilter && statusFilter.length > 0) {
    result = result.filter((p) => statusFilter.includes(p.status))
  }
  const typeFilter = activeFilters.value.type
  if (typeFilter && typeFilter.length > 0) {
    result = result.filter((p) => typeFilter.includes(p.type))
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.accommodationManager.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    )
  }

  return result
})

const paginatedAccommodations = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredAccommodations.value.slice(start, start + 10)
})

watch(activeTab, () => {
  search.value = ''
  currentPage.value = 1
})

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=160&background=0F766E&color=fff&bold=true`

const accommodationPreview = computed<DrawerPreview>(() => {
  const p = selectedAccommodation.value
  if (!p) return { kind: 'accommodation', title: 'Accommodation Preview', name: '', avatar: '', stats: [], detailGroups: [] }
  const chips: PreviewChip[] = [
    { text: p.type, tone: 'primary', icon: 'lucide:building-2' },
    p.verified
      ? { text: 'Verified', tone: 'success', icon: 'lucide:circle-check' }
      : { text: 'Pending', tone: 'warning', icon: 'lucide:clock' },
  ]
  const occupancy = p.totalCapacity ? `${Math.round((p.totalStudents / p.totalCapacity) * 100)}%` : '—'
  const stats = [
    { label: 'Occupants', value: p.totalStudents },
    { label: 'Rooms', value: p.totalRooms },
    { label: 'Rating', value: p.rating != null ? `${p.rating} ★` : '—' },
    { label: 'Occupancy', value: occupancy },
  ]
  const detailGroups = [
    {
      title: 'Identity',
      icon: 'lucide:building-2',
      rows: [
        { label: 'Accommodation ID', value: String(p.id) },
        { label: 'Type', value: p.type },
        { label: 'Accommodation Manager', value: p.accommodationManager },
      ],
    },
    {
      title: 'Location',
      icon: 'lucide:map-pin',
      rows: [
        { label: 'Address', value: p.address },
        { label: 'Floors', value: p.floors ? String(p.floors) : '—' },
      ],
    },
    {
      title: 'Capacity',
      icon: 'lucide:bed',
      rows: [
        { label: 'Total Rooms', value: String(p.totalRooms) },
        { label: 'Occupants', value: `${p.totalStudents} / ${p.totalCapacity}` },
        { label: 'Female / Male', value: `${p.femaleCount} / ${p.maleCount}` },
      ],
    },
    {
      title: 'Accreditation',
      icon: 'lucide:award',
      rows: [
        { label: 'Response', value: p.responseRate != null ? `${p.responseRate}%` : '—' },
        { label: 'Expires', value: p.accreditationExpiresAt || '—' },
      ],
    },
  ]
  // Documents regarding the accommodation (permits / certificates with an uploaded file).
  const files = (p.permits ?? [])
    .filter((pm: any) => pm.fileUrl)
    .map((pm: any) => ({
      name: String(pm.type || 'Document').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      url: pm.fileUrl,
      docId: pm.id,
      docTable: 'accommodation_documents' as const,
    }))
  // Rooms of this accommodation — clickable to jump to Room Hub.
  const rooms = (p.rooms ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    floor: r.floor,
    capacity: r.capacity,
    pax: r.currentPax,
    status: r.status,
    statusTone: roomTone(r.status),
    accommodationId: p.id,
  }))
  // Real events from the audit trail. `text` is rendered with v-html by
  // ActivityTab.vue, so anything spliced in is escaped — see escapeHtml() in
  // utils/format.ts. An empty trail leaves the Activity tab hidden.
  const activity = accommodationEvents.value.map((e) => {
    const changed = e.after_status && e.before_status !== e.after_status
    if (e.action === 'CREATE') {
      return {
        text: `<strong>${escapeHtml(p.name)}</strong> was listed`,
        time: formatDateTime(e.created_at),
        icon: 'lucide:circle-plus',
        tone: 'primary' as StatusTone,
      }
    }
    if (changed) {
      return {
        text: `Status changed to <strong>${escapeHtml(cap(e.after_status || ''))}</strong>`,
        time: formatDateTime(e.created_at),
        icon: 'lucide:arrow-left-right',
        tone: getTone(e.after_status || ''),
      }
    }
    return {
      text: 'Listing details updated',
      time: formatDateTime(e.created_at),
      icon: 'lucide:pencil',
      tone: 'neutral' as StatusTone,
    }
  })

  return {
    kind: 'accommodation',
    title: 'Accommodation Preview',
    viewDetailsLabel: 'View Full Details',
    name: p.name,
    avatar: avatarUrl(p.name),
    chips,
    meta: p.address,
    org: { name: p.accommodationManager, icon: 'lucide:user-round' },
    stats,
    detailGroups,
    files,
    rooms,
    activity,
  }
})
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

/* Holds the table + the right-docked detail drawer together so the drawer
   anchors flush to the table's right edge (no margin, inside the card area). */
.prop-hub-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.non-shrink {
  flex-shrink: 0;
}

.room-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
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
</style>
