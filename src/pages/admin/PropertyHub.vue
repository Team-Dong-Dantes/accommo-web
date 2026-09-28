<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <q-btn
        unelevated
        color="teal-7"
        no-caps
        class="text-weight-bold rounded-button q-mb-md"
        @click="reportOpen = true"
      >
        <Icon icon="lucide:file-chart-column" class="on-left" width="18" height="18" />Report
      </q-btn>
    </div>

    <div class="prop-hub-body">
      <TableCard
        v-model:search="search"
        v-model:active-filters="activeFilters"
        v-model:page="currentPage"
        :search-placeholder="'Search accommodation, landlord/landlady, or address…'"
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
            <DataTable :rows="paginatedAccommodations" :columns="overviewColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="(currentPage - 1) * 10" row-chevron>
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="lucide:map-pin-house" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No accommodations yet</div>
                  <div>Listed accommodations will appear here.</div>
                </div>
              </template>
              <template #body="{ props, rowNumber }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click.stop="openAccommodation(props.row)">
                  <q-td class="row-num-cell">{{ rowNumber }}</q-td>
                  <q-td key="accommodation" :props="props" class="col-title">
                    <UserInfoCell rounded :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :avatar-url="props.row.image" :subtitle="props.row.address" />
                  </q-td>
                  <q-td key="landlord" :props="props" class="col-person">
                    <UserInfoCell :initials="props.row.landlordInitials" :name="props.row.landlord" :avatar-color="'indigo-5'" :avatar-url="props.row.landlordAvatarUrl" :subtitle="props.row.contact" />
                  </q-td>
                  <q-td key="rooms" :props="props" class="num-cell col-num-wide col-split text-ink">
                    <span class="rooms-cell">
                      <Icon icon="lucide:door-closed" width="13" height="13" />{{ props.row.totalRooms }}
                    </span>
                  </q-td>
                  <q-td key="floors" :props="props" class="num-cell col-num-wide text-ink">
                    <span class="rooms-cell">
                      <Icon icon="lucide:layers" width="13" height="13" />{{ props.row.floors || '—' }}
                    </span>
                  </q-td>
                  <q-td key="occupants" :props="props" class="num-cell col-occupants">
                    <span class="occupants-cell">
                      <span class="text-ink text-weight-bold">{{ props.row.totalStudents }}</span>
                      <span class="gender-split">
                        <span class="gender-figure is-male"><Icon icon="lucide:mars" width="12" height="12" />{{ props.row.maleCount }}</span>
                        <span class="gender-figure is-female"><Icon icon="lucide:venus" width="12" height="12" />{{ props.row.femaleCount }}</span>
                      </span>
                    </span>
                  </q-td>
                  <q-td key="status" :props="props" class="col-badge">
                    <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.statusLabel" />
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- COMPLIANCE (one row per house; a capsule per required permit) -->
          <q-tab-panel name="compliance" class="q-pa-none">
            <DataTable :rows="paginatedAccommodations" :columns="complianceColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="(currentPage - 1) * 10" row-chevron>
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="lucide:file-check" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No accommodations yet</div>
                  <div>Permit compliance appears once documents are uploaded.</div>
                </div>
              </template>
              <template #body="{ props, rowNumber }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click.stop="openAccommodation(props.row)">
                  <q-td class="row-num-cell">{{ rowNumber }}</q-td>
                  <q-td key="accommodation" :props="props" class="col-title">
                    <UserInfoCell rounded :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :avatar-url="props.row.image" :subtitle="props.row.address" />
                  </q-td>
                  <q-td v-for="(perm, i) in requiredPermits" :key="perm" :props="props" class="col-badge text-center" :class="{ 'col-split': i === 0 }">
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
            <DataTable :rows="paginatedAccommodations" :columns="performanceColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="(currentPage - 1) * 10" row-chevron>
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="lucide:chart-column" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">No performance data</div>
                  <div>Ratings aren't populated yet.</div>
                </div>
              </template>
              <template #body="{ props, rowNumber }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click.stop="openAccommodation(props.row)">
                  <q-td class="row-num-cell">{{ rowNumber }}</q-td>
                  <q-td key="accommodation" :props="props" class="col-title">
                    <UserInfoCell rounded :initials="props.row.initials" :name="props.row.name" :avatar-color="'teal-6'" :avatar-url="props.row.image" :subtitle="props.row.address" />
                  </q-td>
                  <q-td key="landlord" :props="props" class="col-person">
                    <UserInfoCell :initials="props.row.landlordInitials" :name="props.row.landlord" :avatar-color="'indigo-5'" :avatar-url="props.row.landlordAvatarUrl" :subtitle="props.row.contact" />
                  </q-td>
                  <q-td key="rating" :props="props" class="col-num-wide col-split text-ink" style="font-size: 13px;">
                    <span class="text-orange-5 text-weight-bold row items-center no-wrap">
                      <Icon icon="lucide:star" width="14" height="14" class="q-mr-xs" /> {{ props.row.rating }}
                    </span>
                  </q-td>
                  <q-td key="response" :props="props" class="col-num-wide text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.responseRate != null ? `${props.row.responseRate}%` : '—' }}</q-td>
                  <q-td key="occupancy" :props="props" class="num-cell col-badge text-ink text-weight-medium" style="font-size: 13px;">
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
      size="full"
      close-on-backdrop
      :loading="detailLoading"
        :preview="accommodationPreview"
      :management-actions="accommodationActions"
      @manage="onManageAccommodation"
    />

    </div><!-- /prop-hub-body -->

    <ReportDialog
      v-model="reportOpen"
      :reports="['masterlist', 'renewals', 'occupancy']"
      :initial="reportInitial"
      :accommodations="reportRows"
      :scope-note="reportScope"
    />
    <ReportDialog
      v-model="statusReportOpen"
      :reports="['status']"
      :preview="accommodationPreview"
      :record-id="selectedAccommodation?.id"
    />
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
import { getStatus } from '@/utils/status.config'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { humanizeEnum } from '@/utils/format'
import ReportDialog from '@/features/reports/ReportDialog.vue'
import type { ReportId } from '@/features/reports/reports'
import { PERMIT_STATE, REQUIRED_PERMITS, requiredPermitState, type PermitState } from '@/utils/permitExpiry'
import { useAccommodations } from '@/composables/useAccommodations'
import { useAccommodationRecord, toRecordRow } from '@/composables/useAccommodationRecord'

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
// 'Boarding House' built from 'boarding_house', so the filter matched nothing.
// The column is now constrained to boarding_house / residence / dormitory
// (see the accommodation-type migration), but deriving still beats a second
// hardcoded copy of that list here. Same pattern as AuditLogs.vue's computed
// filterConfig.
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

