<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">
    <!-- Top bar -->
    <div class="row justify-end items-end non-shrink">
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
        <q-btn v-if="canEdit" unelevated color="primary" no-caps class="text-weight-bold rounded-button" @click="openCreate()">
          <Icon icon="lucide:megaphone" class="on-left" width="18" height="18" />
          New Announcement
        </q-btn>
      </div>
    </div>

    <div v-if="fetchError" class="text-white bg-negative q-pa-sm q-px-md q-mb-md" style="border-radius: 12px; font-size: 13px;">
      <Icon icon="lucide:circle-alert" class="q-mr-xs" width="16" height="16" style="vertical-align: middle;" />
      Could not load announcements: {{ fetchError }}
    </div>

    <TableCard
      v-model:search="searchQuery"
      v-model:page="currentPage"
      :filters="filterConfig"
      v-model:active-filters="activeFilters"
      @clear-filters="clearFilters"
      search-placeholder="Search announcements..."
      :total-label="`${filteredData.length} announcements`"
      :total-items="filteredData.length"
      item-name="announcements"
      @refresh="fetchAll"
    >
      <template #panels>
        <DataTable :rows="paginatedData" :columns="announcementColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="(currentPage - 1) * 10" v-model:sort="sort" @row-click="openView">
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
               <template v-if="canEdit">
                <template v-if="!props.row.accommodation_id">
                  <q-btn v-if="props.row.status !== 'expired'" flat dense color="primary" size="sm" class="custom-radius" @click="togglePublish(props.row)">
                    <Icon :icon="props.row.status === 'live' ? 'lucide:eye-off' : 'lucide:send'" width="18" height="18" />
                    <q-tooltip>{{ props.row.status === 'live' ? 'Unpublish' : 'Publish now' }}</q-tooltip>
                  </q-btn>
                  <q-btn flat dense color="primary" size="sm" class="custom-radius" @click="openEdit(props.row)"><Icon icon="lucide:pencil" width="18" height="18" /><q-tooltip>Edit</q-tooltip></q-btn>
                </template>
                <q-btn v-if="!showArchived" flat dense color="grey-7" size="sm" class="custom-radius" @click="archiveItem(props.row)"><Icon icon="lucide:archive" width="18" height="18" /><q-tooltip>Archive</q-tooltip></q-btn>
                <q-btn v-else flat dense color="primary" size="sm" class="custom-radius" @click="restoreItem(props.row)"><Icon icon="lucide:archive-restore" width="18" height="18" /><q-tooltip>Restore</q-tooltip></q-btn>
               </template>
              </q-td>
          </template>
        </DataTable>
      </template>
    </TableCard>

    <ComposerDialog :edit-row="composerEditRow" :create-token="composerCreateToken" @saved="fetchAll" />

    <AnnouncementDrawer
      :row="viewRow"
      @close="viewRow = null"
      @edit="editFromDrawer"
      @archive="archiveItem"
      @restore="restoreItem"
      @toggle-publish="togglePublish"
    />
  </q-page>
</template>

<script setup lang="ts">
import { errorMessage } from '@/utils/errors'
import { ref, computed, watch, onMounted } from 'vue'
import { useSort } from '@/composables/useSort'
import { useQuasar } from 'quasar'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { counted } from '@/utils/filterOptions'
import TableCard from '@/components/table/TableCard.vue'
import DataTable from '@/components/table/DataTable.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import ComposerDialog from '@/features/announcements/ComposerDialog.vue'
import { useAuthStore } from '@/stores/auth'
import AnnouncementDrawer from '@/features/announcements/AnnouncementDrawer.vue'
import {
  fetchAnnouncements, fetchReach, setAnnouncementPublished, setArchived,
} from '@/api/announcements'
import {
  STATUS_META, announcementStatus, audienceMeta, fmtDate, pct, utcIso,
  type AnnouncementStatus,
} from '@/features/announcements/shared'

const authStore = useAuthStore()
const canEdit = computed(() => authStore.can('announcements', 'edit'))

const $q = useQuasar()
const notify = useNotify()

const searchQuery = ref('')
const currentPage = ref(1)
const loading = ref(true)
const fetchError = ref('')
const showArchived = ref(false)
// OSAS's own broadcasts by default; landlord/landlady notices are one filter away.
const defaultFilters = (): Record<string, any[]> => ({ source: ['osas'] })
const activeFilters = ref<Record<string, any[]>>(defaultFilters())

const announcements = ref<any[]>([])

const composerEditRow = ref<any | null>(null)
const composerCreateToken = ref(0)
const viewRow = ref<any | null>(null)

