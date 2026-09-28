<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">
    <!-- Top bar -->
    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <div class="row q-gutter-x-sm q-mb-md">
        <q-btn
          flat
          round
          no-caps
          class="archive-toggle-btn"
          :class="{ 'archive-toggle-active': showArchived }"
          :color="showArchived ? 'primary' : 'ink'"
          :text-color="showArchived ? 'primary' : 'ink'"
          @click="showArchived = !showArchived"
        >
          <Icon :icon="showArchived ? 'lucide:archive-x' : 'lucide:archive'" width="20" height="20" />
          <q-badge v-if="showArchived" floating color="primary" rounded transparent class="archive-active-dot" />
          <q-tooltip>{{ showArchived ? 'Active' : 'Archived' }}</q-tooltip>
        </q-btn>
        <q-btn unelevated color="primary" no-caps class="text-weight-bold rounded-button" @click="openCreate()">
          <Icon :icon="isAnn ? 'lucide:megaphone' : 'lucide:gavel'" class="on-left" width="18" height="18" />
          {{ isAnn ? 'New Announcement' : 'New Policy' }}
        </q-btn>
      </div>
    </div>

    <div v-if="fetchError" class="text-white bg-negative q-pa-sm q-px-md q-mb-md" style="border-radius: 12px; font-size: 13px;">
      <Icon icon="lucide:circle-alert" class="q-mr-xs" width="16" height="16" style="vertical-align: middle;" />
      Could not load {{ isAnn ? 'announcements' : 'policies' }}: {{ fetchError }}
    </div>

    <TableCard
      v-model:search="searchQuery"
      v-model:page="currentPage"
      :filters="filterConfig"
      v-model:active-filters="activeFilters"
      @clear-filters="clearFilters"
      :search-placeholder="isAnn ? 'Search announcements...' : 'Search policies & guidelines...'"
      :total-label="`${filteredData.length} ${isAnn ? 'announcements' : 'policies'}`"
      :total-items="filteredData.length"
      :item-name="isAnn ? 'announcements' : 'policies'"
      @refresh="fetchAll"
    >
      <template #panels>
        <q-tab-panels v-model="activeTab" animated style="background: transparent; height: 100%;">
          <!-- Announcements tab -->
          <q-tab-panel name="announcements" class="q-pa-none">
            <DataTable :rows="paginatedData" :columns="announcementColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="(currentPage - 1) * 10" @row-click="openView">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="lucide:megaphone" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">Nothing here yet</div>
                  <div>No announcements found.</div>
                </div>
              </template>
              <template #body="{ props, rowNumber }">
                  <q-td class="row-num-cell">{{ rowNumber }}</q-td>
                  <q-td key="title" :props="props">
                    <div class="column">
                      <div class="text-weight-bold text-ink ellipsis" style="font-size: 14px;">{{ props.row.title }}</div>
                      <div class="text-muted ellipsis" style="font-size: 12px; margin-top: 2px;">{{ props.row.summary || props.row.body }}</div>
                    </div>
                  </q-td>
                  <q-td key="status" :props="props">
                    <BadgePill v-bind="STATUS_META[props.row.status as AnnouncementStatus]" />
                  </q-td>
                  <q-td key="audience" :props="props">
                    <BadgePill v-if="props.row.accommodation_id" tone="primary" icon="lucide:house" :label="props.row.accommodation?.name ?? 'Landlord notice'" />
                    <BadgePill v-else v-bind="audienceMeta(props.row.audience)" />
                  </q-td>
                  <q-td key="reach" :props="props" class="text-ink" style="font-size: 13px;">
                    <div v-if="props.row.reach" class="row items-center no-wrap q-gutter-x-sm">
                      <q-circular-progress
                        :value="props.row.reach.sent ? (props.row.reach.seen / props.row.reach.sent) * 100 : 0"
                        size="22px"
                        :thickness="0.28"
                        color="primary"
                      />
                      <span class="text-weight-medium">{{ pct(props.row.reach.seen, props.row.reach.sent) }}</span>
                      <q-tooltip>{{ props.row.reach.seen }} of {{ props.row.reach.sent }} seen</q-tooltip>
                    </div>
                    <span v-else class="text-muted">—</span>
                  </q-td>
                  <q-td key="date" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.dateLabel }}</q-td>
                  <q-td key="actions" :props="props" class="row items-center justify-end q-gutter-x-sm no-wrap" @click.stop>
                    <template v-if="!props.row.accommodation_id">
                      <q-btn v-if="props.row.status !== 'expired'" flat dense color="primary" size="sm" class="custom-radius" @click="togglePublish(props.row)">
                        <Icon :icon="props.row.status === 'live' ? 'lucide:eye-off' : 'lucide:send'" width="18" height="18" />
                        <q-tooltip>{{ props.row.status === 'live' ? 'Unpublish' : 'Publish now' }}</q-tooltip>
                      </q-btn>
                      <q-btn flat dense color="primary" size="sm" class="custom-radius" @click="openEdit(props.row)"><Icon icon="lucide:pencil" width="18" height="18" /><q-tooltip>Edit</q-tooltip></q-btn>
                    </template>
                    <q-btn v-if="!showArchived" flat dense color="grey-7" size="sm" class="custom-radius" @click="archiveItem(props.row)"><Icon icon="lucide:archive" width="18" height="18" /><q-tooltip>Archive</q-tooltip></q-btn>
                    <q-btn v-else flat dense color="primary" size="sm" class="custom-radius" @click="restoreItem(props.row)"><Icon icon="lucide:archive-restore" width="18" height="18" /><q-tooltip>Restore</q-tooltip></q-btn>
                  </q-td>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- Policies tab -->
          <q-tab-panel name="policies" class="q-pa-none">
            <DataTable :rows="paginatedData" :columns="policyColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="(currentPage - 1) * 10" @row-click="openView">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="lucide:gavel" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">Nothing here yet</div>
                  <div>No policies found.</div>
                </div>
              </template>
              <template #body="{ props, rowNumber }">
                  <q-td class="row-num-cell">{{ rowNumber }}</q-td>
                  <q-td key="title" :props="props">
                    <div class="column">
                      <div class="text-weight-bold text-ink ellipsis" style="font-size: 14px;">{{ props.row.title }}</div>
                      <div class="text-muted ellipsis" style="font-size: 12px; margin-top: 2px;">{{ props.row.body }}</div>
                    </div>
                  </q-td>
                  <q-td key="version" :props="props">
                    <BadgePill tone="neutral" :label="versionLabel(props.row)" />
                  </q-td>
                  <q-td key="status" :props="props">
                    <BadgePill v-bind="STATUS_META[props.row.status as PolicyStatus]" />
                  </q-td>
                  <q-td key="accepted" :props="props" style="font-size: 13px;">
                    <template v-if="props.row.stats && props.row.status === 'in_effect'">
                      <div class="text-ink text-weight-medium">{{ props.row.stats.accepted }} / {{ props.row.stats.eligible }}</div>
                      <q-linear-progress :value="props.row.stats.eligible ? props.row.stats.accepted / props.row.stats.eligible : 0" rounded size="4px" color="primary" style="max-width: 96px;" />
                    </template>
                    <span v-else class="text-muted">—</span>
                  </q-td>
                  <q-td key="effective" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ fmtDate(props.row.effective_date) }}</q-td>
                  <q-td key="actions" :props="props" class="row items-center justify-end q-gutter-x-sm no-wrap" @click.stop>
                    <q-btn flat dense color="primary" size="sm" class="custom-radius" @click="openEdit(props.row)"><Icon icon="lucide:pencil" width="18" height="18" /><q-tooltip>Edit</q-tooltip></q-btn>
                    <q-btn v-if="!showArchived" flat dense color="grey-7" size="sm" class="custom-radius" @click="archiveItem(props.row)"><Icon icon="lucide:archive" width="18" height="18" /><q-tooltip>Archive</q-tooltip></q-btn>
                    <q-btn v-else flat dense color="primary" size="sm" class="custom-radius" @click="restoreItem(props.row)"><Icon icon="lucide:archive-restore" width="18" height="18" /><q-tooltip>Restore</q-tooltip></q-btn>
                  </q-td>
              </template>
            </DataTable>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </TableCard>

    <ComposerDialog :kind="activeTab" :edit-row="composerEditRow" :create-token="composerCreateToken" @saved="fetchAll" />

    <AnnouncementDrawer
      :row="viewKind === 'announcements' ? viewRow : null"
      @close="viewRow = null"
      @edit="editFromDrawer"
      @archive="archiveItem"
      @restore="restoreItem"
      @toggle-publish="togglePublish"
    />
    <PolicyDrawer
      :row="viewKind === 'policies' ? viewRow : null"
      @close="viewRow = null"
      @edit="editFromDrawer"
      @archive="archiveItem"
      @restore="restoreItem"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import DataTable from '@/components/table/DataTable.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import ComposerDialog from '@/features/announcements/ComposerDialog.vue'
