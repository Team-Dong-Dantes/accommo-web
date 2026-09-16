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
            <q-tab-panel name="student" class="q-pa-none">
              <DataTable
                v-if="loading || studentFiltered.length"
                :rows="studentPaginated"
                :columns="columns"
                row-key="id"
                :loading="loading"
                :pagination="{ rowsPerPage: 10 }"
              >
                <template #body="{ props }">
                  <q-tr :props="props" :class="['smart-row', { 'row-flash': props.row.id === highlightId }]">
                    <q-td key="entity" :props="props">
                      <div class="column q-gutter-y-xs">
                        <UserInfoCell
                          :initials="props.row.initials"
                          :name="props.row.name"
                          :email="props.row.email"
                          :subtitle="props.row.owner || ''"
                          :avatar-color="props.row.avatarColor"
                          :avatar-url="props.row.avatarUrl"
                        />
                      </div>
                    </q-td>
                    <q-td key="id" :props="props" class="text-muted" style="font-family: monospace; font-size: 13px">{{ props.row.id }}</q-td>
                    <q-td key="type" :props="props">
                      <div class="text-ink text-weight-medium" style="font-size: 13px">{{ props.row.type }}</div>
                      <div class="row items-center text-muted" style="font-size: 11px; margin-top: 2px">
                        <Icon icon="lucide:file-text" width="12" height="12" class="q-mr-xs" />
                        {{ props.row.files?.length || 0 }} document{{ props.row.files?.length === 1 ? '' : 's' }}
                      </div>
                    </q-td>
                    <q-td key="status" :props="props">
                      <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.status" />
                    </q-td>
                    <q-td key="submitted" :props="props" class="text-muted" style="font-size: 12px">{{ props.row.submitted }}</q-td>
                    <q-td key="action" :props="props" class="text-right action-cell">
                      <template v-if="isLockedByOther(props.row)">
                        <span class="locked-note" :title="reviewerTitle(props.row)">
                          <Icon icon="lucide:lock" width="14" height="14" /> {{ reviewerLabel(props.row) }}
                        </span>
                        <button type="button" class="take-over" @click="takeOverReview(props.row)">Take over</button>
                      </template>
                      <q-btn v-else unelevated dense color="primary" text-color="white" no-caps class="text-weight-bold review-btn" @click="selectRequest(props.row)">
                        Review <Icon icon="lucide:chevron-right" class="q-ml-xs" width="14" height="14" />
                      </q-btn>
                    </q-td>
                  </q-tr>
                </template>
              </DataTable>
              <EmptyState v-else variant="rich" icon="lucide:badge-check" :title="emptyTitle" :message="emptyMessage" />
            </q-tab-panel>

            <q-tab-panel name="accommodation_manager" class="q-pa-none">
              <DataTable
                v-if="loading || accommodationManagerFiltered.length"
                :rows="accommodationManagerPaginated"
                :columns="columns"
                row-key="id"
                :loading="loading"
                :pagination="{ rowsPerPage: 10 }"
              >
                <template #body="{ props }">
                  <q-tr :props="props" :class="['smart-row', { 'row-flash': props.row.id === highlightId }]">
                    <q-td key="entity" :props="props">
                      <div class="column q-gutter-y-xs">
                        <UserInfoCell
                          :initials="props.row.initials"
                          :name="props.row.name"
                          :email="props.row.email"
                          :subtitle="props.row.owner || ''"
                          :avatar-color="props.row.avatarColor"
                          :avatar-url="props.row.avatarUrl"
                        />
                      </div>
                    </q-td>
                    <q-td key="id" :props="props" class="text-muted" style="font-family: monospace; font-size: 13px">{{ props.row.id }}</q-td>
                    <q-td key="type" :props="props">
                      <div class="text-ink text-weight-medium" style="font-size: 13px">{{ props.row.type }}</div>
                      <div class="row items-center text-muted" style="font-size: 11px; margin-top: 2px">
                        <Icon icon="lucide:file-text" width="12" height="12" class="q-mr-xs" />
                        {{ props.row.files?.length || 0 }} document{{ props.row.files?.length === 1 ? '' : 's' }}
                      </div>
                    </q-td>
                    <q-td key="status" :props="props">
                      <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.status" />
                    </q-td>
                    <q-td key="submitted" :props="props" class="text-muted" style="font-size: 12px">{{ props.row.submitted }}</q-td>
                    <q-td key="action" :props="props" class="text-right action-cell">
                      <template v-if="isLockedByOther(props.row)">
                        <span class="locked-note" :title="reviewerTitle(props.row)">
                          <Icon icon="lucide:lock" width="14" height="14" /> {{ reviewerLabel(props.row) }}
                        </span>
                        <button type="button" class="take-over" @click="takeOverReview(props.row)">Take over</button>
                      </template>
                      <q-btn v-else unelevated dense color="primary" text-color="white" no-caps class="text-weight-bold review-btn" @click="selectRequest(props.row)">
                        Review <Icon icon="lucide:chevron-right" class="q-ml-xs" width="14" height="14" />
                      </q-btn>
                    </q-td>
                  </q-tr>
                </template>
              </DataTable>
              <EmptyState v-else variant="rich" icon="lucide:badge-check" :title="emptyTitle" :message="emptyMessage" />
            </q-tab-panel>

            <q-tab-panel name="accommodation" class="q-pa-none">
              <DataTable
                v-if="loading || accommodationFiltered.length"
                :rows="accommodationPaginated"
                :columns="columns"
                row-key="id"
                :loading="loading"
                :pagination="{ rowsPerPage: 10 }"
              >
                <template #body="{ props }">
                  <q-tr :props="props" :class="['smart-row', { 'row-flash': props.row.id === highlightId }]">
                    <q-td key="entity" :props="props">
                      <div class="column q-gutter-y-xs">
                        <UserInfoCell
                          :initials="props.row.initials"
                          :name="props.row.name"
                          :email="props.row.email"
                          :subtitle="props.row.owner || ''"
                          :avatar-color="props.row.avatarColor"
                          :avatar-url="props.row.avatarUrl"
                        />
                      </div>
                    </q-td>
                    <q-td key="id" :props="props" class="text-muted" style="font-family: monospace; font-size: 13px">{{ props.row.id }}</q-td>
                    <q-td key="type" :props="props">
                      <div class="text-ink text-weight-medium" style="font-size: 13px">{{ props.row.type }}</div>
                      <div class="row items-center text-muted" style="font-size: 11px; margin-top: 2px">
                        <Icon icon="lucide:file-text" width="12" height="12" class="q-mr-xs" />
                        {{ props.row.files?.length || 0 }} document{{ props.row.files?.length === 1 ? '' : 's' }}
                      </div>
                    </q-td>
                    <q-td key="status" :props="props">
                      <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.status" />
                    </q-td>
                    <q-td key="submitted" :props="props" class="text-muted" style="font-size: 12px">{{ props.row.submitted }}</q-td>
                    <q-td key="action" :props="props" class="text-right action-cell">
                      <template v-if="isLockedByOther(props.row)">
                        <span class="locked-note" :title="reviewerTitle(props.row)">
                          <Icon icon="lucide:lock" width="14" height="14" /> {{ reviewerLabel(props.row) }}
                        </span>
                        <button type="button" class="take-over" @click="takeOverReview(props.row)">Take over</button>
                      </template>
                      <q-btn v-else unelevated dense color="primary" text-color="white" no-caps class="text-weight-bold review-btn" @click="selectRequest(props.row)">
                        Review <Icon icon="lucide:chevron-right" class="q-ml-xs" width="14" height="14" />
                      </q-btn>
                    </q-td>
                  </q-tr>
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
import BadgePill from '@/components/user/BadgePill.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import VerificationReview from '@/components/verification/VerificationReview.vue'
import { Icon } from '@iconify/vue'

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
  accommodationManagerRequests,
  accommodationRequests,
  studentFiltered,
  accommodationManagerFiltered,
  accommodationFiltered,
  studentPaginated,
  accommodationManagerPaginated,
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
  if (activeTab.value === 'accommodation_manager') return accommodationManagerFiltered.value.length
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
  if (activeTab.value === 'accommodation_manager') return accommodationManagerPaginated.value
  if (activeTab.value === 'accommodation') return accommodationPaginated.value
  return studentPaginated.value
})