// Report: opens on the one matching the tab, over the rows the hub is showing,
// so the hub's own filters carry into it and the report says so on the page.
const reportOpen = ref(false)
// The open record's own Status report, in the same report window.
const statusReportOpen = ref(false)
const reportInitial = computed<ReportId>(() =>
  activeTab.value === 'compliance' ? 'renewals' : activeTab.value === 'performance' ? 'occupancy' : 'masterlist')
// The composable's own rows (the report reads its fields), limited to what the hub shows.
const reportRows = computed(() => {
  const shown = new Set(filteredAccommodations.value.map((a) => a.id))
  return realAccommodations.value.filter((a) => shown.has(a.id))
})
const reportScope = computed(() => {
  const f = activeFilters.value
  const parts = [
    f.status?.length ? `status ${f.status.join(', ')}` : '',
    f.type?.length ? `type ${f.type.join(', ')}` : '',
    search.value ? `matching "${search.value}"` : '',
  ].filter(Boolean)
  return parts.length ? `Filtered in the Accommodation Hub: ${parts.join('; ')}` : undefined
})

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
 * OSAS pulling an accredited property is a different act from the landlord/landlady
 * delisting their own, and from a refusal at accreditation — so it gets its own
 * status rather than another meaning loaded onto `rejected`. Same shape as the
 * account actions in Users.vue.
 */
const accommodationActions = computed<ManagementAction[]>(() => {
  const a = selectedAccommodation.value
  if (!a) return []
  const status = String(a.status || '').toLowerCase()
  const actions: ManagementAction[] = [{ label: 'Status report', action: 'export' }]
  if (status === 'accredited') {
    actions.push(
      a.hiddenFromListings
        ? { label: 'Show in listings', action: 'unhide' }
        : { label: 'Hide from listings', action: 'hide' },
      { label: 'Suspend accreditation', action: 'suspend', danger: true },
    )
  }
  if (status === 'suspended') actions.push({ label: 'Restore accreditation', action: 'restore' })
  return actions
})

/**
 * Hiding takes an accredited property out of what students browse without
 * touching its accreditation — current boarders still see their own stay. Only
 * an admin can flip the flag; a trigger on `accommodations` enforces that.
 */
async function setHidden(a: any, hidden: boolean) {
  if (hidden && !window.confirm(`Hide ${a.name} from student listings? Its current boarders are not affected.`)) return
  const { error } = await supabase
    .from('accommodations')
    .update({ hidden_from_listings: hidden } as never)
    .eq('id', a.id)
  if (error) {
    notify.error('Could not change whether it is listed', error.message)
    return
  }
  selectedAccommodation.value = { ...a, hiddenFromListings: hidden }
  const row = realAccommodations.value.find((r) => r.id === a.id)
  if (row) row.hiddenFromListings = hidden

  const actorId = (await supabase.auth.getUser()).data.user?.id || null
  const { error: auditErr } = await supabase.from('audit_logs').insert({
    action: hidden ? 'accommodation.hide' : 'accommodation.unhide',
    actor_id: actorId,
    entity_id: a.id,
    entity_type: 'accommodation',
    before_json: { hidden_from_listings: !hidden },
    after_json: { hidden_from_listings: hidden },
  } as never)
  if (auditErr) notify.warning('Change not recorded in the audit log', auditErr.message)

  notify.success(hidden ? 'Hidden from student listings.' : 'Shown in student listings again.')
  void loadAccommodationEvents(a.id)
}

