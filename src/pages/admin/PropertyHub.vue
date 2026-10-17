<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">
<div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <q-btn
        v-if="authStore.can('reports')"
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
        @refresh="loadAccommodations(true)"
      >
      <template #panels>
        <q-tab-panels v-model="activeTab" animated style="background: transparent; height: 100%;">
<!-- OVERVIEW -->
          <q-tab-panel name="overview" class="q-pa-none">
            <OverviewTable v-model:sort="sort" :rows="paginatedAccommodations" :loading="loading" :start-index="(currentPage - 1) * 10" @open="openAccommodation" />
          </q-tab-panel>

          <!-- COMPLIANCE (one row per house; a capsule per required permit) -->
          <q-tab-panel name="compliance" class="q-pa-none">
            <ComplianceTable v-model:sort="sort" :rows="paginatedAccommodations" :loading="loading" :start-index="(currentPage - 1) * 10" @open="openAccommodation" />
          </q-tab-panel>

          <!-- PERFORMANCE -->
          <q-tab-panel name="performance" class="q-pa-none">
            <PerformanceTable v-model:sort="sort" :rows="paginatedAccommodations" :loading="loading" :start-index="(currentPage - 1) * 10" @open="openAccommodation" />
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
      :reports="['status', 'payments', 'boarders']"
      :preview="accommodationPreview"
      :record-id="selectedAccommodation?.id"
    />
    <AccountActionDialog :spec="actionSpec" @close="actionSpec = null" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import { useAuthStore } from '@/stores/auth'
import { counted } from '@/utils/filterOptions'
import { humanizeEnum } from '@/utils/format'
import ReportDialog from '@/features/reports/ReportDialog.vue'
import AccountActionDialog from '@/features/users/AccountActionDialog.vue'
import type { ReportId } from '@/features/reports/reports'
import { useAccommodations } from '@/composables/useAccommodations'
import { useSort } from '@/composables/useSort'
import { useAccommodationRecord, toRecordRow } from '@/composables/useAccommodationRecord'
import { useAccommodationActions } from '@/composables/useAccommodationActions'
import OverviewTable from '@/features/accommodations/OverviewTable.vue'
import ComplianceTable from '@/features/accommodations/ComplianceTable.vue'
import PerformanceTable from '@/features/accommodations/PerformanceTable.vue'
import { complianceColumns, overviewColumns, performanceColumns } from '@/features/accommodations/hubColumns'

const search = ref('')
const activeTab = ref('overview')
const currentPage = ref(1)
const activeFilters = ref<Record<string, any[]>>({})

const { loading, accommodations: realAccommodations, load: loadAccommodations } = useAccommodations()

const route = useRoute()
const authStore = useAuthStore()

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
    label: 'Status', key: 'status', options: counted(accommodations.value, 'status', humanizeEnum),
  },
  {
    label: 'Accommodation Type',
    key: 'type',
    options: counted(accommodations.value, 'type'),
  },
])

function clearFilters() {
  activeFilters.value = {}
}

// Report: opens on the one matching the tab, over the rows the hub is showing,
// so the hub's own filters carry into it and the report says so on the page.
const reportOpen = ref(false)
// The open record's own reports (status, payments, boarders), in the same report window.
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


const drawerOpen = ref(false)

// Map real Supabase accommodations straight through; the mapping is shared with
// the Map View so both open the same record.
const accommodations = computed(() => realAccommodations.value.map(toRecordRow))

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

const tabColumns = () => (activeTab.value === 'compliance' ? complianceColumns : activeTab.value === 'performance' ? performanceColumns : overviewColumns)
const { sort, sorted: sortedAccommodations } = useSort(() => filteredAccommodations.value, tabColumns)

const paginatedAccommodations = computed(() => {
  const start = (currentPage.value - 1) * 10
  return sortedAccommodations.value.slice(start, start + 10)
})

watch(activeTab, () => {
  search.value = ''
  sort.value = null
  currentPage.value = 1
})
watch(sort, () => { currentPage.value = 1 })

// The open record — its fetches and the DrawerPreview every pane reads — shared
// with the Map View's detail panel.
const {
  selectedAccommodation,
  detailLoading,
  openAccommodation: openRecord,
  loadAccommodationEvents,
  accommodationPreview,
} = useAccommodationRecord(accommodations)

const { accommodationActions, onManageAccommodation, actionSpec } = useAccommodationActions({
  selected: selectedAccommodation,
  realRows: realAccommodations,
  rows: accommodations,
  loadEvents: loadAccommodationEvents,
  openReport: () => { statusReportOpen.value = true },
})

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
</style>
