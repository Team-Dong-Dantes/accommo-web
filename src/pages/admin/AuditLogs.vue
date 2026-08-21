<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <!-- Top bar: tabs + actions -->
    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <div class="row q-gutter-x-sm q-mb-md">
        <q-btn
          outline
          color="grey-5"
          text-color="ink"
          no-caps
          class="text-weight-bold bg-surface rounded-button"
        >
          <Icon icon="mdi:calendar-range" class="on-left" width="16" height="16" />Last 30 Days
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          no-caps
          class="text-weight-bold rounded-button"
        >
          <Icon icon="mdi:download" class="on-left" width="16" height="16" />Export
        </q-btn>
      </div>
    </div>

    <div v-if="fetchError" class="text-white bg-negative q-pa-sm q-px-md q-mb-md" style="border-radius: 12px; font-size: 13px;">
      <Icon icon="mdi:alert-circle-outline" class="q-mr-xs" width="16" height="16" style="vertical-align: middle;" />
      Could not load audit logs: {{ fetchError }}
    </div>

    <TableCard
      v-model:search="searchQuery"
      v-model:page="currentPage"
      :filters="[]"
      :active-filters="{ }"
      :search-placeholder="'Search user, action, or target...'"
      :total-label="`${filteredLogs.length} events`"
      :rows="paginatedLogs"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :total-items="filteredLogs.length"
      item-name="events"
      @refresh="fetchLogs"
    >
      <template #empty>
        <div class="full-width row flex-center text-muted q-pa-xl column">
          <Icon icon="mdi:clipboard-text-outline" width="48" height="48" class="q-mb-md" />
          <div class="text-h6 text-weight-bold">No events found</div>
          <div>No audit events matching your criteria.</div>
        </div>
      </template>

      <template #body="{ props }">
        <q-tr :props="props">
          <q-td v-for="col in props.cols" :key="col.name" :props="props" style="white-space: normal; vertical-align: middle;">

            <!-- Timestamp -->
            <div v-if="col.name === 'timestamp'" class="column">
              <div class="text-weight-bold text-ink" style="font-size: 13px;">{{ props.row.date }}</div>
              <div class="text-muted" style="font-size: 11px;">{{ props.row.time }}</div>
            </div>

            <!-- Actor -->
            <div v-else-if="col.name === 'actor'" class="row items-center no-wrap">
              <q-avatar size="48px" :color="props.row.actor.color" text-color="white" class="text-weight-bold q-mr-sm shrink-0" style="border-radius: 8px; font-size: 18px;">
                <Icon v-if="props.row.actor.isSystem" icon="mdi:server" width="16" height="16" />
                <span v-else>{{ props.row.actor.initials }}</span>
              </q-avatar>
              <div class="column">
                <div class="text-weight-bold text-ink ellipsis" style="font-size: 13px;">{{ props.row.actor.name }}</div>
                <div class="text-muted ellipsis" style="font-size: 11px;">{{ props.row.actor.role }}</div>
              </div>
            </div>

            <!-- Action -->
            <div v-else-if="col.name === 'action'">
              <BadgePill
                :tone="getActionColor(props.row.action).tone"
                :label="props.row.action"
              />
            </div>

            <!-- Target -->
            <div v-else-if="col.name === 'target'" class="column">
              <div class="text-weight-bold text-ink ellipsis" style="font-size: 13px;">{{ props.row.target.name }}</div>
              <div class="text-muted ellipsis" style="font-size: 11px;">{{ props.row.target.type }} • {{ props.row.target.id }}</div>
            </div>

            <!-- Details -->
            <div v-else-if="col.name === 'details'" class="text-ink" style="font-size: 13px; line-height: 1.4;">
              <div v-if="props.row.changes">
                <div class="row items-center q-gutter-x-xs no-wrap text-ink">
                  <span>{{ props.row.changes.field }}:</span>
                  <span class="text-weight-bold text-strike text-muted">{{ props.row.changes.old }}</span>
                  <Icon icon="mdi:arrow-right" width="12" height="12" class="text-primary" />
                  <span class="text-weight-bold text-primary">{{ props.row.changes.new }}</span>
                </div>
                <div v-if="props.row.changes.more" class="text-muted" style="font-size: 11px; margin-top: 2px;">
                  {{ props.row.changes.more }}
                </div>
              </div>
              <div v-else class="text-muted ellipsis">
                {{ props.row.description }}
              </div>
            </div>

            <!-- IP -->
            <div v-else-if="col.name === 'ip'" class="text-muted text-weight-medium" style="font-family: var(--font-mono); font-size: 12px;">
              {{ col.value }}
            </div>

          </q-td>
        </q-tr>
      </template>
    </TableCard>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import { type StatusTone } from '@/utils/status.config'

