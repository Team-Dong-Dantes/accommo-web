<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">
    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />
    </div>

    <div class="prop-hub-body">
      <TableCard
        v-model:search="search"
        :search-placeholder="'Search room, accommodation, student, or landlord/landlady…'"
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
        row-chevron
        @refresh="fetchRooms"
        @update:page="currentPage = $event"
      >
        <template #body="{ props, rowNumber }">
          <q-tr
            :props="props"
            class="smart-row cursor-pointer"
            @click.stop="openRoom(props.row)"
          >
            <q-td class="row-num-cell">{{ rowNumber }}</q-td>
            <q-td key="room" :props="props" class="col-title">
              <div class="row items-center no-wrap">
                <q-avatar rounded color="teal-6" text-color="white" class="room-thumb text-weight-bold q-mr-md">
                  <img v-if="props.row.image" :src="props.row.image" :alt="props.row.name" />
                  <template v-else>{{ props.row.initials }}</template>
                </q-avatar>
                <div class="column" style="min-width: 0;">
                  <div class="cell-main ellipsis">{{ props.row.type }}</div>
                  <div class="cell-sub ellipsis">{{ props.row.name }}</div>
                  <div class="cell-sub ellipsis">{{ props.row.floor != null ? `Floor ${props.row.floor}` : 'No floor' }}</div>
                </div>
              </div>
            </q-td>
            <q-td key="accommodation" :props="props" class="col-person">
              <div class="column">
                <div class="cell-main ellipsis">{{ props.row.accommodation }}</div>
                <div class="cell-sub ellipsis">{{ props.row.landlord || '—' }}</div>
              </div>
            </q-td>
            <q-td key="boarders" :props="props" class="num-cell col-occupants col-split">
              <span class="text-ink text-weight-bold" style="font-size: 13px;">{{ props.row.occupants }}/{{ props.row.capacity ?? '—' }}</span>
            </q-td>
            <q-td key="rent" :props="props" class="col-rent num-right">
              <span class="rent-cell">
                <span class="text-ink text-weight-bold">{{ props.row.rent != null ? amount(props.row.rent) : '—' }}</span>
                <span class="rent-basis"><Icon :icon="props.row.perBoarder ? 'lucide:user' : 'lucide:door-closed'" width="12" height="12" />{{ props.row.perBoarder ? 'per boarder' : 'whole room' }}</span>
              </span>
            </q-td>
            <q-td key="status" :props="props" class="col-badge">
              <BadgePill :tone="getStatus(props.row.status).tone" :icon="getStatus(props.row.status).icon ?? 'lucide:circle'" :label="cap(props.row.status)" />
            </q-td>
          </q-tr>
        </template>
      </TableCard>

      <DetailDrawer
        v-model="drawerOpen"
        size="full"
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
import BadgePill from '@/components/user/BadgePill.vue'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import type { DrawerPreview, PreviewChip } from '@/components/ui/DetailDrawer.vue'
import { getStatus, getTone } from '@/utils/status.config'
import { resolveAsset } from '@/utils/cloudinaryUrl'
import { counted } from '@/utils/filterOptions'
import { avatarUrl, cap, getInitialsWide as initialsOf, humanizeEnum, landlordTitle } from '@/utils/format'
import { facilityIcon, facilityLabel } from '@/utils/facilities'

/** A room row as the rooms query returns it, before mapping to a table row. */
interface RoomQueryRow {
  id: string
  label: string | null
  room_number: string | null
  room_type: string | null
  custom_room_type: string | null
  floor: number | null
  capacity: number | null
  current_pax: number | null
  monthly_rent: number | null
  rent_basis: string | null
  status: string | null
  accommodation_id: string | null
  accommodation?: unknown
  room_images?: { url: string | null; sort_order: number | null }[]
}

/** One row of the Room Hub table; `_raw` is the query row the drawer reopens. */
interface RoomTableRow {
  id: string
  name: string
  initials: string
  image: string
  type: string
  accommodation: string
  accommodationId: string | null
  landlord: string
  occupantNames: string[]
  floor: number | null
  capacity: number | null
  occupants: number
  rent: number | null
  perBoarder: boolean
  status: string | null
  // Filter buckets derived from the fields above.
  vacancy: 'empty' | 'partial' | 'full'
  floorKey: string
  rentBand: string
  rentBasis: 'boarder' | 'room'
  _raw: RoomQueryRow
}

const loading = ref(true)
const search = ref('')
const currentPage = ref(1)

const activeTab = ref('rooms')
const tabs = [
  { name: 'rooms', label: 'Rooms' },
]

const activeFilters = ref<Record<string, any[]>>({})

