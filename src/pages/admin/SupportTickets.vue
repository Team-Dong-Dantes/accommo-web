<template>
  <q-page class="support-tickets-page column no-wrap" style="background-color: var(--c-bg)">
    <div class="row justify-between items-end non-shrink tickets-bar" :class="{ 'is-board': view === 'board' }">
      <!-- The board's columns are the statuses, so it swaps the status tabs for
           the search the table otherwise carries in its own toolbar. -->
      <TabNav v-if="view === 'table'" v-model="statusFilter" :tabs="tabs" />
      <SearchInput v-else v-model="search" placeholder="Search tickets..." />
      <div class="view-toggle">
        <SegmentedToggle v-model="view" :options="VIEW_OPTS" />
      </div>
    </div>

    <div v-if="view === 'board'" class="support-tickets-body">
      <TicketBoard :groups="groups" :selected-id="selectedId" @select="selectTicket" />
    </div>

    <div v-else class="support-tickets-body">
      <TicketTable
        v-model:search="search"
        v-model:page="page"
        :rows="paginatedGroups"
        :total-items="groups.length"
        :total-label="totalLabel"
        :loading="loading"
        :error="error"
        :selected-id="selectedId"
        :highlight-id="highlightId"
        @select="selectTicket"
        @refresh="fetch"
      />
          </div>

    <TicketWindow
      :ticket="selectedTicket"
      :reports="selectedReports"
      :groups="messageGroups"
      :sending="sending"
      :drill="drill"
      @close="closeWindow"
      @select-report="selectTicket"
      @update:status="updateStatus"
      @update:priority="updatePriority"
      @resolve="updateStatus('resolved')"
      @send="onSend"
      @open-drill="(k) => (drill = { kind: k })"
      @view-entity="viewEntity"
      @back-drill="drill = null"
    />

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTickets } from '@/composables/useTickets'
import { groupReports, sortGroups } from '@/utils/ticketTriage'
import TabNav from '@/components/ui/TabNav.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import SegmentedToggle from '@/components/ui/SegmentedToggle.vue'
import TicketBoard from '@/features/tickets/TicketBoard.vue'
import TicketTable from '@/features/tickets/TicketTable.vue'
import TicketWindow from '@/features/tickets/TicketWindow.vue'
import type { MsgGroup } from '@/features/tickets/types'
import type { DrillKind } from '@/features/tickets/TicketWindow.vue'

const {
  loading, error, search, statusFilter, tickets, counts,
  selectedTicket, selectedId, selectTicket, allTickets,
  fetch,
  sendMessage, updateStatus, updatePriority,
} = useTickets()

// Deep-link from a notification: ?focus=ticket:<id> opens the TicketWindow,
// including its message thread, after the inbox data is loaded.
const route = useRoute()
const highlightId = ref('')
async function applyFocus() {
  const raw = (route.query.focus as string) || ''
  const idx = raw.indexOf(':')
  if (idx < 0) return
  const type = raw.slice(0, idx)
  const id = raw.slice(idx + 1)
  if (!id) return
  if (type === 'ticket') {
    const t = allTickets.value.find((x) => x.id === id)
    if (t) {
      statusFilter.value = 'all'
      search.value = ''
      await nextTick()
      selectTicket(id)
      highlightId.value = id
      setTimeout(() => (highlightId.value = ''), 2600)
    }
  }
}
watch([allTickets, () => route.query.focus], applyFocus)
onMounted(async () => {
  await fetch()
  await applyFocus()
})

const page = ref(1)

/* ---- Table / board view, remembered per browser ---- */
const VIEW_KEY = 'accommo:tickets-view'
const VIEW_OPTS = [
  { value: 'table', label: 'Table', icon: 'lucide:table-2' },
  { value: 'board', label: 'Board', icon: 'lucide:kanban' },
]
function storedView(): 'table' | 'board' {
  try {
    return localStorage.getItem(VIEW_KEY) === 'board' ? 'board' : 'table'
  } catch {
    return 'table'
  }
}
const view = ref<string>(storedView())
watch(view, (v) => {
  try { localStorage.setItem(VIEW_KEY, v) } catch { /* non-fatal: just not remembered */ }
  // The board lays every status out side by side; a status tab left on from the
  // table would empty two of its three columns.
  if (v === 'board') statusFilter.value = 'all'
}, { immediate: true })