function onActiveFilters(val: Record<string, any[]>) {
  activeFilters.value = { status: (val.status ?? []) as string[] }
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
    [accommodationManagerRequests.value, 'accommodation_manager'],
    [accommodationRequests.value, 'accommodation'],
  ]
  for (const [list, tab] of candidates) {
    const row = (list as any[]).find((r) => r.rawId === id)
    if (row) {
      activeTab.value = tab as any
      search.value = ''
      activeFilters.value = { status: [] }
      currentPage.value = 1
      await nextTick()
      highlightId.value = id
      selectRequest(row)
      setTimeout(() => (highlightId.value = ''), 2600)
      break
    }
  }
}
watch([studentRequests, accommodationManagerRequests, accommodationRequests, () => route.query.focus], applyFocus)
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
.locked-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 600;
}
.take-over {
  margin-left: 10px;
  border: 0;
  background: none;
  color: var(--c-primary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  text-decoration: underline;
}
.take-over:hover { color: var(--c-primary-ink, var(--c-primary)); }
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

.smart-row {
  transition: background-color 0.2s ease;
}
.smart-row:hover {
  background-color: var(--c-surface-2) !important;
}

.row-flash {
  animation: rowFlash 2.4s ease;
}
@keyframes rowFlash {
  0% { background-color: var(--c-primary-soft, rgba(0, 150, 136, 0.16)); }
  100% { background-color: transparent; }
}

.review-btn {
  border-radius: 8px;
  padding: 4px 16px;
  font-size: 12px;
  transition: transform 0.1s ease;
}
.review-btn:active {
  transform: scale(0.96);
}

/* DataTable cells are flex; text-right alone won't move a flex child,
   so right-align the action cell's content */
:deep(.custom-data-table tbody td.action-cell) {
  justify-content: flex-end;
}
</style>
