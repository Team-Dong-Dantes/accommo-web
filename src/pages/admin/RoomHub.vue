<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">
    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />
    </div>

    <div class="prop-hub-body">
      <TableCard
        v-model:search="search"
        :search-placeholder="'Search room, accommodation, student, or manager…'"
        :filters="filterConfig"
        v-model:active-filters="activeFilters"
        @clear-filters="clearFilters"
        :loading="loading"
        :total-label="`${filteredRooms.length} room${filteredRooms.length === 1 ? '' : 's'}`"
        :total-items="filteredRooms.length"
        item-name="rooms"
        :rows="paginatedRooms"
        :columns="columns"
        row-key="id"
        :rows-per-page="10"
        :page="currentPage"
        @refresh="fetchRooms"
        @update:page="currentPage = $event"
      >
        <template #body="{ props }">
          <q-tr
            :props="props"
            class="smart-row cursor-pointer"
            @click.stop="openRoom(props.row)"
          >
            <q-td key="room" :props="props">
              <UserInfoCell
                :initials="props.row.initials"
                :name="props.row.name"
                :subtitle="props.row.accommodation"
                :avatar-color="'teal-6'"
                size="36px"
                font-size="13px"
              />
            </q-td>
            <q-td key="accommodation" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.accommodation }}</q-td>
            <q-td key="floor" :props="props" class="text-ink" style="font-size: 13px;">{{ props.row.floor != null ? props.row.floor : '—' }}</q-td>
            <q-td key="capacity" :props="props" class="text-center text-ink" style="font-size: 13px;">{{ props.row.capacity ?? '—' }}</q-td>
            <q-td key="occupants" :props="props" class="text-center text-ink" style="font-size: 13px;">{{ props.row.occupants ?? 0 }}</q-td>
            <q-td key="rent" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.rent != null ? '₱' + props.row.rent.toLocaleString() : '—' }}</q-td>
            <q-td key="status" :props="props">
              <BadgePill :tone="roomTone(props.row.status)" :label="cap(props.row.status)" />
            </q-td>
          </q-tr>
        </template>
      </TableCard>

      <DetailDrawer
        v-model="drawerOpen"
        :width="'540px'"
        anchored
        position="right"
        close-on-backdrop
        :loading="detailLoading"
        :preview="roomPreview"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
import { supabase } from '@/utils/supabase'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import DataTable from '@/components/table/DataTable.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import type { DrawerPreview, PreviewChip } from '@/components/ui/DetailDrawer.vue'
import type { StatusTone } from '@/utils/status.config'
import { getInitialsWide as initialsOf } from '@/utils/format'

const loading = ref(true)
const search = ref('')
const currentPage = ref(1)

const activeTab = ref('rooms')
const tabs = [
  { name: 'rooms', label: 'Rooms' },
]

const activeFilters = ref<Record<string, any[]>>({})

const filterConfig = computed(() => {
  const statuses = [...new Set(rooms.value.map((r: any) => r.status).filter(Boolean))].sort()
  return [
    {
      label: 'Status',
      key: 'status',
      options: statuses.map((s: string) => ({ label: cap(s), value: s })),
    },
  ]
})

function clearFilters() {
  activeFilters.value = {}
}
watch(activeFilters, () => {
  currentPage.value = 1
})

const rooms = ref<any[]>([])

const drawerOpen = ref(false)
const detailLoading = ref(false)
const selectedRoom = ref<any | null>(null)
function openRoom(r: any) {
  const raw = r._raw
  selectedRoom.value = raw
  drawerOpen.value = true
  void fetchRoomDetail(raw)
}