// ---- fetch ----
async function fetchAll() {
  loading.value = true
  fetchError.value = ''
  try {
    const ann = await fetchAnnouncements()
    // Reach is an extra: a failure leaves the column blank, not the page.
    const reach = await fetchReach().catch((e) => { console.error('Reach failed:', e); return new Map() })

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

    // Keep an open drawer on the refreshed copy of its row.
    if (viewRow.value) {
      viewRow.value = announcements.value.find((r) => r.id === viewRow.value.id) ?? null
    }
  } catch (e) {
    // Supabase errors are plain objects, not Error instances; keep their message.
    fetchError.value = (e as { message?: string })?.message || 'Failed to load data'
    console.error('Failed to load announcements:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

// ---- filter / paginate ----
const filteredData = computed(() => {
  let result = announcements.value.filter((item) => showArchived.value ? !!item.archived : !item.archived)
  const q = searchQuery.value.toLowerCase()
  if (q) {
    result = result.filter((item) =>
      [item.title, item.summary, item.body, item.authorName, item.accommodation?.name]
        .some((v) => (v ?? '').toLowerCase().includes(q)))
  }
  const f = activeFilters.value
  if (f.status?.length) result = result.filter((item) => f.status!.includes(item.status))
  if (f.audience?.length) result = result.filter((item) => !item.accommodation_id && f.audience!.includes(item.audience))
  if (f.source?.length) result = result.filter((item) => f.source!.includes(item.accommodation_id ? 'landlord' : 'osas'))
  return result
})

const { sort, sorted: sortedData } = useSort(() => filteredData.value, () => announcementColumns)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * 10
  return sortedData.value.slice(start, start + 10)
})

watch([activeFilters, sort], () => {
  currentPage.value = 1
})

// Options come from the rows in view (active or archived), each with its
// count, so nothing is offered that would show an empty list.
const filterConfig = computed(() => {
  const base = announcements.value
    .filter((item) => showArchived.value ? !!item.archived : !item.archived)
    .map((item) => ({
      status: String(item.status ?? ''),
      source: item.accommodation_id ? 'landlord' : 'osas',
      audience: item.accommodation_id ? '' : String(item.audience ?? ''),
    }))
  const statusLabel = (s: string) => STATUS_META[s as keyof typeof STATUS_META]?.label ?? s
  return [
    { label: 'Source', key: 'source', options: counted(base, 'source', (v) => (v === 'osas' ? 'OSAS' : 'Landlord/Landlady notices'), ['osas', 'landlord']) },
    { label: 'Status', key: 'status', options: counted(base, 'status', statusLabel, ['live', 'scheduled', 'draft', 'expired']) },
    { label: 'Audience', key: 'audience', options: counted(base, 'audience', (v) => audienceMeta(v).label, ['all', 'students', 'landlords']) },
  ]
})

function clearFilters() {
  activeFilters.value = defaultFilters()
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
    notify.error(errorMessage(e, 'Failed to update'))
  }
}

function archiveItem(row: any) {
  $q.dialog({
    title: 'Archive announcement?',
    message: '"' + row.title + '" will be moved to the archive. You can restore it later from the Archived view.',
    cancel: { label: 'Cancel', flat: true, color: 'grey-7', noCaps: true },
    ok: { label: 'Archive', unelevated: true, color: 'primary', noCaps: true },
  }).onOk(() => setArchivedAndReload(row, true))
}

function restoreItem(row: any) {
  void setArchivedAndReload(row, false)
}

async function setArchivedAndReload(row: any, archived: boolean) {
  try {
    await setArchived(row.id, archived)
    notify.success(archived ? 'Announcement archived.' : 'Announcement restored.')
    await fetchAll()
  } catch (e) {
    console.error('Archive/restore failed:', e)
    notify.error(errorMessage(e, 'Failed to update'))
  }
}

// ---- columns ----
const announcementColumns = [
  { name: 'title', required: true, align: 'left', label: 'Announcement', field: 'title', headerStyle: 'width: 32%' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerStyle: 'width: 11%' },
  { name: 'audience', align: 'left', label: 'Audience', field: 'audience', sortValue: (r: any) => r.accommodation?.name ?? r.audience, headerStyle: 'width: 15%' },
  { name: 'reach', align: 'left', label: 'Reach', field: 'reach', sortValue: (r: any) => (r.reach?.sent ? r.reach.seen / r.reach.sent : null), headerStyle: 'width: 11%' },
  // Drafts have no publish date and sort last either way.
  { name: 'date', align: 'left', label: 'Published', field: 'dateLabel', sortValue: (r: any) => (r.status === 'draft' ? null : r.published_at), headerStyle: 'width: 15%' },
  { name: 'actions', align: 'right', label: '', field: 'actions', headerStyle: 'width: 12%' },
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
