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
          <Icon :icon="showArchived ? 'mdi:archive-off-outline' : 'mdi:archive-outline'" width="20" height="20" />
          <q-badge v-if="showArchived" floating color="primary" rounded transparent class="archive-active-dot" />
          <q-tooltip>{{ showArchived ? 'Active' : 'Archived' }}</q-tooltip>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          no-caps
          class="text-weight-bold rounded-button"
          @click="openCreate()"
        >
          <Icon :icon="activeTab === 'announcements' ? 'mdi:bullhorn' : 'mdi:gavel'" class="on-left" width="18" height="18" />
          {{ activeTab === 'announcements' ? 'New Announcement' : 'New Policy' }}
        </q-btn>
      </div>
    </div>

    <div v-if="fetchError" class="text-white bg-negative q-pa-sm q-px-md q-mb-md" style="border-radius: 12px; font-size: 13px;">
      <Icon icon="mdi:alert-circle-outline" class="q-mr-xs" width="16" height="16" style="vertical-align: middle;" />
      Could not load {{ activeTab === 'announcements' ? 'announcements' : 'policies' }}: {{ fetchError }}
    </div>

    <TableCard
      v-model:search="searchQuery"
      v-model:page="currentPage"
      :filters="filterConfig"
      v-model:active-filters="activeFilters"
      @clear-filters="clearFilters"
      :search-placeholder="searchPlaceholder"
      :total-label="`${filteredData.length} ${activeTab === 'announcements' ? 'announcements' : 'policies'}`"
      :total-items="filteredData.length"
      :item-name="activeTab === 'announcements' ? 'announcements' : 'policies'"
      @refresh="fetchAll"
    >
      <template #panels>
        <q-tab-panels v-model="activeTab" animated style="background: transparent; height: 100%;">
          <!-- Announcements tab -->
          <q-tab-panel name="announcements" class="q-pa-none">
            <DataTable :rows="paginatedData" :columns="announcementColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="mdi:bullhorn-outline" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">Nothing here yet</div>
                  <div>No announcements found.</div>
                </div>
              </template>
              <template #body="{ props }">
                  <q-td key="title" :props="props">
                    <div class="column">
                      <div class="text-weight-bold text-ink ellipsis" style="font-size: 14px;">{{ props.row.title }}</div>
                      <div class="text-muted ellipsis" style="font-size: 12px; margin-top: 2px;">{{ props.row.body }}</div>
                    </div>
                  </q-td>
                  <q-td key="status" :props="props">
                    <BadgePill :tone="statusColor(props.row.status).tone" :icon="statusIcon(props.row.status)" :label="statusLabel(props.row.status)" />
                  </q-td>
                  <q-td key="audience" :props="props">
                    <BadgePill :tone="audienceColor(props.row.audience).tone" :label="audienceLabel(props.row.audience)" />
                  </q-td>
                  <q-td key="author" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.authorName }}</q-td>
                  <q-td key="date" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.dateLabel }}</q-td>
                  <q-td key="actions" :props="props" class="row items-center justify-end q-gutter-x-sm no-wrap">
                    <q-btn flat dense color="grey-6" size="sm" class="custom-radius" @click="openView(props.row)"><Icon icon="mdi:eye" width="18" height="18" /><q-tooltip>View</q-tooltip></q-btn>
                    <q-btn flat dense color="primary" size="sm" class="custom-radius" @click="togglePublish(props.row)">
                      <Icon :icon="props.row.status === 'published' ? 'mdi:eye-off-outline' : 'mdi:send-outline'" width="18" height="18" />
                      <q-tooltip>{{ props.row.status === 'published' ? 'Unpublish' : 'Publish' }}</q-tooltip>
                    </q-btn>
                    <q-btn flat dense color="primary" size="sm" class="custom-radius" @click="openEdit(props.row)"><Icon icon="mdi:pencil" width="18" height="18" /><q-tooltip>Edit</q-tooltip></q-btn>
                    <q-btn v-if="!showArchived" flat dense color="grey-7" size="sm" class="custom-radius" @click="archiveItem(props.row)"><Icon icon="mdi:archive-outline" width="18" height="18" /><q-tooltip>Archive</q-tooltip></q-btn>
                    <q-btn v-else flat dense color="primary" size="sm" class="custom-radius" @click="restoreItem(props.row)"><Icon icon="mdi:archive-restore" width="18" height="18" /><q-tooltip>Restore</q-tooltip></q-btn>
                  </q-td>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- Policies tab -->
          <q-tab-panel name="policies" class="q-pa-none">
            <DataTable :rows="paginatedData" :columns="policyColumns" row-key="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
              <template #no-data>
                <div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon icon="mdi:gavel" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">Nothing here yet</div>
                  <div>No policies found.</div>
                </div>
              </template>
              <template #body="{ props }">
                  <q-td key="title" :props="props">
                    <div class="column">
                      <div class="text-weight-bold text-ink ellipsis" style="font-size: 14px;">{{ props.row.title }}</div>
                      <div class="text-muted ellipsis" style="font-size: 12px; margin-top: 2px;">{{ props.row.body }}</div>
                    </div>
                  </q-td>
                  <q-td key="version" :props="props">
                    <q-badge color="grey-2" text-color="ink" class="text-weight-bold q-px-sm" style="border-radius: var(--radius-sm); font-size: 11px;">{{ props.row.version || '—' }}</q-badge>
                  </q-td>
                  <q-td key="status" :props="props">
                    <BadgePill :tone="policyStatusColor(props.row).tone" :label="policyStatusLabel(props.row)" />
                  </q-td>
                  <q-td key="updatedAt" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.effectiveLabel }}</q-td>
                  <q-td key="author" :props="props" class="text-ink text-weight-medium" style="font-size: 13px;">{{ props.row.authorName }}</q-td>
                  <q-td key="actions" :props="props" class="row items-center justify-end q-gutter-x-sm no-wrap">
                    <q-btn flat dense color="grey-6" size="sm" class="custom-radius" @click="openView(props.row)"><Icon icon="mdi:eye" width="18" height="18" /><q-tooltip>View</q-tooltip></q-btn>
                    <q-btn flat dense color="primary" size="sm" class="custom-radius" @click="openEdit(props.row)"><Icon icon="mdi:pencil" width="18" height="18" /><q-tooltip>Edit</q-tooltip></q-btn>
                    <q-btn v-if="!showArchived" flat dense color="grey-7" size="sm" class="custom-radius" @click="archiveItem(props.row)"><Icon icon="mdi:archive-outline" width="18" height="18" /><q-tooltip>Archive</q-tooltip></q-btn>
                    <q-btn v-else flat dense color="primary" size="sm" class="custom-radius" @click="restoreItem(props.row)"><Icon icon="mdi:archive-restore" width="18" height="18" /><q-tooltip>Restore</q-tooltip></q-btn>
                  </q-td>
              </template>
            </DataTable>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </TableCard>

    <!-- Create / Edit dialog -->
    <ComposerDialog
      ref="composerRef"
      :kind="activeTab"
      :edit-row="composerEditRow"
      :create-token="composerCreateToken"
      @saved="fetchAll"
    />

    <!-- View dialog -->
    <q-dialog v-model="viewOpen">
      <q-card class="dialog-card" style="min-width: 480px; max-width: 90vw;">
        <q-bar class="bg-transparent q-px-md q-pt-sm">
          <div class="text-h6 text-weight-bold">{{ view.title }}</div>
          <q-space />
          <q-btn flat round dense icon="close" @click="viewOpen = false" size="sm" />
        </q-bar>
        <q-card-section class="q-gutter-y-sm q-pt-none">
          <div class="row items-center q-gutter-x-sm">
            <BadgePill
              v-if="view.kind === 'announcement'"
              :tone="statusColor(view.status).tone"
              :icon="statusIcon(view.status)"
              :label="statusLabel(view.status)"
            />
            <BadgePill
              v-if="view.kind === 'announcement'"
              :tone="audienceColor(view.audience).tone"
              :label="audienceLabel(view.audience)"
            />
            <q-badge v-if="view.kind === 'policy'" color="grey-2" text-color="ink" class="text-weight-bold q-px-sm" style="border-radius: var(--radius-sm); font-size: 11px;">
              {{ view.version || 'No version' }}
            </q-badge>
          </div>
          <div class="text-muted" style="font-size: 12px;">
            {{ view.kind === 'announcement' ? 'By ' + view.authorName + ' · ' + view.dateLabel : 'By ' + view.authorName + ' · Effective ' + view.effectiveLabel }}
          </div>
          <q-separator />
          <div class="text-ink" style="font-size: 14px; line-height: 1.5; white-space: pre-wrap;">{{ view.body }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>

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
import { type StatusTone } from '@/utils/status.config'
import { fmtDate, announcementStatus } from '@/features/announcements/shared'

const $q = useQuasar()
const notify = useNotify()

const activeTab = ref<'announcements' | 'policies'>('announcements')
const searchQuery = ref('')
const currentPage = ref(1)
const loading = ref(true)
const fetchError = ref('')
const activeFilters = ref<Record<string, any[]>>({})
const showArchived = ref(false)

const tabs = [
  { name: 'announcements', label: 'Announcements' },
  { name: 'policies', label: 'Policies & Guidelines' },
]

// ---- data models (raw Supabase rows joined with author) ----
const announcements = ref<any[]>([])
const policies = ref<any[]>([])

// ---- dialog state (trigger refs for ComposerDialog) ----
const composerRef = ref<InstanceType<typeof ComposerDialog> | null>(null)
const composerEditRow = ref<any | null>(null)
const composerCreateToken = ref(0)
const viewOpen = ref(false)
const view = ref<any>({})

// ---- timestamp helpers (shared) ----
// fmtDate / dateInput / dateToIso / announcementStatus live in
// features/announcements/shared.ts

// ---- fetch ----
async function fetchAll() {
  loading.value = true
  fetchError.value = ''

  try {
    const annSelect = 'id, title, body, audience, published_at, expires_at, archived, author:users ( full_name )'
    const annSelectNoArch = 'id, title, body, audience, published_at, expires_at, author:users ( full_name )'
    const polSelect = 'id, title, body, version, effective_date, archived, creator:users ( full_name )'
    const polSelectNoArch = 'id, title, body, version, effective_date, creator:users ( full_name )'

    // Select with `archived`; if the column hasn't been migrated yet, fall back
    // to a select without it so the page still loads (archive becomes a no-op
    // until the migration is applied).
    let annRes: any = await supabase.from('announcements').select(annSelect).order('published_at', { ascending: false, nullsFirst: false })
    if (annRes.error && (annRes.error as any).code === '42703') {
      annRes = await supabase.from('announcements').select(annSelectNoArch).order('published_at', { ascending: false, nullsFirst: false })
    }
    let polRes: any = await supabase.from('policies').select(polSelect).order('effective_date', { ascending: false })
    if (polRes.error && (polRes.error as any).code === '42703') {
      polRes = await supabase.from('policies').select(polSelectNoArch).order('effective_date', { ascending: false })
    }

    if (annRes.error) throw annRes.error
    if (polRes.error) throw polRes.error

    announcements.value = (annRes.data ?? []).map((a: any) => ({
      ...a,
      archived: !!a.archived,
      status: announcementStatus(a),
      authorName: a.author?.full_name ?? 'Unknown',
      dateLabel: a.published_at ? fmtDate(a.published_at) : (a.expires_at ? 'Draft · expires ' + fmtDate(a.expires_at) : 'Draft'),
      audience: a.audience ?? 'all',
    }))

    policies.value = (polRes.data ?? []).map((p: any) => ({
      ...p,
      archived: !!p.archived,
      authorName: p.creator?.full_name ?? 'Unknown',
      effectiveLabel: fmtDate(p.effective_date),
    }))
  } catch (e) {
    fetchError.value = e instanceof Error ? e.message : 'Failed to load data'
    console.error('Failed to load announcements/policies:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

// ---- computed (filter/paginate per tab) ----
const currentDataArray = computed(() => {
  return activeTab.value === 'announcements' ? announcements.value : policies.value
})

const filteredData = computed(() => {
  let result = currentDataArray.value.filter((item) => showArchived.value ? !!item.archived : !item.archived)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((item) =>
      (item.title ?? '').toLowerCase().includes(q) ||
      (item.body ?? '').toLowerCase().includes(q) ||
      (item.authorName ?? '').toLowerCase().includes(q)
    )
  }
  const f = activeFilters.value
  if (activeTab.value === 'announcements') {
    const statuses = f.status
    if (statuses && statuses.length) result = result.filter((item) => statuses.includes(item.status))
    const audiences = f.audience
    if (audiences && audiences.length) result = result.filter((item) => audiences.includes(item.audience))
  } else {
    const statuses = f.status
    if (statuses && statuses.length) result = result.filter((item) => statuses.includes(policyStatus(item)))
  }
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredData.value.slice(start, start + 10)
})

watch(activeTab, () => {
  searchQuery.value = ''
  activeFilters.value = {}
  showArchived.value = false
  currentPage.value = 1
})

watch(activeFilters, () => {
  currentPage.value = 1
})

const filterConfig = computed(() => {
  if (activeTab.value === 'announcements') {
    return [
      {
        label: 'Status',
        key: 'status',
        options: [
          { label: 'Published', value: 'published' },
          { label: 'Draft', value: 'draft' },
          { label: 'Expired', value: 'expired' },
        ],
      },
      {
        label: 'Audience',
        key: 'audience',
        options: [
          { label: 'All users', value: 'all' },
          { label: 'Students', value: 'students' },
          { label: 'Accommodation Managers', value: 'accommodation_managers' },
        ],
      },
    ]
  }
  return [
    {
      label: 'Status',
      key: 'status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
      ],
    },
  ]
})

function policyStatus(row: any): 'active' | 'draft' {
  const eff = row.effective_date
  const active = eff && new Date(eff).getTime() <= Date.now()
  return active ? 'active' : 'draft'
}

function clearFilters() {
  activeFilters.value = {}
}

// ---- dialog actions ----
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

function openView(row: any) {
  view.value = {
    ...row,
    kind: activeTab.value === 'announcements' ? 'announcement' : 'policy',
    status: row.status ?? announcementStatus(row),
  }
  viewOpen.value = true
}

async function togglePublish(row: any) {
  const publishing = row.status !== 'published'
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id ?? null

  try {
    let error: any = null
    if (publishing) {
      ;({ error } = await supabase.from('announcements').update({
        published_at: new Date().toISOString(),
        author_id: userId ?? row.author_id,
      } as any).eq('id', row.id))
    } else {
      ;({ error } = await supabase.from('announcements').update({ published_at: null } as any).eq('id', row.id))
    }
    if (error) throw error
    notify.success(publishing ? 'Announcement published.' : 'Announcement unpublished.')
    await fetchAll()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update'
    console.error('Toggle publish failed:', e)
    notify.error(msg)
  }
}

async function archiveItem(row: any) {
  const label = activeTab.value === 'announcements' ? 'announcement' : 'policy'
  $q.dialog({
    title: 'Archive ' + label + '?',
    message: '"' + row.title + '" will be moved to the archive. You can restore it later from the Archived view.',
    cancel: { label: 'Cancel', flat: true, color: 'grey-7', noCaps: true },
    ok: { label: 'Archive', unelevated: true, color: 'primary', noCaps: true },
  }).onOk(async () => {
    try {
      const table = activeTab.value === 'announcements' ? 'announcements' : 'policies'
      const { error } = await supabase.from(table).update({ archived: true } as any).eq('id', row.id)
      if (error) throw error
      notify.success(label.charAt(0).toUpperCase() + label.slice(1) + ' archived.')
      await fetchAll()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to archive'
      console.error('Archive failed:', e)
      notify.error(msg)
    }
  })
}

async function restoreItem(row: any) {
  const label = activeTab.value === 'announcements' ? 'announcement' : 'policy'
  try {
    const table = activeTab.value === 'announcements' ? 'announcements' : 'policies'
    const { error } = await supabase.from(table).update({ archived: false } as any).eq('id', row.id)
    if (error) throw error
    notify.success(label.charAt(0).toUpperCase() + label.slice(1) + ' restored.')
    await fetchAll()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to restore'
    console.error('Restore failed:', e)
    notify.error(msg)
  }
}

// ---- display helpers ----
const searchPlaceholder = computed(() => {
  return activeTab.value === 'announcements' ? 'Search announcements...' : 'Search policies & guidelines...'
})

const announcementColumns = [
  { name: 'title', required: true, align: 'left', label: 'Announcement Title', field: 'title', headerStyle: 'width: 35%' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerStyle: 'width: 12%' },
  { name: 'audience', align: 'left', label: 'Audience', field: 'audience', headerStyle: 'width: 14%' },
  { name: 'author', align: 'left', label: 'Author', field: 'authorName', headerStyle: 'width: 13%' },
  { name: 'date', align: 'left', label: 'Publish Date', field: 'dateLabel', headerStyle: 'width: 14%' },
  { name: 'actions', align: 'right', label: '', field: 'actions', headerStyle: 'width: 12%' },
]

const policyColumns = [
  { name: 'title', required: true, align: 'left', label: 'Policy Name', field: 'title', headerStyle: 'width: 40%' },
  { name: 'version', align: 'left', label: 'Version', field: 'version', headerStyle: 'width: 10%' },
  { name: 'status', align: 'left', label: 'Status', field: 'status', headerStyle: 'width: 12%' },
  { name: 'updatedAt', align: 'left', label: 'Effective', field: 'effectiveLabel', headerStyle: 'width: 15%' },
  { name: 'author', align: 'left', label: 'Created By', field: 'authorName', headerStyle: 'width: 13%' },
  { name: 'actions', align: 'right', label: '', field: 'actions', headerStyle: 'width: 10%' },
]

function statusColor(status: string): { tone: StatusTone } {
  if (status === 'published') return { tone: 'success' }
  if (status === 'draft') return { tone: 'warning' }
  return { tone: 'neutral' }
}

function statusIcon(status: string) {
  if (status === 'draft') return 'mdi:note-edit-outline'
  if (status === 'published') return 'mdi:check-circle'
  return 'mdi:archive-outline'
}

function statusLabel(status: string) {
  if (status === 'published') return 'Published'
  if (status === 'draft') return 'Draft'
  return 'Expired'
}

function audienceLabel(audience: string) {
  if (audience === 'all') return 'All users'
  if (audience === 'students') return 'Students'
  if (audience === 'accommodation_managers') return 'Accommodation Managers'
  return audience
}

function audienceColor(audience: string): { tone: StatusTone } {
  if (audience === 'all') return { tone: 'neutral' }
  if (audience === 'students') return { tone: 'info' }
  if (audience === 'accommodation_managers') return { tone: 'primary' }
  return { tone: 'neutral' }
}

function policyStatusColor(row: any): { tone: StatusTone } {
  const eff = row.effective_date
  const active = eff && new Date(eff).getTime() <= Date.now()
  return active ? { tone: 'success' } : { tone: 'warning' }
}

function policyStatusLabel(row: any) {
  const eff = row.effective_date
  const active = eff && new Date(eff).getTime() <= Date.now()
  return active ? 'Active' : 'Draft'
}
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
.dialog-card {
  border-radius: 16px;
}
</style>