// One row per incident, in queue order (utils/ticketTriage.ts). Both views
// read this, so the board and the table always agree on what a row is.
const groups = computed(() => sortGroups(groupReports(tickets.value)))

const totalLabel = computed(() => {
  const n = tickets.value.length
  const rows = groups.value.length
  return `${n} ${n === 1 ? 'ticket' : 'tickets'}` + (rows < n ? ` · ${rows} issues` : '')
})

/**
 * Slice like every other table does — the table was once handed the whole list
 * while still rendering a pager, which then changed a `page` nothing read.
 */
const paginatedGroups = computed(() => {
  const start = (page.value - 1) * 10
  return groups.value.slice(start, start + 10)
})

// The other reports of the open ticket's incident, for the drawer's switcher.
const selectedReports = computed(() =>
  groups.value.find((g) => g.reports.some((r) => r.id === selectedId.value))?.reports ?? [],
)

// Filtering or switching tabs can leave the view past the end of a now-shorter
// list, which would render an empty page with the pager showing a valid number.
watch(tickets, () => { page.value = 1 })

const tabs = computed(() => [
  { name: 'all', label: `All (${counts.value.all})` },
  { name: 'open', label: `Open (${counts.value.open})` },
  { name: 'in_progress', label: `In progress (${counts.value.in_progress})` },
  { name: 'resolved', label: `Resolved (${counts.value.resolved})` },
])

/* ---- Ticket window wiring (state lives in the page, view in features/) -- */

const messageGroups = computed<MsgGroup[]>(() => {
  const t = selectedTicket.value
  if (!t || !t.messages) return []
  const byDay = new Map<string, any[]>()
  for (const m of t.messages) {
    const d = new Date(m.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(m)
  }
  const groups: MsgGroup[] = []
  for (const [day] of byDay.entries()) {
    const [y, mo, d] = day.split('-').map(Number)
    groups.push({ day: `${y}-${mo}-${d}`, items: byDay.get(day)! })
  }
  groups.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())
  return groups
})

const sending = ref(false)
async function onSend(body: string, opts: { isInternal: boolean }) {
  const t = selectedTicket.value
  if (!t || sending.value) return
  sending.value = true
  const tempId = 'optimistic-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
  t.messages.push({
    id: tempId,
    authorRole: 'agent',
    authorName: 'You',
    body,
    createdAt: new Date().toISOString(),
    isInternal: opts.isInternal,
  } as any)
  try {
    const ok = await sendMessage(body, { isInternal: opts.isInternal })
    if (!ok) {
      const idx = t.messages.findIndex((m: any) => m.id === tempId)
      if (idx !== -1) t.messages.splice(idx, 1)
    }
  } catch {
    const idx = t.messages.findIndex((m: any) => m.id === tempId)
    if (idx !== -1) t.messages.splice(idx, 1)
  } finally {
    sending.value = false
  }
}

function closeWindow() {
  selectedId.value = null
}

/* ---- Drill panel (right rail) -------------------------------------------- */

const router = useRouter()
const drill = ref<{ kind: DrillKind } | null>(null)

function viewEntity() {
  const k = drill.value?.kind
  if (k === 'accommodation') router.push('/accommodation-hub')
  else if (k === 'room') router.push('/room-hub')
  else router.push('/users')
}
watch(() => selectedTicket.value?.id, () => { drill.value = null })
</script>

<style scoped>
.support-tickets-page {
  padding: var(--sp-4);
  height: 100%;
  gap: 0;
}
.tickets-bar { gap: var(--sp-3); }
/* Lifted off the table: the folder tabs beside it sit flush on the card by
   design, but the toggle is a control, not a tab, and read as fused to it. */
.view-toggle { width: 180px; margin-bottom: var(--sp-2); }
.is-board .view-toggle { margin-bottom: 0; }
.view-toggle :deep(.usr-seg) { margin-bottom: 0; padding: 3px; }
.view-toggle :deep(.usr-seg-btn) { padding: 6px 0; }
.tickets-bar.is-board { align-items: center; margin-bottom: var(--sp-3); }
.support-tickets-body {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

</style>