async function fetchRoomDetail(raw: any) {
  detailLoading.value = true
  try {
    const { data: room, error } = await supabase
      .from('rooms')
       .select('id, label, room_number, floor, capacity, current_pax, monthly_rent, status, accommodation_id, accommodation:accommodation_id ( name, accommodation_manager:accommodation_manager_id ( full_name ) )')
      .eq('id', raw.id)
      .single()
    if (error) throw error
    if (room) {
      const accommodation = Array.isArray(room.accommodation) ? room.accommodation[0] : room.accommodation
      const accommodationName = accommodation?.name || (typeof raw.accommodation === 'string' ? raw.accommodation : raw.accommodation?.name) || '—'
      const manager = Array.isArray(accommodation?.accommodation_manager) ? accommodation.accommodation_manager[0] : accommodation?.accommodation_manager
      const accommodationManagerName = manager?.full_name || null
      selectedRoom.value = { ...raw, ...room, accommodation: accommodationName, accommodationManager: accommodationManagerName }
    }

    const { data: leases, error: leasesError } = await supabase
      .from('leases')
      .select(
        `id, status, start_date,
         student:users!leases_student_id_fkey(id, full_name, initials, sex)`,
      )
      .eq('room_id', raw.id)
      .in('status', ['active', 'leave_requested'])
    if (!leasesError && leases) {
      const occ = (leases as any[]).map((l) => {
        const student = Array.isArray(l.student) ? l.student[0] : l.student
        const name = student?.full_name || 'Unknown'
        const initials = student?.initials || initialsOf(name)
        return {
          id: l.id,
          name,
          initials,
          gender: student?.sex || null,
          since: l.start_date || null,
          status: l.status,
          statusTone: roomTone(l.status),
        }
      })
      selectedRoom.value = { ...selectedRoom.value, occupants: occ }
    }

    const { data: photos, error: photosError } = await supabase
      .from('room_images')
      .select('id, url, sort_order')
      .eq('room_id', raw.id)
      .order('sort_order', { ascending: true })
    if (!photosError && photos) {
      const imgs = (photos as any[])
        .filter((p) => p.url)
        .map((p) => ({ id: p.id, url: p.url }))
      selectedRoom.value = { ...selectedRoom.value, photos: imgs }
    }
  } catch (e) {
    // keep the raw row already assigned above
  } finally {
    detailLoading.value = false
  }
}
const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=160&background=0F766E&color=fff&bold=true`

function cap(s: string | null | undefined) {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function roomTone(status: string | null | undefined): StatusTone {
  const s = (status || '').toLowerCase()
  if (s.includes('occup')) return 'warning'
  if (s.includes('avail')) return 'success'
  return 'neutral'
}

const columns = [
  { name: 'room', align: 'left', label: 'Room', field: 'name', headerStyle: 'width: 26%' },
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'accommodation', headerStyle: 'width: 20%' },
  { name: 'floor', align: 'left', label: 'Floor', field: 'floor', headerStyle: 'width: 10%' },
  { name: 'capacity', align: 'center', label: 'Capacity', field: 'capacity', headerStyle: 'width: 12%' },
  { name: 'occupants', align: 'center', label: 'Occupants', field: 'occupants', headerStyle: 'width: 12%' },
  { name: 'rent', align: 'left', label: 'Monthly Rent', field: 'rent', headerStyle: 'width: 14%' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerStyle: 'width: 14%' },
]

async function fetchRooms() {
  loading.value = true
  try {
    const [roomsRes, leasesRes] = await Promise.all([
      supabase
        .from('rooms')
        .select(
           'id, label, room_number, floor, capacity, current_pax, monthly_rent, status, accommodation_id, accommodation:accommodation_id ( name, accommodation_manager:accommodation_manager_id ( full_name ) )',
        )
        .order('room_number', { ascending: true }),
      supabase
        .from('leases')
        .select('room_id, student:users!leases_student_id_fkey(full_name)')
        .in('status', ['active', 'leave_requested']),
    ])
    const { data, error } = roomsRes
    if (error) {
      console.error('Error fetching rooms:', error.message)
      return
    }
    const leases = (leasesRes.data || []) as any[]
    const occMap = new Map<string, string[]>()
    for (const l of leases) {
      const student = Array.isArray(l.student) ? l.student[0] : l.student
      const nm = student?.full_name
      if (nm && l.room_id) {
        if (!occMap.has(l.room_id)) occMap.set(l.room_id, [])
        occMap.get(l.room_id)!.push(nm)
      }
    }
    rooms.value = (data || []).map((r: any) => {
      const accommodation = Array.isArray(r.accommodation) ? r.accommodation[0] : r.accommodation
      const accommodationName = accommodation?.name || '—'
      const manager = Array.isArray(accommodation?.accommodation_manager) ? accommodation.accommodation_manager[0] : accommodation?.accommodation_manager
      const accommodationManagerName = manager?.full_name || ''
      const name = r.label || 'Room ' + (r.room_number || '—')
      const initials = name
        .split(/\s+/)
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
      return {
        id: r.id,
        name,
        initials,
        accommodation: accommodationName,
        accommodationId: r.accommodation_id,
        accommodationManager: accommodationManagerName,
        occupantNames: occMap.get(r.id) || [],
        floor: r.floor,
        capacity: r.capacity,
        occupants: r.current_pax,
        rent: r.monthly_rent,
        status: r.status,
        _raw: r,
      }
    })
  } finally {
    loading.value = false
  }
}

const filteredRooms = computed(() => {
  let result = rooms.value
  const f = activeFilters.value
  const statuses = f.status
  if (statuses && statuses.length) {
    result = result.filter((r: any) => statuses.includes(r.status))
  }
  const q = search.value.toLowerCase().trim()
  if (q) {
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.accommodation.toLowerCase().includes(q) ||
        (r.accommodationManager || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q) ||
        r.occupantNames.some((n: string) => n.toLowerCase().includes(q)),
    )
  }
  return result
})
const paginatedRooms = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredRooms.value.slice(start, start + 10)
})
watch(search, () => {
  currentPage.value = 1
})

const roomPreview = computed<DrawerPreview>(() => {
  const r = selectedRoom.value
  if (!r) return { kind: 'room', title: 'Room Preview', name: '', avatar: '' }
  const name = r.label || 'Room ' + (r.room_number || '—')
  const statusTone = roomTone(r.status)
  const chips: PreviewChip[] = [
    { text: cap(r.status) || 'Unknown', tone: statusTone, icon: 'mdi:door' },
    { text: r.floor != null ? `Floor ${r.floor}` : 'No floor', tone: 'neutral', icon: 'mdi:stairs' },
  ]
  const stats = [
    { label: 'Capacity', value: r.capacity ?? '—' },
    { label: 'Occupants', value: r.current_pax ?? 0 },
    { label: 'Monthly Rent', value: r.monthly_rent != null ? `₱${r.monthly_rent.toLocaleString()}` : '—' },
  ]
  const details = [
    { label: 'Room Number', value: r.room_number ? String(r.room_number) : '—' },
    { label: 'Floor', value: r.floor != null ? String(r.floor) : '—' },
    { label: 'Capacity', value: String(r.capacity ?? '—') },
    { label: 'Occupants', value: String(r.current_pax ?? 0) },
    { label: 'Monthly Rent', value: r.monthly_rent != null ? `₱${r.monthly_rent.toLocaleString()}` : '—' },
    { label: 'Status', value: cap(r.status) || '—' },
    { label: 'Accommodation', value: selectedRoom.value?.accommodation || '—' },
    { label: 'Accommodation Manager', value: (selectedRoom.value?.accommodationManager as string) || '—' },
  ]
  return {
    kind: 'room',
    title: 'Room Preview',
    name,
    avatar: avatarUrl(name),
    chips,
    stats,
    details,
    occupants: (r.occupants as any[]) || undefined,
    photos: (r.photos as any[]) || undefined,
  }
})

onMounted(async () => {
  await fetchRooms()
  const rid = route.query.room
  if (rid != null) {
    const found = rooms.value.find((r) => r.id === String(rid))
    if (found) openRoom(found)
    return
  }
  // Arriving from a boarding-history "Rooms Hub" link with only an
  // accommodation id → open the room detail drawer immediately.
  const accQuery = route.query.accommodation
  if (accQuery != null) {
    const accRooms = rooms.value.filter((r: any) => r.accommodationId === String(accQuery))
    if (accRooms.length) openRoom(accRooms[0])
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

.smart-row {
  transition: background-color 0.2s ease;
}
.smart-row:hover {
  background-color: var(--c-surface-2) !important;
}
</style>
