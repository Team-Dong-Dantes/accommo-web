<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-end non-shrink q-gutter-x-sm">
      <TabNav v-model="activeTab" :tabs="tabs" />
    </div>

    <div class="table-wrapper">
      <TableCard
        v-model:search="search"
        :search-placeholder="searchPlaceholder"
        :filters="filterConfig"
        :active-filters="activeFilters"
        @update:active-filters="onActiveFilters"
        :loading="loading"
        :total-label="totalLabel"
        :rows="activePaginated"
        :columns="columns"
        row-key="id"
        :rows-per-page="10"
        :total-items="activeTotal"
        item-name="requests"
        :page="currentPage"
        @refresh="fetch"
        @update:page="currentPage = $event"
        @clear-filters="clearFilters"
      >
        <template #panels>
          <q-tab-panels v-model="activeTab" animated class="verif-panels">
            <!-- The three tabs share one table; only their rows and columns differ. -->
            <q-tab-panel v-for="panel in panels" :key="panel.name" :name="panel.name" class="q-pa-none">
              <DataTable
                v-if="loading || panel.filtered.length"
                :rows="panel.paginated"
                :columns="columns"
                row-key="id"
                :loading="loading"
                :pagination="{ rowsPerPage: 10 }"
                :start-index="(currentPage - 1) * 10"
              >
                <template #body="{ props, rowNumber }">
                  <QueueRow
                    :table-props="props"
                    :row="props.row"
                    :row-number="rowNumber"
                    :tab="panel.name"
                    :flash="props.row.id === highlightId"
                    :locked="isLockedByOther(props.row)"
                    :lock-label="reviewerLabel(props.row)"
                    :lock-title="reviewerTitle(props.row)"
                    @open="selectRequest(props.row)"
                    @take-over="takeOverReview(props.row)"
                  />
                </template>
              </DataTable>
              <EmptyState v-else variant="rich" icon="lucide:badge-check" :title="emptyTitle" :message="emptyMessage" />
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </TableCard>

      <VerificationReview
        :request="selectedRequest"
        :queue-index="queueIndex"
        :queue-count="queueCount"
        :has-prev="hasPrev"
        :has-next="hasNext"
        @close="closeReview"
        @submit="handleDecision"
        @prev="selectPrev"
        @next="selectNext"
      />
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVerifications } from '@/composables/useVerifications'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import DataTable from '@/components/table/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import VerificationReview from '@/components/verification/VerificationReview.vue'
import QueueRow from '@/features/verifications/QueueRow.vue'

const {
  loading,
  activeTab,
  search,
  activeFilters,
  filterConfig,
  clearFilters,
  currentPage,
  selectedRequest,
  tabs,
  columns,
  studentRequests,
  landlordRequests,
  accommodationRequests,
  studentFiltered,
  landlordFiltered,
  accommodationFiltered,
  studentPaginated,
  landlordPaginated,
  accommodationPaginated,
  totalLabel,
  searchPlaceholder,
  emptyTitle,
  emptyMessage,
  fetch,
  handleDecision,
  selectRequest,
  clearRequest,
  queueIndex,
  queueCount,
  hasPrev,
  hasNext,
  selectPrev,
  selectNext,
  isLockedByOther,
  reviewerOf,
  takeOverReview,
} = useVerifications()

const activeTotal = computed(() => {
  if (activeTab.value === 'landlord') return landlordFiltered.value.length
  if (activeTab.value === 'accommodation') return accommodationFiltered.value.length
  return studentFiltered.value.length
})
/** Naming who holds a request is the whole point — "In review" alone is the
 *  claim that could not be trusted. Presence supplies the name when the holder
 *  is connected; without it the row still says someone is there. */
function reviewerLabel(row: { id: string }) {
  const who = reviewerOf(row as never)
  return who ? `In review · ${who}` : 'In review'
}
function reviewerTitle(row: { id: string }) {
  const who = reviewerOf(row as never)
  return who ? `${who} has this request open` : 'Another reviewer has this request open'
}

const activePaginated = computed(() => {
  if (activeTab.value === 'landlord') return landlordPaginated.value
  if (activeTab.value === 'accommodation') return accommodationPaginated.value
  return studentPaginated.value
})

const panels = computed(() => [
  { name: 'student' as const, filtered: studentFiltered.value, paginated: studentPaginated.value },
  { name: 'landlord' as const, filtered: landlordFiltered.value, paginated: landlordPaginated.value },
  { name: 'accommodation' as const, filtered: accommodationFiltered.value, paginated: accommodationPaginated.value },
])

function onActiveFilters(val: Record<string, any[]>) {
  activeFilters.value = { readiness: (val.readiness ?? []) as string[] }
}

// Deep-link from a notification: ?focus=verification:<user_id> opens that
// request's review window and flashes its row.
const route = useRoute()
const router = useRouter()
const highlightId = ref('')

async function applyFocus() {
  const raw = (route.query.focus as string) || ''
  const idx = raw.indexOf(':')
  if (idx < 0) return
  const type = raw.slice(0, idx)
  const id = raw.slice(idx + 1)
  if (type !== 'verification' || !id) return
  const candidates: [readonly any[], string][] = [
    [studentRequests.value, 'student'],
    [landlordRequests.value, 'landlord'],
    [accommodationRequests.value, 'accommodation'],
  ]
  for (const [list, tab] of candidates) {
    const row = (list as any[]).find((r) => r.rawId === id)
    if (row) {
      activeTab.value = tab as any
      search.value = ''
      activeFilters.value = { readiness: [] }
      currentPage.value = 1
      await nextTick()
      highlightId.value = id
      selectRequest(row)
      setTimeout(() => (highlightId.value = ''), 2600)
      break
    }
  }
}
watch([studentRequests, landlordRequests, accommodationRequests, () => route.query.focus], applyFocus)
onMounted(applyFocus)

function closeReview() {
  clearRequest()
  if (!route.query.focus) return
  const { focus: _focus, ...query } = route.query
  void router.replace({ query })
}

fetch()
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

.table-wrapper {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.table-container {
  background: var(--c-surface);
  border-radius: 0 12px 12px 12px;
  border: 1px solid var(--c-border);
  border-top: none;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
  overflow: auto;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.verif-panels {
  height: 100%;
}

/* Row hover, flash, lock note and "Take over" live with the row, in
   features/verifications/QueueRow.vue. */

/* DataTable cells are flex; text-right alone won't move a flex child,
   so right-align the action cell's content */
:deep(.custom-data-table tbody td.action-cell) {
  justify-content: flex-end;
}

/* The row itself opens the review — there is no Review button; the
   `.row-chevron-cell`/`.chevron-icon` markup in QueueRow is the exact
   pairing DataTable.vue's own `row-chevron` prop renders, so its hover
   color-shift CSS (`:deep()`, not scoped to DataTable's own template) applies
   here unchanged, with nothing to duplicate. */
</style>