import AnnouncementDrawer from '@/features/announcements/AnnouncementDrawer.vue'
import PolicyDrawer from '@/features/announcements/PolicyDrawer.vue'
import {
  fetchAnnouncements, fetchPolicies, fetchReach, fetchPolicyStats, setAnnouncementPublished, setArchived,
} from '@/api/announcements'
import {
  STATUS_META, announcementStatus, audienceMeta, fmtDate, pct, policyStatus, utcIso, versionLabel,
  type AnnouncementStatus, type PolicyStatus,
} from '@/features/announcements/shared'

type Tab = 'announcements' | 'policies'

const $q = useQuasar()
const notify = useNotify()

const activeTab = ref<Tab>('announcements')
const isAnn = computed(() => activeTab.value === 'announcements')
const searchQuery = ref('')
const currentPage = ref(1)
const loading = ref(true)
const fetchError = ref('')
const showArchived = ref(false)
// OSAS's own broadcasts by default; landlord/landlady notices are one filter away.
const defaultFilters = (tab: Tab): Record<string, any[]> => (tab === 'announcements' ? { source: ['osas'] } : {})
const activeFilters = ref<Record<string, any[]>>(defaultFilters('announcements'))

const tabs = [
  { name: 'announcements', label: 'Announcements' },
  { name: 'policies', label: 'Policies & Guidelines' },
]