async function onManageAccommodation(action: string) {
  const a = selectedAccommodation.value
  if (!a?.id) return
  if (action === 'export') {
    statusReportOpen.value = true
    return
  }
  if (action === 'hide' || action === 'unhide') {
    await setHidden(a, action === 'hide')
    return
  }
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

// Male and Female sit beside Total rather than under it, so a reviewer can scan
// one column down the page. That costs width, hence the tighter percentages on
// the two identity columns — both already truncate with an ellipsis.
const overviewColumns = [
  // Only Accommodation is left flexible, so it takes every pixel the sized
  // columns do not. See the column-sizing block in DataTable.vue.
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'name', headerClasses: 'col-title' },
  { name: 'landlord', align: 'left', label: 'Landlord/Landlady', field: 'landlord', headerClasses: 'col-person' },
  { name: 'rooms', align: 'center', label: 'No. of Rooms', field: 'totalRooms', headerClasses: 'num-cell col-num-wide col-split' },
  { name: 'floors', align: 'center', label: 'No. of Stories', field: 'floors', headerClasses: 'num-cell col-num-wide' },
  // Total, Male and Female used to be three separate columns of plain digits.
  // One column now: the total leads, with a male/female breakdown in the same
  // mars/venus icon + colour pairing PropertyDetail.vue already uses for this
  // accommodation's gender split, so the table and its own detail drawer read
  // as the same visual language rather than two different ones.
  { name: 'occupants', align: 'center', label: 'Boarders', field: 'totalStudents', headerClasses: 'num-cell col-occupants' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerClasses: 'col-badge' },
]

const complianceColumns = [
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'name', headerClasses: 'col-title' },
  { name: 'fire', align: 'center', label: 'Fire Permit', field: 'fire', headerClasses: 'col-badge col-split' },
  { name: 'business', align: 'center', label: 'Business Permit', field: 'business', headerClasses: 'col-badge' },
  { name: 'sanitary', align: 'center', label: 'Sanitary Permit', field: 'sanitary', headerClasses: 'col-badge' },
  { name: 'building', align: 'center', label: 'Building Permit', field: 'building', headerClasses: 'col-badge' },
]

const performanceColumns = [
  // Sized rather than flexible: this column carries an avatar, the name and the
  // phone number underneath it.
  { name: 'accommodation', align: 'left', label: 'Accommodation', field: 'name', headerClasses: 'col-title' },
  { name: 'landlord', align: 'left', label: 'Landlord/Landlady', field: 'landlord', headerClasses: 'col-person' },
  { name: 'rating', align: 'left', label: 'Rating', field: 'rating', headerClasses: 'col-num-wide col-split' },
  { name: 'response', align: 'left', label: 'Response', field: 'responseRate', headerClasses: 'col-num-wide' },
  { name: 'occupancy', align: 'center', label: 'Occupancy', field: 'totalStudents', headerClasses: 'num-cell col-badge' },
]

// Map real Supabase accommodations straight through; the mapping is shared with
// the Map View so both open the same record.
const accommodations = computed(() => realAccommodations.value.map(toRecordRow))

// The required permits, one Compliance column each; the list and the matching
// live in utils/permitExpiry, shared with the renewal report.
const requiredPermits = REQUIRED_PERMITS.map((p) => p.key)
const permitStatus = (prop: any, requiredType: string): PermitState => requiredPermitState(prop.permits, requiredType)

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
      p.landlord.toLowerCase().includes(q) ||
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

// The open record — its fetches and the DrawerPreview every pane reads — shared
// with the Map View's detail panel.
const {
  selectedAccommodation,
  detailLoading,
  openAccommodation: openRecord,
  loadAccommodationEvents,
  accommodationPreview,
} = useAccommodationRecord(accommodations)

function openAccommodation(row: any) {
  openRecord(row)
  drawerOpen.value = true
}
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

.rooms-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--c-ink);
}
.rooms-cell .iconify { color: var(--c-muted); }

/* Total leads in ink; the gender breakdown underneath uses the same
   mars/venus icon + colour pairing as this accommodation's own detail drawer
   (features/drawer/accommodation), so a reviewer reads one gender
   visual language across the table and the drawer it opens into. */
.occupants-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  font-size: 13px;
}
.gender-split {
  display: inline-flex;
  gap: 6px;
}
.gender-figure {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  font-size: 11px;
  font-weight: 600;
}
.gender-figure.is-male { color: #42a5f5; }
.gender-figure.is-female { color: #e91e63; }

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
