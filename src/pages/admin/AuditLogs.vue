<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">
    <!-- Top bar: tabs + actions -->
    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <div class="row items-center q-gutter-x-sm q-mb-md">
        <DateRangeButton v-model="dateRange" />
        <q-btn unelevated color="primary" no-caps class="text-weight-bold rounded-button" @click="handleExport">
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
      search-placeholder="Search people, records or events..."
      :total-label="`${filteredLogs.length} events`"
      :loading="loading"
      :total-items="filteredLogs.length"
      :rows-per-page="PAGE"
      item-name="events"
      @refresh="fetchLogs()"
    >
      <template #panels>
        <div class="al-split">
          <AuditRail
            v-model:area="area"
            v-model:person="person"
            v-model:automated="showAutomated"
            class="al-rail"
            :total="railBase.length"
            :area-counts="areaCounts"
            :admins="admins"
            :people="people"
          />

          <div class="al-feed">
            <div v-if="loading" class="q-pa-md">
              <q-skeleton v-for="n in 8" :key="n" type="rect" height="44px" class="q-mb-sm" style="border-radius: 10px;" />
            </div>
    
            <div v-else-if="!filteredLogs.length" class="full-width row flex-center text-muted q-pa-xl column">
              <Icon icon="lucide:clipboard" width="48" height="48" class="q-mb-md" />
              <div class="text-h6 text-weight-bold">No events found</div>
              <div>{{ showAutomated ? 'No audit events match your criteria.' : 'No actions by people match. Try turning on automated events.' }}</div>
            </div>
    
            <div v-else class="al-list">
              <section v-for="day in pageDays" :key="day.key">
                <h3 class="al-day">{{ day.label }}</h3>
                <button v-for="ev in day.events" :key="ev.id" type="button" class="al-row" @click="selected = ev">
                  <span class="al-time">{{ ev.time }}</span>
                  <span class="al-track"><span class="al-dot" :style="{ background: toneVar(getActionColor(ev)) }" /></span>
                  <q-avatar size="30px" font-size="12px" :color="ev.actor.color" text-color="white" class="text-weight-bold al-avatar">
                    <Icon v-if="ev.actor.isSystem" icon="lucide:server" width="14" height="14" />
                    <span v-else>{{ ev.actor.initials || ev.actor.name.slice(0, 1) }}</span>
                  </q-avatar>
                  <span class="al-text">
                    <span class="al-sentence">
                      <b>{{ ev.actor.name }}</b> {{ ev.verb }}<template v-if="ev.sentence !== ev.actor.name + ' ' + ev.verb"> {{ ev.entityLabel }}<b v-if="ev.name"> “{{ ev.name }}”</b></template>
                    </span>
                    <span v-if="ev.hint" class="al-hint">{{ ev.hint }}</span>
                  </span>
                  <span v-if="!area" class="al-area">{{ AREA_LABEL[ev.area] }}</span>
                  <Icon icon="lucide:chevron-right" width="16" height="16" class="al-chev" />
                </button>
              </section>
    
              <div v-if="isLastPage && hasMore" class="row justify-center q-py-md">
                <q-btn flat no-caps color="primary" :loading="loadingOlder" label="Load older events" @click="loadOlder" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </TableCard>

    <AuditDrawer :event="selected" @close="selected = null" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import DateRangeButton from '@/features/audit/DateRangeButton.vue'
import AuditDrawer from '@/features/audit/AuditDrawer.vue'
import { AUDIT_COLUMNS, fetchAuditEvent, fillNames } from '@/api/audit'
import AuditRail, { type RailPerson } from '@/features/audit/AuditRail.vue'
import {
  AREA_LABEL, dayLabelOf, getActionColor, mapLog, type AuditArea, type AuditEvent,
} from '@/features/audit/logMapping'
import { toneVar } from '@/utils/status.config'
import { downloadCsv } from '@/utils/csv'

const PAGE = 15
const BATCH = 1000