const announcements = ref<any[]>([])
const policies = ref<any[]>([])

const composerEditRow = ref<any | null>(null)
const composerCreateToken = ref(0)
const viewRow = ref<any | null>(null)
const viewKind = ref<Tab>('announcements')

// ---- fetch ----
async function fetchAll() {
  loading.value = true
  fetchError.value = ''
  try {
    const [ann, pol] = await Promise.all([fetchAnnouncements(), fetchPolicies()])
    // Reach and acceptance are extras: a failure leaves the columns blank, not the page.
    const [reach, stats] = await Promise.all([
      fetchReach().catch((e) => { console.error('Reach failed:', e); return new Map() }),
      fetchPolicyStats().catch((e) => { console.error('Policy stats failed:', e); return new Map() }),
    ])

    announcements.value = ann.map((a: any) => {
      const status = announcementStatus(a)
      return {
        ...a,
        status,
        reach: status === 'draft' || status === 'scheduled' ? null : reach.get(a.id) ?? null,
        authorName: a.author?.full_name ?? 'Unknown',
        audience: a.audience ?? 'all',
        dateLabel: status === 'draft' ? 'Draft'
          : (status === 'scheduled' ? 'Goes live ' : '') + fmtDate(utcIso(a.published_at)),
      }
    })
    policies.value = pol.map((p: any) => ({
      ...p,
      status: policyStatus(p),
      stats: stats.get(p.id) ?? null,
      authorName: p.creator?.full_name ?? 'Unknown',
    }))

    // Keep an open drawer on the refreshed copy of its row.
    if (viewRow.value) {
      const list = viewKind.value === 'announcements' ? announcements.value : policies.value
      viewRow.value = list.find((r) => r.id === viewRow.value.id) ?? null
    }
  } catch (e) {
    // Supabase errors are plain objects, not Error instances; keep their message.
    fetchError.value = (e as { message?: string })?.message || 'Failed to load data'
    console.error('Failed to load announcements/policies:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

// ---- filter / paginate ----
const filteredData = computed(() => {
  const source = isAnn.value ? announcements.value : policies.value
  let result = source.filter((item) => showArchived.value ? !!item.archived : !item.archived)
  const q = searchQuery.value.toLowerCase()
  if (q) {
    result = result.filter((item) =>
      [item.title, item.summary, item.body, item.authorName, item.accommodation?.name]
        .some((v) => (v ?? '').toLowerCase().includes(q)))
  }
  const f = activeFilters.value
  if (f.status?.length) result = result.filter((item) => f.status!.includes(item.status))
  if (isAnn.value) {
    if (f.audience?.length) result = result.filter((item) => !item.accommodation_id && f.audience!.includes(item.audience))
    if (f.source?.length) result = result.filter((item) => f.source!.includes(item.accommodation_id ? 'landlord' : 'osas'))
  }
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredData.value.slice(start, start + 10)
})

watch(activeTab, (tab) => {
  searchQuery.value = ''
  activeFilters.value = defaultFilters(tab)
  showArchived.value = false
  currentPage.value = 1
})

watch(activeFilters, () => {
  currentPage.value = 1
})

const filterConfig = computed(() => {
  if (isAnn.value) {
    return [
      {
        label: 'Source',
        key: 'source',
        options: [
          { label: 'OSAS', value: 'osas' },
          { label: 'Landlord/Landlady notices', value: 'landlord' },
        ],
      },
      {
        label: 'Status',
        key: 'status',
        options: (['live', 'scheduled', 'draft', 'expired'] as const).map((s) => ({ label: STATUS_META[s].label, value: s })),
      },
      {
        label: 'Audience',
        key: 'audience',
        options: ['all', 'students', 'landlords'].map((a) => ({ label: audienceMeta(a).label, value: a })),
      },
    ]
  }
  return [
    {
      label: 'Status',
      key: 'status',
      options: (['in_effect', 'scheduled'] as const).map((s) => ({ label: STATUS_META[s].label, value: s })),
    },
  ]
})

function clearFilters() {
  activeFilters.value = defaultFilters(activeTab.value)
}

// ---- actions ----
function openCreate() {
  composerEditRow.value = null
  composerCreateToken.value++
}

function openEdit(row: any) {
  composerCreateToken.value = 0
  // Shallow-clone so the reference always changes — ComposerDialog's edit
  // watch re-fires even when editing the same row twice in a row.
  composerEditRow.value = { ...row }
}

function editFromDrawer(row: any) {
  viewRow.value = null
  openEdit(row)
}

function openView(row: any) {
  viewKind.value = activeTab.value
  viewRow.value = row
}

async function togglePublish(row: any) {
  const publishing = row.status !== 'live'
  try {
    const { data: { session } } = await supabase.auth.getSession()
    await setAnnouncementPublished(row.id, publishing ? new Date().toISOString() : null, publishing ? session?.user?.id : null)
    notify.success(publishing ? 'Announcement published.' : 'Announcement unpublished.')
    await fetchAll()
  } catch (e) {
    console.error('Toggle publish failed:', e)
    notify.error(e instanceof Error ? e.message : 'Failed to update')
  }
}

function archiveItem(row: any) {
  const table = viewRow.value ? viewKind.value : activeTab.value
  const label = table === 'announcements' ? 'announcement' : 'policy'
  $q.dialog({
    title: 'Archive ' + label + '?',
    message: '"' + row.title + '" will be moved to the archive. You can restore it later from the Archived view.',
    cancel: { label: 'Cancel', flat: true, color: 'grey-7', noCaps: true },
    ok: { label: 'Archive', unelevated: true, color: 'primary', noCaps: true },
  }).onOk(() => setArchivedAndReload(table, row, true))
}

function restoreItem(row: any) {
  void setArchivedAndReload(viewRow.value ? viewKind.value : activeTab.value, row, false)
}

async function setArchivedAndReload(table: Tab, row: any, archived: boolean) {
  const label = table === 'announcements' ? 'Announcement' : 'Policy'
  try {
    await setArchived(table, row.id, archived)
    notify.success(label + (archived ? ' archived.' : ' restored.'))
    await fetchAll()
  } catch (e) {
    console.error('Archive/restore failed:', e)
    notify.error(e instanceof Error ? e.message : 'Failed to update')
  }
}

// ---- columns ----
const announcementColumns = [
  { name: 'title', required: true, align: 'left', label: 'Announcement', field: 'title', headerStyle: 'width: 32%' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerStyle: 'width: 11%' },
  { name: 'audience', align: 'left', label: 'Audience', field: 'audience', headerStyle: 'width: 15%' },
  { name: 'reach', align: 'left', label: 'Reach', field: 'reach', headerStyle: 'width: 11%' },
  { name: 'date', align: 'left', label: 'Published', field: 'dateLabel', headerStyle: 'width: 15%' },
  { name: 'actions', align: 'right', label: '', field: 'actions', headerStyle: 'width: 12%' },
]

const policyColumns = [
  { name: 'title', required: true, align: 'left', label: 'Policy', field: 'title', headerStyle: 'width: 38%' },
  { name: 'version', align: 'left', label: 'Version', field: 'version', headerStyle: 'width: 10%' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerStyle: 'width: 12%' },
  { name: 'accepted', align: 'left', label: 'Accepted', field: 'stats', headerStyle: 'width: 14%' },
  { name: 'effective', align: 'left', label: 'Effective', field: 'effective_date', headerStyle: 'width: 14%' },
  { name: 'actions', align: 'right', label: '', field: 'actions', headerStyle: 'width: 10%' },
]
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}
.custom-radius {
  border-radius: 8px !important;
}
.archive-toggle-btn {
  border: 1px solid var(--c-border);
  background: var(--c-surface);
}
.archive-toggle-btn:hover {
  border-color: var(--c-primary);
}
.archive-toggle-active {
  background: var(--c-primary-soft) !important;
  border-color: var(--c-primary) !important;
}
.archive-active-dot {
  width: 8px;
  height: 8px;
  min-height: 8px;
  padding: 0;
  border: 2px solid var(--c-surface);
  box-shadow: 0 0 0 1px var(--c-primary);
}
</style>