const VACANCY: Record<string, string> = { empty: 'Empty', partial: 'Has free beds', full: 'Full' }
const RENT_BASIS: Record<string, string> = { boarder: 'Per boarder', room: 'Whole room' }
const RENT_BAND: Record<string, string> = { low: 'Below 2,000', mid: '2,000 – 2,999', high: '3,000 and up' }
const TYPE_ORDER = ['Solo', 'Duo', 'Triple', 'Bedspace']

// Option values are row fields' values; a row stays when its field equals any
// chosen value. Each option shows how many rooms it would leave.
const filterConfig = computed(() => {
  const rows = rooms.value
  return [
    { label: 'Status', key: 'status', options: counted(rows, 'status', cap, ['available', 'occupied', 'maintenance']) },
    { label: 'Vacancy', key: 'vacancy', options: counted(rows, 'vacancy', (v) => VACANCY[v] ?? v, Object.keys(VACANCY)) },
    { label: 'Accommodation', key: 'accommodation', options: counted(rows, 'accommodation') },
    { label: 'Room type', key: 'type', options: counted(rows, 'type', undefined, TYPE_ORDER) },
    { label: 'Floor', key: 'floorKey', options: counted(rows, 'floorKey', (v) => `Floor ${v}`) },
    { label: 'Rent', key: 'rentBand', options: counted(rows, 'rentBand', (v) => RENT_BAND[v] ?? v, Object.keys(RENT_BAND)) },
    { label: 'Rent basis', key: 'rentBasis', options: counted(rows, 'rentBasis', (v) => RENT_BASIS[v] ?? v, Object.keys(RENT_BASIS)) },
  ]
})
type FilterKey = 'status' | 'vacancy' | 'accommodation' | 'type' | 'floorKey' | 'rentBand' | 'rentBasis'

function clearFilters() {
  activeFilters.value = {}
}
watch(activeFilters, () => {
  currentPage.value = 1
})

const rooms = ref<RoomTableRow[]>([])

