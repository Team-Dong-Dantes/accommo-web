<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <!-- Top bar -->
    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <q-btn
        unelevated
        color="primary"
        no-caps
        class="text-weight-bold rounded-button q-mb-md"
        @click="openCreate()"
      >
        <Icon :icon="activeTab === 'announcements' ? 'mdi:bullhorn' : 'mdi:gavel'" class="on-left" width="18" height="18" />
        {{ activeTab === 'announcements' ? 'New Announcement' : 'New Policy' }}
      </q-btn>
    </div>

    <div v-if="fetchError" class="text-white bg-negative q-pa-sm q-px-md q-mb-md" style="border-radius: 12px; font-size: 13px;">
      <Icon icon="mdi:alert-circle-outline" class="q-mr-xs" width="16" height="16" style="vertical-align: middle;" />
      Could not load {{ activeTab === 'announcements' ? 'announcements' : 'policies' }}: {{ fetchError }}
    </div>

    <TableCard
      v-model:search="searchQuery"
      v-model:page="currentPage"
      :filters="[]"
      :active-filters="{ }"
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
                <q-tr :props="props">
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
                    <q-btn flat dense color="red-5" size="sm" class="custom-radius" @click="remove(props.row)"><Icon icon="mdi:delete" width="18" height="18" /><q-tooltip>Delete</q-tooltip></q-btn>
                  </q-td>
                </q-tr>
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
                <q-tr :props="props">
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
                    <q-btn flat dense color="red-5" size="sm" class="custom-radius" @click="remove(props.row)"><Icon icon="mdi:delete" width="18" height="18" /><q-tooltip>Delete</q-tooltip></q-btn>
                  </q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </TableCard>

    <!-- Create / Edit dialog -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card class="dialog-card" style="min-width: 560px; max-width: 90vw;">
        <q-bar class="bg-transparent q-px-md q-pt-sm">
          <div class="text-h6 text-weight-bold">
            {{ mode === 'create' ? (activeTab === 'announcements' ? 'New Announcement' : 'New Policy') : (activeTab === 'announcements' ? 'Edit Announcement' : 'Edit Policy') }}
          </div>
        </q-bar>

        <q-card-section class="q-gutter-y-md q-pt-none">
          <q-input
            v-model="form.title"
            outlined
            dense
            label="Title"
            :rules="[(v: string) => !!v && v.trim().length > 0 || 'Title is required']"
            autofocus
          />

          <q-input
            v-model="form.body"
            outlined
            type="textarea"
            autogrow
            label="Body"
            :rules="[(v: string) => !!v && v.trim().length > 0 || 'Body is required']"
          />

          <div class="row q-col-gutter-md">
            <q-select
              v-if="activeTab === 'announcements'"
              v-model="form.audience"
              outlined
              dense
              class="col"
              label="Audience"
              :options="audienceOptions"
              emit-value
              map-options
            />
            <q-input
              v-else
              v-model="form.version"
              outlined
              dense
              class="col"
              label="Version (e.g. v1.0)"
            />
          </div>

          <q-input
            v-if="activeTab === 'announcements'"
            v-model="form.expiresAt"
            outlined
            dense
            type="date"
            label="Expires (optional)"
            clearable
            hint="Leave empty for no expiry"
          />
          <q-input
            v-else
            v-model="form.effectiveDate"
            outlined
            dense
            type="date"
            label="Effective date"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat no-caps color="grey-7" label="Cancel" @click="dialogOpen = false" class="rounded-button" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="mode === 'create' ? 'Create' : 'Save changes'"
            :loading="saving"
            @click="save()"
            class="text-weight-bold rounded-button"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
import { type StatusTone } from '@/utils/status.config'

const $q = useQuasar()
const notify = useNotify()

const activeTab = ref<'announcements' | 'policies'>('announcements')
const searchQuery = ref('')
const currentPage = ref(1)
const loading = ref(true)
const fetchError = ref('')

const tabs = [
  { name: 'announcements', label: 'Announcements' },
  { name: 'policies', label: 'Policies & Guidelines' },
]

// ---- data models (raw Supabase rows joined with author) ----
const announcements = ref<any[]>([])
const policies = ref<any[]>([])

// ---- dialog state ----
const dialogOpen = ref(false)
const mode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)
const saving = ref(false)
const viewOpen = ref(false)
const view = ref<any>({})

const form = ref({
  title: '',
  body: '',
  audience: 'all' as 'all' | 'students' | 'landlords',
  expiresAt: null as string | null,
  version: '',
  effectiveDate: null as string | null,
})

const audienceOptions = [
  { label: 'All users', value: 'all' },
  { label: 'Students', value: 'students' },
  { label: 'Landlords', value: 'landlords' },
]