const searchQuery = ref('')
const currentPage = ref(1)
const activeTab = ref('audit-logs')
const loading = ref(true)
const fetchError = ref('')

const tabs = [
  { name: 'audit-logs', label: 'Audit Logs' },
]

async function fetchLogs() {
  loading.value = true
  fetchError.value = ''

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id, action, created_at, entity_id, entity_type, ip_address,
        before_json, after_json,
        actor:users ( full_name, initials, role, avatar_color )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      fetchError.value = error.message
      console.error('Supabase Query Error:', error.message)
    } else if (data) {
      logs.value = (data as any[]).map(mapLog)
    }
  } catch (err) {
    fetchError.value = err instanceof Error ? err.message : String(err)
    console.error('Unexpected error fetching audit logs:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLogs()
  subscribeToLogs()
})

let logsChannel: ReturnType<typeof supabase.channel> | null = null

function subscribeToLogs() {
  // Live updates: new audit_logs rows appear the moment they're written
  // (e.g. after approving/rejecting in Verifications) without a manual refresh.
  logsChannel = supabase
    .channel('audit_logs_live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
      const newRow = payload.new
      if (newRow && newRow.id) void upsertLog(newRow.id)
    })
    .subscribe()
}

// The realtime INSERT payload carries only the raw audit_logs columns — it does
// NOT include the joined `actor:users(...)` relation. Fetch that single row
// (with its actor) and prepend it, deduping by id.
async function upsertLog(id: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      id, action, created_at, entity_id, entity_type, ip_address,
      before_json, after_json,
      actor:users ( full_name, initials, role, avatar_color )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return

  const mapped = mapLog(data as any)
  logs.value = [mapped, ...logs.value.filter((l) => l.id !== id)]
}

onUnmounted(() => {
  if (logsChannel) supabase.removeChannel(logsChannel)
})

const columns = [
  { name: 'timestamp', align: 'left', label: 'Timestamp', field: 'date', headerStyle: 'width: 12%' },
  { name: 'actor', align: 'left', label: 'Actor', field: 'actor', headerStyle: 'width: 18%' },
  { name: 'action', align: 'left', label: 'Action', field: 'action', headerStyle: 'width: 12%' },
  { name: 'target', align: 'left', label: 'Target Entity', field: 'target', headerStyle: 'width: 20%' },
  { name: 'details', align: 'left', label: 'Event Details / Changes', field: 'details', headerStyle: 'width: 26%' },
  { name: 'ip', align: 'left', label: 'IP Address', field: 'ip', headerStyle: 'width: 12%' }
]

const logs = ref<any[]>([])