const drawerOpen = ref(false)
const detailLoading = ref(false)
const selectedRoom = ref<any | null>(null)
function openRoom(r: RoomTableRow) {
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
       .select('id, label, room_number, room_type, custom_room_type, floor, capacity, current_pax, monthly_rent, advance_months, deposit_months, rent_basis, status, accommodation_id, accommodation:accommodation_id ( name, landlord:landlord_id ( id, full_name, sex, phone, initials, avatar_url ) )')
      .eq('id', raw.id)
      .single()
    if (error) throw error
    if (room) {
      const accommodation = Array.isArray(room.accommodation) ? room.accommodation[0] : room.accommodation
      const accommodationName = accommodation?.name || (typeof raw.accommodation === 'string' ? raw.accommodation : raw.accommodation?.name) || '—'
      const manager = Array.isArray(accommodation?.landlord) ? accommodation.landlord[0] : accommodation?.landlord
      const landlordName = manager?.full_name || null
      selectedRoom.value = { ...raw, ...room, accommodation: accommodationName, landlord: landlordName, landlordInfo: manager ?? null }
    }

    const { data: leases, error: leasesError } = await supabase
      .from('leases')
      .select(
        `id, status, start_date,
         student:users!leases_student_id_fkey(id, full_name, initials, sex, avatar_url)`,
      )
      .eq('room_id', raw.id)
      .in('status', ['active', 'leave_requested'])
    if (!leasesError && leases) {
      const occ = (leases as any[]).map((l) => {
        const student = Array.isArray(l.student) ? l.student[0] : l.student
        const name = student?.full_name || 'Unknown'
        const initials = student?.initials || initialsOf(name)
        // The student's own id, so the record can open their profile; users.sex
        // is stored as M/F, which the drawer reads as male/female.
        const sex = String(student?.sex ?? '').toUpperCase()
        return {
          id: student?.id || l.id,
          name,
          initials,
          avatarUrl: student?.avatar_url || '',
          gender: sex === 'F' ? 'female' : sex === 'M' ? 'male' : null,
          since: l.start_date || null,
          status: l.status,
          statusTone: getTone(l.status),
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

    // This room's own facilities — its private bathroom or balcony. The scope
    // filter is belt and braces: accommodation_facilities already constrains a
    // private row to carry a room_id and a shared one not to.
    const { data: facilities, error: facilitiesError } = await supabase
      .from('accommodation_facilities')
      .select('id, facility_type, label, description, floor, sort_order')
      .eq('room_id', raw.id)
      .eq('access_scope', 'private')
      .order('sort_order', { ascending: true })
    if (!facilitiesError) {
      const facilityIds = (facilities ?? []).map((f: any) => f.id)
      const countById = new Map<string, number>()
      if (facilityIds.length) {
        const { data: facImgs } = await supabase
          .from('accommodation_facility_images')
          .select('facility_id')
          .in('facility_id', facilityIds)
        for (const fi of (facImgs ?? []) as any[]) {
          countById.set(fi.facility_id, (countById.get(fi.facility_id) ?? 0) + 1)
        }
      }
      selectedRoom.value = {
        ...selectedRoom.value,
        facilities: (facilities ?? []).map((f: any) => ({
          id: f.id,
          type: f.facility_type ?? 'other',
          label: facilityLabel(f.facility_type, f.label),
          icon: facilityIcon(f.facility_type),
          description: f.description ?? '',
          floor: f.floor ?? null,
          photoCount: countById.get(f.id) ?? 0,
        })),
      }
    }
  } catch {
    // keep the raw row already assigned above
  } finally {
    detailLoading.value = false
  }
}
function roomTypeName(r: RoomQueryRow): string {
  return r.custom_room_type || (r.room_type ? cap(String(r.room_type).replace('_', ' ')) : '')
}
// Number/label tells two rooms of the same type apart; the type is the fallback.
function roomName(r: RoomQueryRow): string {
  return r.label || (r.room_number ? `Room ${r.room_number}` : roomTypeName(r) || 'Room')
}
const amount = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const peso = (n: number) => `₱${amount(n)}`

// Same column classes as the Accommodation Hub, so the two tables read alike.
const columns = [
  { name: 'room', align: 'left', label: 'Room', field: 'name', headerClasses: 'col-title' },
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'accommodation', headerClasses: 'col-person' },
  { name: 'boarders', align: 'center', label: 'Boarders / Beds', field: 'occupants', headerClasses: 'num-cell col-occupants col-split' },
  { name: 'rent', align: 'right', label: 'Monthly Rent', field: 'rent', headerClasses: 'col-rent num-right' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerClasses: 'col-badge' },
]

async function fetchRooms() {
  loading.value = true
  try {
    const [roomsRes, leasesRes] = await Promise.all([
      supabase
        .from('rooms')
        .select(
           'id, label, room_number, room_type, custom_room_type, floor, capacity, current_pax, monthly_rent, rent_basis, status, accommodation_id, room_images ( url, sort_order ), accommodation:accommodation_id ( name, landlord:landlord_id ( full_name ) )',
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
      if (student && l.room_id) {
        if (!occMap.has(l.room_id)) occMap.set(l.room_id, [])
        occMap.get(l.room_id)!.push(student.full_name ?? '')
      }
    }
    rooms.value = (data || []).map((r: RoomQueryRow) => {
      const accommodation = Array.isArray(r.accommodation) ? r.accommodation[0] : r.accommodation
      const accommodationName = accommodation?.name || '—'
      const manager = Array.isArray(accommodation?.landlord) ? accommodation.landlord[0] : accommodation?.landlord
      const landlordName = manager?.full_name || ''
      const occ = occMap.get(r.id) || []
      // Same rule as the mobile listings: a one-person room is always whole-room.
      const perBoarder = r.rent_basis === 'person' && (r.capacity ?? 0) > 1
      const name = roomName(r)
      const cover = [...(r.room_images ?? [])]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .find((im) => im.url)?.url
      return {
        id: r.id,
        name,
        initials: initialsOf(name),
        image: resolveAsset(cover),
        type: roomTypeName(r) || 'Room',
        accommodation: accommodationName,
        accommodationId: r.accommodation_id,
        landlord: landlordName,
        occupantNames: occ.filter(Boolean),
        floor: r.floor,
        capacity: r.capacity,
        occupants: occ.length,
        rent: r.monthly_rent,
        perBoarder,
        status: r.status,
        vacancy: occ.length === 0 ? 'empty' : occ.length >= (r.capacity ?? 0) ? 'full' : 'partial',
        floorKey: r.floor != null ? String(r.floor) : '',
        rentBand: r.monthly_rent == null ? '' : r.monthly_rent < 2000 ? 'low' : r.monthly_rent < 3000 ? 'mid' : 'high',
        rentBasis: perBoarder ? 'boarder' : 'room',
        _raw: r,
      }
    })
    // Rooms of one accommodation sit together, in room-number order.
    rooms.value.sort((a, b) =>
      a.accommodation.localeCompare(b.accommodation) ||
      a.name.localeCompare(b.name, undefined, { numeric: true }))
  } finally {
    loading.value = false
  }
}

const filteredRooms = computed(() => {
  let result = rooms.value
  const f = activeFilters.value
  for (const [key, values] of Object.entries(f)) {
    if (values?.length) result = result.filter((r) => values.includes(String(r[key as FilterKey] ?? '')))
  }
  const q = search.value.toLowerCase().trim()
  if (q) {
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        String(r._raw?.room_number || '').toLowerCase().includes(q) ||
        r.accommodation.toLowerCase().includes(q) ||
        (r.landlord || '').toLowerCase().includes(q) ||
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
  const name = roomTypeName(r) || roomName(r)
  const statusTone = getTone(r.status)
  const chips: PreviewChip[] = [
    { text: cap(r.status) || 'Unknown', tone: statusTone, icon: 'lucide:door-closed' },
    { text: r.floor != null ? `Floor ${r.floor}` : 'No floor', tone: 'neutral', icon: 'lucide:layers' },
  ]
  const detailGroups = [
    {
      title: 'Room',
      icon: 'lucide:door-open',
      rows: [
        { label: 'Room Type', value: r.custom_room_type || (r.room_type ? cap(String(r.room_type).replace('_', ' ')) : '—') },
        { label: 'Room Number', value: r.room_number ? String(r.room_number) : '—' },
        { label: 'Label', value: r.label || '—' },
        { label: 'Floor', value: r.floor != null ? String(r.floor) : '—' },
        { label: 'Capacity', value: String(r.capacity ?? '—') },
        { label: 'Occupants', value: String(r.current_pax ?? 0) },
      ],
    },
    {
      title: 'Terms',
      icon: 'lucide:banknote',
      rows: [
        { label: 'Monthly Rent', value: r.monthly_rent != null ? `${peso(r.monthly_rent)} ${r.rent_basis === 'person' && (r.capacity ?? 0) > 1 ? 'per boarder' : 'whole room'}` : '—' },
        { label: 'Status', value: cap(r.status) || '—' },
      ],
    },
    {
      title: 'Belongs to',
      icon: 'lucide:building-2',
      rows: [
        { label: 'Accommodation', value: selectedRoom.value?.accommodation || '—' },
        { label: 'Landlord/Landlady', value: (selectedRoom.value?.landlord as string) || '—' },
      ],
    },
  ]
  const landlord = r.landlordInfo as { id: string; full_name: string | null; sex: string | null; phone: string | null; initials: string | null; avatar_url: string | null } | null | undefined
  const firstPhoto = ((r.photos as { url: string }[] | undefined) ?? [])[0]?.url ?? ''
  return {
    kind: 'room',
    title: 'Room Preview',
    name,
    roomOverview: {
      coverUrl: firstPhoto,
      title: r.room_number ? `Room ${r.room_number}` : r.label || name,
      typeLabel: r.custom_room_type || humanizeEnum(r.room_type) || 'Room',
      accommodation: { id: r.accommodation_id ?? r.accommodationId ?? '', name: r.accommodation || '—' },
      floor: r.floor ?? null,
      capacity: r.capacity ?? 0,
      status: String(r.status ?? ''),
      statusLabel: cap(r.status) || 'Unknown',
      rent: r.monthly_rent ?? r.rent ?? null,
      rentBasis: r.rent_basis === 'person' && (r.capacity ?? 0) > 1 ? 'person' : 'room',
      advanceMonths: r.advance_months ?? null,
      depositMonths: r.deposit_months ?? null,
      landlord: landlord
        ? {
            id: landlord.id,
            name: landlord.full_name || '—',
            title: landlordTitle(landlord.sex),
            contact: landlord.phone || '',
            initials: landlord.initials || initialsOf(landlord.full_name || '?'),
            avatarUrl: landlord.avatar_url || undefined,
          }
        : null,
    },
    avatar: avatarUrl(name),
    chips,
    detailGroups,
    occupants: (r.occupants as any[]) || undefined,
    photos: (r.photos as any[]) || undefined,
    // Always an array once the detail has loaded, so the tab shows its empty
    // state for a bedspace room rather than vanishing.
    facilities: (r.facilities as any[]) ?? [],
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
    const accRooms = rooms.value.filter((r) => r.accommodationId === String(accQuery))
    const first = accRooms[0]
    if (first) openRoom(first)
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
  background-color: var(--c-primary-soft) !important;
}

/* Text sizes match UserInfoCell (15px / 12px at 1440px), so these cells read
   like the Accommodation Hub's. The thumbnail is its 48px avatar. */
.cell-main { font-size: calc(1.875 * var(--ut)); line-height: 1.2; font-weight: 700; color: var(--c-ink); }
.cell-sub { font-size: calc(1.5 * var(--ut)); color: var(--c-muted); margin-top: 2px; }
.room-thumb { font-size: calc(6 * var(--ut)); }
.room-thumb :deep(.q-avatar__content) { font-size: calc(2.25 * var(--ut)); }

/* Figures right-aligned so their digits line up down the column. The cells
   are flex boxes (DataTable.vue), hence justify-content, not text-align alone. */
.prop-hub-body :deep(thead th.num-right),
.prop-hub-body :deep(tbody td.num-right) { justify-content: flex-end; text-align: right; }

.rent-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}
.rent-basis {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-muted);
}

/* Wide enough for "₱10,000.00" on one line. */
.prop-hub-body :deep(thead th.col-rent),
.prop-hub-body :deep(tbody td.col-rent) { flex: 0 1 120px !important; }
</style>