const tabs = [{ name: 'audit-logs', label: 'Audit Logs' }]
const activeTab = ref('audit-logs')
const searchQuery = ref('')
const currentPage = ref(1)
const loading = ref(true)
const loadingOlder = ref(false)
const fetchError = ref('')
const area = ref<AuditArea | null>(null)
const person = ref<string | null>(null)
const dateRange = ref<{ from: string; to?: string } | null>(null)
const showAutomated = ref(false)
const selected = ref<AuditEvent | null>(null)

const logs = ref<AuditEvent[]>([])
// created_at of the oldest row loaded, as stored — the cursor for "Load older".
const oldestRaw = ref<string | null>(null)
const hasMore = ref(false)

// The window the server is asked for. created_at is UTC without a zone, so an
// ISO (UTC) bound compares correctly. Default: the last 30 days.
function windowBounds(): { from: string; to: string | null } {
  if (dateRange.value?.from) {
    const to = new Date((dateRange.value.to || dateRange.value.from) + 'T00:00:00')
    to.setDate(to.getDate() + 1)
    return { from: new Date(dateRange.value.from + 'T00:00:00').toISOString(), to: to.toISOString() }
  }
  return { from: new Date(Date.now() - 30 * 86_400_000).toISOString(), to: null }
}

async function fetchBatch(before: string | null) {
  const { from, to } = windowBounds()
  let q = supabase.from('audit_logs').select(AUDIT_COLUMNS).gte('created_at', from)
  if (to) q = q.lt('created_at', to)
  if (before) q = q.lt('created_at', before)
  const { data, error } = await q.order('created_at', { ascending: false }).limit(BATCH)
  if (error) throw error
  const rows = (data ?? []) as any[]
  hasMore.value = rows.length === BATCH
  if (rows.length) oldestRaw.value = rows[rows.length - 1].created_at
  return fillNames(rows.map(mapLog))
}

async function fetchLogs() {
  loading.value = true
  fetchError.value = ''
  oldestRaw.value = null
  try {
    logs.value = await fetchBatch(null)
  } catch (err) {
    fetchError.value = (err as { message?: string })?.message || String(err)
    console.error('Error fetching audit logs:', err)
  } finally {
    loading.value = false
  }
}

async function loadOlder() {
  loadingOlder.value = true
  try {
    const older = await fetchBatch(oldestRaw.value)
    logs.value = [...logs.value, ...older]
  } catch (err) {
    fetchError.value = (err as { message?: string })?.message || String(err)
  } finally {
    loadingOlder.value = false
  }
}

// Everything but the rail's own choices: the rail counts against this, so each
// count says what clicking it would show.
const railBase = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return logs.value.filter((l) =>
    !l.noop
    && (showAutomated.value || !l.actor.isSystem)
    && (!q || (l.sentence + ' ' + l.hint + ' ' + l.entityId).toLowerCase().includes(q)))
})

const areaCounts = computed(() => {
  const counts: Partial<Record<AuditArea, number>> = {}
  for (const l of railBase.value) {
    if (!person.value || l.actor.key === person.value) counts[l.area] = (counts[l.area] ?? 0) + 1
  }
  return counts
})

// Every admin account, so the rail lists the whole OSAS team — including anyone
// with nothing in the window. Loaded once; the counts come from the events.
const adminAccounts = ref<{ id: string; full_name: string; initials: string | null; avatar_color: string | null }[]>([])

const actorCounts = computed(() => {
  const byKey = new Map<string, RailPerson>()
  for (const l of railBase.value) {
    if (area.value && l.area !== area.value) continue
    const p = byKey.get(l.actor.key)
    if (p) p.count++
    else byKey.set(l.actor.key, { key: l.actor.key, name: l.actor.name, initials: l.actor.initials, color: l.actor.color, isSystem: l.actor.isSystem, count: 1 })
  }
  return byKey
})

const admins = computed<RailPerson[]>(() => adminAccounts.value
  .map((a) => ({
    key: a.id,
    name: a.full_name,
    initials: a.initials ?? '',
    color: a.avatar_color || 'teal-7',
    isSystem: false,
    count: actorCounts.value.get(a.id)?.count ?? 0,
  }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)))

const people = computed<RailPerson[]>(() => {
  const adminIds = new Set(adminAccounts.value.map((a) => a.id))
  return [...actorCounts.value.values()].filter((p) => !adminIds.has(p.key)).sort((a, b) => b.count - a.count)
})