function label(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

function formatVal(v: unknown) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// Columns that change on *every* write (timestamps/sync bookkeeping) and would
// produce noisy diffs. Skipped so the first meaningful change is surfaced.
const IGNORED_DIFF_KEYS = new Set([
  'updated_at', 'last_login_at', 'created_at', 'email_verified_at',
  'accredited_at', 'verified_at', 'uploaded_at', 'issued_at', 'expires_at'
])

// Full-row snapshot → a single human-readable change line (first meaningful diff).
// Aggregate diffs (beyond the first) are summarized as "+N more fields".
function diffJson(before: any, after: any, entityType: string): any {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return null
  const keys = Object.keys({ ...before, ...after }).filter(k => !IGNORED_DIFF_KEYS.has(k))

  if (keys.length === 0) return null

  const changed = keys.filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
  if (changed.length === 0) return null

  // Prefer a semantic "status" field if it changed, else the first changed field.
  const preferred = changed.find(k => k === 'status') ?? changed[0]!
  const first = {
    field: label(preferred),
    old: formatVal(before[preferred]),
    new: formatVal(after[preferred])
  }
  return changed.length > 1
    ? { ...first, more: `${changed.length - 1} more field${changed.length > 2 ? 's' : ''}` }
    : first
}

// Derive a human-readable name for the affected entity from the full-row snapshot.
function entityDisplayName(entityType: string, row: any): string {
  const json = row && typeof row === 'object' ? row : {}
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = json[k]
      if (v !== null && v !== undefined && v !== '') return String(v)
    }
    return ''
  }
  switch (entityType) {
    case 'users': return pick('full_name', 'email', 'phone')
    case 'student_profiles':
    case 'landlord_profiles':
    case 'admin_profiles': return pick('business_name', 'full_name', 'user_id')
    case 'properties': return pick('name', 'address', 'city')
    case 'rooms': return pick('label', 'room_number', 'room_id')
    case 'leases': return pick('id', 'room_id', 'student_id')
    case 'payments': return pick('description', 'txn_reference', 'id')
    case 'complaints': return pick('subject', 'category', 'id')
    case 'concerns': return pick('description', 'category', 'id')
    case 'announcements': return pick('title', 'id')
    case 'policies': return pick('title', 'version', 'id')
    case 'verification_documents': return pick('filename', 'doc_type', 'id')
    default: return pick('name', 'title', 'label', 'subject', 'id')
  }
}

function mapLog(row: any) {
  const actor = row.actor
  const isSystem = !actor
  const entityType = row.entity_type || 'record'
  const entityTypeLabel = label(entityType)
  const sourceJson = row.after_json || row.before_json || {}
  const entityName = entityDisplayName(entityType, sourceJson) || row.entity_id
  const changes = diffJson(row.before_json, row.after_json, entityType)

  return {
    id: row.id,
    date: fmtDate(row.created_at),
    time: fmtTime(row.created_at),
    action: row.action,
    actor: {
      name: isSystem ? 'System Automator' : (actor.full_name || 'Unknown User'),
      initials: isSystem ? '' : (actor.initials || ''),
      role: isSystem ? 'Automated Process' : label(String(actor.role || '')),
      color: isSystem ? 'grey-8' : (actor.avatar_color || 'teal-7'),
      isSystem
    },
    target: {
      type: entityTypeLabel,
      name: entityName,
      id: row.entity_id
    },
    changes,
    description: changes ? null : `${row.action} on ${entityTypeLabel}`,
    ip: row.ip_address || '—'
  }
}

const filteredLogs = computed(() => {
  let result = [...logs.value]
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(log =>
      log.actor.name.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.target.name.toLowerCase().includes(query) ||
      log.target.id.toLowerCase().includes(query)
    )
  }
  return result
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredLogs.value.slice(start, start + 10)
})

function getActionColor(action: string): { tone: StatusTone } {
  switch(action) {
    case 'CREATE': return { tone: 'success' }
    case 'APPROVE': return { tone: 'success' }
    case 'UPDATE': return { tone: 'info' }
    case 'DELETE': return { tone: 'danger' }
    case 'REJECT': return { tone: 'danger' }
    case 'AUTH': return { tone: 'warning' }
    case 'SYSTEM': return { tone: 'primary' }
    default: return { tone: 'neutral' }
  }
}
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}
</style>