// ---- timestamp helpers ----
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function dateInput(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  // to YYYY-MM-DD in local time
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

function dateToIso(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

function announcementStatus(row: any): 'draft' | 'published' | 'expired' {
  if (row.published_at == null) return 'draft'
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return 'expired'
  return 'published'
}

// ---- fetch ----
async function currentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

async function fetchAll() {
  loading.value = true
  fetchError.value = ''

  try {
    const [annRes, polRes] = await Promise.all([
      supabase.from('announcements').select(`
        id, title, body, audience, published_at, expires_at,
        author:users ( full_name )
      `).order('published_at', { ascending: false, nullsFirst: false }),
      supabase.from('policies').select(`
        id, title, body, version, effective_date,
        creator:users ( full_name )
      `).order('effective_date', { ascending: false }),
    ])

    if (annRes.error) throw annRes.error
    if (polRes.error) throw polRes.error

    announcements.value = (annRes.data ?? []).map((a: any) => ({
      ...a,
      status: announcementStatus(a),
      authorName: a.author?.full_name ?? 'Unknown',
      dateLabel: a.published_at ? fmtDate(a.published_at) : (a.expires_at ? 'Draft · expires ' + fmtDate(a.expires_at) : 'Draft'),
      audience: a.audience ?? 'all',
    }))

    policies.value = (polRes.data ?? []).map((p: any) => ({
      ...p,
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
  let result = [...currentDataArray.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((item) =>
      (item.title ?? '').toLowerCase().includes(q) ||
      (item.body ?? '').toLowerCase().includes(q) ||
      (item.authorName ?? '').toLowerCase().includes(q)
    )
  }
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredData.value.slice(start, start + 10)
})

watch(activeTab, () => {
  searchQuery.value = ''
  currentPage.value = 1
})

// ---- dialog actions ----
function openCreate() {
  mode.value = 'create'
  editingId.value = null
  form.value = {
    title: '',
    body: '',
    audience: 'all',
    expiresAt: null,
    version: '',
    effectiveDate: dateInput(new Date().toISOString()),
  }
  dialogOpen.value = true
}

function openEdit(row: any) {
  mode.value = 'edit'
  editingId.value = row.id
  if (activeTab.value === 'announcements') {
    form.value = {
      title: row.title,
      body: row.body,
      audience: row.audience ?? 'all',
      expiresAt: dateInput(row.expires_at),
      version: '',
      effectiveDate: null,
    }
  } else {
    form.value = {
      title: row.title,
      body: row.body,
      audience: 'all',
      expiresAt: null,
      version: row.version ?? '',
      effectiveDate: dateInput(row.effective_date),
    }
  }
  dialogOpen.value = true
}

function openView(row: any) {
  view.value = {
    ...row,
    kind: activeTab.value === 'announcements' ? 'announcement' : 'policy',
    status: row.status ?? announcementStatus(row),
  }
  viewOpen.value = true
}

async function save() {
  if (!form.value.title.trim() || !form.value.body.trim()) {
    notify.error('Title and body are required.')
    return
  }

  saving.value = true
  const userId = await currentUserId()

  try {
    if (activeTab.value === 'announcements') {
      const payload: Record<string, any> = {
        title: form.value.title.trim(),
        body: form.value.body.trim(),
        audience: form.value.audience,
        expires_at: dateToIso(form.value.expiresAt),
      }
      let error: any = null
      if (mode.value === 'create') {
        if (!userId) throw new Error('Not signed in')
        ;({ error } = await supabase.from('announcements').insert({ ...payload, author_id: userId } as any))
      } else {
        ;({ error } = await supabase.from('announcements').update(payload as any).eq('id', editingId.value!))
      }
      if (error) throw error
      notify.success(mode.value === 'create' ? 'Announcement created as draft.' : 'Announcement updated.')
    } else {
      const payload: Record<string, any> = {
        title: form.value.title.trim(),
        body: form.value.body.trim(),
        version: form.value.version.trim() || null,
        effective_date: dateToIso(form.value.effectiveDate),
      }
      let error: any = null
      if (mode.value === 'create') {
        if (!userId) throw new Error('Not signed in')
        ;({ error } = await supabase.from('policies').insert({ ...payload, created_by: userId } as any))
      } else {
        ;({ error } = await supabase.from('policies').update(payload as any).eq('id', editingId.value!))
      }
      if (error) throw error
      notify.success(mode.value === 'create' ? 'Policy created.' : 'Policy updated.')
    }

    dialogOpen.value = false
    await fetchAll()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save'
    console.error('Save failed:', e)
    notify.error(msg)
  } finally {
    saving.value = false
  }
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

async function remove(row: any) {
  $q.dialog({
    title: 'Delete ' + (activeTab.value === 'announcements' ? 'announcement' : 'policy') + '?',
    message: 'This will permanently remove "' + row.title + '". This action cannot be undone.',
    cancel: { label: 'Cancel', flat: true, color: 'grey-7', noCaps: true },
    ok: { label: 'Delete', unelevated: true, color: 'negative', noCaps: true },
  }).onOk(async () => {
    try {
      const table = activeTab.value === 'announcements' ? 'announcements' : 'policies'
      const { error } = await supabase.from(table).delete().eq('id', row.id)
      if (error) throw error
      notify.success('Deleted.')
      await fetchAll()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete'
      console.error('Delete failed:', e)
      notify.error(msg)
    }
  })
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
  if (audience === 'landlords') return 'Landlords'
  return audience
}

function audienceColor(audience: string): { tone: StatusTone } {
  if (audience === 'all') return { tone: 'neutral' }
  if (audience === 'students') return { tone: 'info' }
  if (audience === 'landlords') return { tone: 'primary' }
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
.dialog-card {
  border-radius: 16px;
}
</style>