const filteredLogs = computed(() => railBase.value.filter((l) =>
  (!area.value || l.area === area.value) && (!person.value || l.actor.key === person.value)))

const isLastPage = computed(() => currentPage.value >= Math.ceil(filteredLogs.value.length / PAGE))

const pageDays = computed(() => {
  const start = (currentPage.value - 1) * PAGE
  const days: { key: string; label: string; events: AuditEvent[] }[] = []
  for (const ev of filteredLogs.value.slice(start, start + PAGE)) {
    const last = days[days.length - 1]
    if (last?.key === ev.dayKey) last.events.push(ev)
    else days.push({ key: ev.dayKey, label: dayLabelOf(ev.dayKey), events: [ev] })
  }
  return days
})

watch([area, person, showAutomated, searchQuery], () => { currentPage.value = 1 })
// Hiding automated events hides "System"; don't leave it selected with nothing to show.
watch(showAutomated, (on) => { if (!on && person.value === 'system') person.value = null })
watch(dateRange, () => { currentPage.value = 1; void fetchLogs() })

function handleExport() {
  downloadCsv(
    'audit_logs_export',
    ['Time (Manila)', 'Actor', 'Event', 'Changes', 'Record ID', 'IP Address'],
    filteredLogs.value.map((l) => [
      new Date(l.at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      l.actor.name,
      l.sentence,
      l.changes.map((c) => `${c.field}: ${c.old} → ${c.new}`).join('; '),
      l.entityId,
      l.ip,
    ]),
  )
}

// Live updates: the realtime payload lacks the joined actor, so fetch the one
// row with it and prepend.
let logsChannel: ReturnType<typeof supabase.channel> | null = null

onMounted(() => {
  void fetchLogs()
  void supabase.from('users').select('id, full_name, initials, avatar_color').eq('role', 'admin')
    .then(({ data }) => { adminAccounts.value = data ?? [] })
  logsChannel = supabase
    .channel('audit_logs_live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
      if (payload.new?.id) void upsertLog(payload.new.id)
    })
    .subscribe()
})

onUnmounted(() => {
  if (logsChannel) supabase.removeChannel(logsChannel)
})

async function upsertLog(id: string) {
  const ev = await fetchAuditEvent(id).catch(() => null)
  if (!ev) return
  logs.value = [ev, ...logs.value.filter((l) => l.id !== id)]
}
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}
.al-split { display: flex; height: 100%; min-height: 0; }
.al-rail { flex: 0 0 232px; }
.al-feed { flex: 1 1 auto; min-width: 0; overflow-y: auto; }
.al-list { padding: 4px 12px 12px; }
.al-day {
  position: sticky;
  top: 0;
  z-index: 1;
  margin: 0;
  padding: 12px 8px 6px;
  background: var(--c-surface);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--c-muted);
}
.al-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 8px;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
  border-radius: 8px;
}
.al-row:hover { background: var(--c-surface-2); }
.al-row:focus-visible { outline: 2px solid var(--c-primary); outline-offset: -2px; }
.al-time {
  flex: 0 0 64px;
  font-size: 12px;
  color: var(--c-muted);
  font-variant-numeric: tabular-nums;
}
/* The timeline: a line through each day's events, a dot per event. The track
   bleeds into the row padding so the line runs unbroken from row to row. */
.al-track {
  position: relative;
  flex: 0 0 12px;
  align-self: stretch;
  margin: -9px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.al-track::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: var(--c-border);
}
section .al-row:first-of-type .al-track::before { top: 50%; }
section .al-row:last-of-type .al-track::before { bottom: 50%; }
.al-dot {
  position: relative;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--c-surface);
}
.al-avatar { flex: none; border-radius: 8px; }
.al-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.al-sentence {
  font-size: 13.5px;
  color: var(--c-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.al-sentence b { font-weight: 650; }
.al-hint {
  font-size: 12px;
  color: var(--c-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.al-area {
  flex: none;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-muted);
  padding: 2px 8px;
  border: 1px solid var(--c-border);
  border-radius: 999px;
}
.al-chev { flex: none; color: var(--c-muted); }
</style>
