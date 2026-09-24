<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <!-- Top bar: tabs + actions -->
    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <div class="row q-gutter-x-sm q-mb-md">
        <DateRangeButton v-model="dateRange" />
        <q-btn
          unelevated
          color="primary"
          no-caps
          class="text-weight-bold rounded-button"
          @click="handleExport"
        >
          <Icon icon="lucide:download" class="on-left" width="16" height="16" />Export
        </q-btn>
      </div>
    </div>

    <div v-if="fetchError" class="text-white bg-negative q-pa-sm q-px-md q-mb-md" style="border-radius: 12px; font-size: 13px;">
      <Icon icon="lucide:circle-alert" class="q-mr-xs" width="16" height="16" style="vertical-align: middle;" />
      Could not load audit logs: {{ fetchError }}
    </div>

    <TableCard
      v-model:search="searchQuery"
      v-model:page="currentPage"
      :filters="filterConfig"
      v-model:active-filters="activeFilters"
      @clear-filters="clearFilters"
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
          <Icon icon="lucide:clipboard" width="48" height="48" class="q-mb-md" />
          <div class="text-h6 text-weight-bold">No events found</div>
          <div>No audit events matching your criteria.</div>
        </div>
      </template>

      <template #body="{ props, rowNumber }">
        <q-td class="row-num-cell">{{ rowNumber }}</q-td>
        <q-td v-for="col in props.cols" :key="col.name" :props="props" style="white-space: normal; vertical-align: middle;">

            <!-- Timestamp -->
            <div v-if="col.name === 'timestamp'" class="column">
              <div class="text-weight-bold text-ink" style="font-size: 13px;">{{ props.row.date }}</div>
              <div class="text-muted" style="font-size: 11px;">{{ props.row.time }}</div>
            </div>

            <!-- Actor -->
            <div v-else-if="col.name === 'actor'" class="row items-center no-wrap">
              <q-avatar size="48px" font-size="18px" :color="props.row.actor.color" text-color="white" class="text-weight-bold q-mr-sm shrink-0" style="border-radius: 8px;">
                <Icon v-if="props.row.actor.isSystem" icon="lucide:server" width="16" height="16" />
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
                  <Icon icon="lucide:arrow-right" width="12" height="12" class="text-primary" />
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
      </template>
    </TableCard>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import DateRangeButton from '@/features/audit/DateRangeButton.vue'
import { mapLog, getActionColor } from '@/features/audit/logMapping'
import { downloadCsv } from '@/utils/csv'

const searchQuery = ref('')
const currentPage = ref(1)
const activeTab = ref('audit-logs')
const loading = ref(true)
const fetchError = ref('')
const activeFilters = ref<Record<string, any[]>>({})
const dateRange = ref<{ from: string; to?: string } | null>(null)

const filterConfig = computed(() => {
  const actions = [...new Set(logs.value.map((l: any) => l.action).filter(Boolean))].sort()
  const types = [...new Set(logs.value.map((l: any) => l.target.type).filter(Boolean))].sort()
  return [
    {
      label: 'Action',
      key: 'action',
      options: actions.map((a: string) => ({ label: a, value: a })),
    },
    {
      label: 'Entity Type',
      key: 'entityType',
      options: types.map((t: string) => ({ label: t, value: t })),
    },
  ]
})

function clearFilters() {
  activeFilters.value = {}
}

function handleExport() {
  downloadCsv(
    'audit_logs_export',
    ['Timestamp', 'Actor', 'Actor Role', 'Action', 'Target Type', 'Target', 'Target ID', 'Details', 'IP Address'],
    filteredLogs.value.map((log: any) => [
      log.createdAt,
      log.actor.name,
      log.actor.role,
      log.action,
      log.target.type,
      log.target.name,
      log.target.id,
      log.changes
        ? `${log.changes.field}: ${log.changes.old} → ${log.changes.new}${log.changes.more ? ` (${log.changes.more})` : ''}`
        : log.description,
      log.ip,
    ]),
  )
}

watch(activeFilters, () => {
  currentPage.value = 1
})

watch(dateRange, () => {
  currentPage.value = 1
})

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

const filteredLogs = computed(() => {
  let result = [...logs.value]
  const f = activeFilters.value
  const actions = f.action
  if (actions && actions.length) result = result.filter((log: any) => actions.includes(log.action))
  const types = f.entityType
  if (types && types.length) result = result.filter((log: any) => types.includes(log.target.type))

  if (dateRange.value && dateRange.value.from) {
    const from = new Date(dateRange.value.from + 'T00:00:00')
    const toStr = dateRange.value.to || dateRange.value.from
    const to = new Date(toStr + 'T23:59:59')
    result = result.filter((log: any) => {
      const d = new Date(log.createdAt)
      return d >= from && d <= to
    })
  }

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

</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}
</style>


