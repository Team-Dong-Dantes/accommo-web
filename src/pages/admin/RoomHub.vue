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
        v-model:sort="sort"
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
                <q-avatar rounded class="room-thumb q-mr-md">
                  <img v-if="props.row.image" :src="props.row.image" :alt="props.row.name" />
                  <PhotoEmpty v-else />
                </q-avatar>
                <div class="column" style="min-width: 0;">
                  <div class="cell-main ellipsis">{{ props.row.type }}</div>
                  <div class="cell-sub ellipsis">{{ props.row.name }}</div>
                </div>
              </div>
            </q-td>
            <q-td key="floor" :props="props" class="num-cell col-num-wide text-ink">{{ props.row.floor ?? '—' }}</q-td>
            <q-td key="accommodation" :props="props" class="col-person">
              <div class="column">
                <div class="cell-main ellipsis">{{ props.row.accommodation }}</div>
                <div class="cell-sub ellipsis">{{ props.row.landlord || '—' }}</div>
              </div>
            </q-td>
            <q-td key="boarders" :props="props" class="num-cell col-occupants col-split">
              <span class="occupants-cell">
                <span class="text-ink text-weight-bold">{{ props.row.occupants }}</span>
                <span class="gender-split">
                  <span class="gender-figure is-male"><Icon icon="lucide:mars" width="12" height="12" />{{ props.row.maleCount }}</span>
                  <span class="gender-figure is-female"><Icon icon="lucide:venus" width="12" height="12" />{{ props.row.femaleCount }}</span>
                </span>
              </span>
            </q-td>
            <q-td key="beds" :props="props" class="num-cell col-num-wide text-ink">
              <span class="beds-cell">
                <Icon icon="lucide:bed-single" width="13" height="13" />{{ props.row.capacity ?? '—' }}
              </span>
            </q-td>
            <q-td key="rent" :props="props" class="col-rent num-right">
              <span class="rent-cell">
                <span class="text-ink text-weight-bold">{{ props.row.rent != null ? pesoWhole(props.row.rent) : '—' }}</span>
                <span class="rent-basis"><Icon :icon="props.row.perBoarder ? 'lucide:user' : 'lucide:door-closed'" width="12" height="12" />{{ props.row.perBoarder ? 'per boarder' : 'whole room' }}</span>
              </span>
            </q-td>
            <q-td v-for="u in UTILITIES" :key="u.key" :props="props" class="col-utility">
              <span class="util-cell">
                <span class="text-ink text-weight-bold">{{ props.row.utilities[u.key].terms }}</span>
                <span v-if="props.row.utilities[u.key].bill" class="util-bill" :class="`util-bill--${props.row.utilities[u.key].tone}`">
                  <Icon :icon="TONE_ICON[props.row.utilities[u.key].tone]" width="12" height="12" />{{ props.row.utilities[u.key].bill }}
                </span>
              </span>
            </q-td>
            <q-td key="status" :props="props" class="col-badge-wide">
              <BadgePill :tone="getStatus(props.row.status).tone" :icon="getStatus(props.row.status).icon ?? 'lucide:circle'" :label="roomStatusLabel(props.row.status)" />
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
import { useSort } from '@/composables/useSort'
import { useRooms, type RoomTableRow } from '@/composables/useRooms'
import { useRoomRecord } from '@/composables/useRoomRecord'
import { useRoute } from 'vue-router'
import TabNav from '@/components/ui/TabNav.vue'
import PhotoEmpty from '@/components/ui/PhotoEmpty.vue'
import TableCard from '@/components/table/TableCard.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import { getStatus } from '@/utils/status.config'
import { counted } from '@/utils/filterOptions'
import { pesoWhole, roomStatusLabel } from '@/utils/format'
import { UTILITIES } from '@/utils/facilities'
import type { UtilityStatus } from '@/utils/facilities'

const route = useRoute()
const { loading, rooms, fetchRooms } = useRooms()
const { drawerOpen, detailLoading, openRoom, roomPreview } = useRoomRecord()
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
    { label: 'Status', key: 'status', options: counted(rows, 'status', roomStatusLabel, ['available', 'occupied', 'maintenance']) },
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



const TONE_ICON: Record<string, string> = { muted: 'lucide:clock', ok: 'lucide:check', warn: 'lucide:receipt', bad: 'lucide:triangle-alert' }
const TONE_RANK: Record<UtilityStatus['tone'], number> = { bad: 0, warn: 1, muted: 2, ok: 3 }


// Same column classes as the Accommodation Hub, so the two tables read alike.
const columns = [
  { name: 'room', align: 'left', label: 'Room', field: 'name', headerClasses: 'col-title' },
  { name: 'floor', align: 'center', label: 'Floor', field: 'floor', headerClasses: 'num-cell col-num-wide' },
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'accommodation', headerClasses: 'col-person' },
  { name: 'boarders', align: 'center', label: 'Boarders', field: 'occupants', headerClasses: 'num-cell col-occupants col-split' },
  { name: 'beds', align: 'center', label: 'Beds', field: 'capacity', headerClasses: 'num-cell col-num-wide' },
  { name: 'rent', align: 'right', label: 'Monthly Rent', field: 'rent', headerClasses: 'col-rent num-right' },
  // Sorting a utility column brings the rooms that need attention up first.
  ...UTILITIES.map((u) => ({
    name: u.key,
    align: 'left',
    label: u.label,
    field: (r: RoomTableRow) => r.utilities[u.key].terms,
    sortValue: (r: RoomTableRow) => TONE_RANK[r.utilities[u.key].tone],
    headerClasses: 'col-utility',
  })),
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerClasses: 'col-badge-wide' },
]


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
const { sort, sorted: sortedRooms } = useSort(() => filteredRooms.value, () => columns)
const paginatedRooms = computed(() => {
  const start = (currentPage.value - 1) * 10
  return sortedRooms.value.slice(start, start + 10)
})
watch([search, sort], () => {
  currentPage.value = 1
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

/* Figures right-aligned so their digits line up down the column. The cells
   are flex boxes (DataTable.vue), hence justify-content, not text-align alone. */
.prop-hub-body :deep(thead th.num-right),
.prop-hub-body :deep(tbody td.num-right) { justify-content: flex-end; text-align: right; }

/* Same boarder count + mars/venus split as the Accommodation Hub (PropertyHub.vue). */
.occupants-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  font-size: 13px;
}
.gender-split { display: inline-flex; gap: 6px; }
.gender-figure {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  font-size: 11px;
  font-weight: 600;
}
.gender-figure.is-male { color: #42a5f5; }
.gender-figure.is-female { color: #e91e63; }
.beds-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--c-ink);
}
.beds-cell .iconify { color: var(--c-muted); }

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

/* Utility terms over where this month's bill stands. */
.util-cell { display: inline-flex; flex-direction: column; gap: 1px; min-width: 0; font-size: 13px; }
.util-bill { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: var(--c-muted); white-space: nowrap; }
.util-bill--ok { color: var(--c-success); }
.util-bill--warn { color: var(--c-warning); }
.util-bill--bad { color: var(--c-danger); }
.prop-hub-body :deep(thead th.col-utility),
.prop-hub-body :deep(tbody td.col-utility) { flex: 1 1 130px !important; min-width: 0; }

/* Wide enough for "₱10,000" on one line. */
.prop-hub-body :deep(thead th.col-rent),
.prop-hub-body :deep(tbody td.col-rent) { flex: 0 1 120px !important; }
</style>
