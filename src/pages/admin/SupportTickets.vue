<template>
  <q-page class="support-tickets-page column no-wrap" style="background-color: var(--c-bg)">
    <div class="row justify-between items-end non-shrink tickets-bar" :class="{ 'is-board': view === 'board' }">
      <!-- The table's tabs are the board's columns; the board shows them all at
           once, so it carries the search the table keeps in its own toolbar. -->
      <TabNav v-if="view === 'table'" v-model="laneTab" :tabs="tabs" />
      <SearchInput v-else v-model="search" placeholder="Search tickets..." />
      <div class="view-toggle">
        <SegmentedToggle v-model="view" :options="VIEW_OPTS" />
      </div>
    </div>

    <div class="support-tickets-body" :class="{ 'is-board': view === 'board' }">
      <template v-if="view === 'board'">
        <BoardViews v-model:view="boardView" v-model:category="boardCategory" :views="viewCounts" :categories="categoryCounts" />
        <TicketBoard
          :tickets="boardRows"
          :selected-id="selectedId"
          @select="selectTicket"
          @claim="claim"
          @resolve="(g) => (resolving = g)"
          @reopen="(ids) => setStatus(ids, 'open')"
        />
      </template>
      <TicketTable
        v-else
        v-model:search="search"
        v-model:page="page"
        v-model:active-filters="tableFilters"
        v-model:sort="sort"
        :filters="filterConfig"
        :rows="paginatedRows"
        :total-items="tableRows.length"
        :total-label="totalLabel"
        :loading="loading"
        :error="error"
        :selected-id="selectedId"
        :highlight-id="highlightId"
        @select="selectTicket"
        @refresh="fetch"
      />

      <!-- A right-hand detail drawer over the board or table. -->
      <TicketWindow
        :ticket="selectedTicket"
        :groups="messageGroups"
        :sending="sending"
        :drill="drill"
        :agents="agents"
        :me-id="currentUserId"
        @close="closeWindow"
        @update:status="onStatusPick"
        @update:priority="updatePriority"
        @update:assignee="assignTo"
        @resolve="askResolveSelected"
        @send="onSend"
        @open-drill="(k) => (drill = { kind: k })"
        @view-entity="viewEntity"
        @back-drill="drill = null"
      />
    </div>

    <ResolveDialog
      :ticket="resolving"
      :busy="resolvingBusy"
      @resolve="confirmResolve"
      @cancel="resolving = null"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTickets } from '@/composables/useTickets'
import { sortTickets, isOverdue, boardLane, type BoardLane } from '@/utils/ticketTriage'
import type { Ticket } from '@/composables/useTickets'
import TabNav from '@/components/ui/TabNav.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import SegmentedToggle from '@/components/ui/SegmentedToggle.vue'
import TicketBoard from '@/features/tickets/TicketBoard.vue'
import BoardViews, { type BoardView } from '@/features/tickets/BoardViews.vue'
import ResolveDialog from '@/features/tickets/ResolveDialog.vue'
import TicketTable from '@/features/tickets/TicketTable.vue'
import TicketWindow from '@/features/tickets/TicketWindow.vue'
import { PRIORITY_OPTS, TICKET_COLUMNS, type MsgGroup } from '@/features/tickets/types'
import { useSort } from '@/composables/useSort'
import { capitalize } from '@/utils/format'
import { counted } from '@/utils/filterOptions'
import type { DrillKind } from '@/features/tickets/TicketWindow.vue'

const {
  loading, error, search, tickets,
  selectedTicket, selectedId, selectTicket, allTickets,
  fetch, agents, currentUserId,
  sendMessage, updateStatus, updatePriority, setStatus, assignTo, claim,
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
      laneTab.value = 'all'
      tableFilters.value = {}
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
})

// One row per ticket, in queue order (utils/ticketTriage.ts). Both views read
// this, so the board and the table always agree.
const rows = computed(() => sortTickets(tickets.value))

/* ---- Board: saved views and category ---- */
const boardView = ref<BoardView>('all')
const boardCategory = ref('')
const inView = (t: Ticket, v: BoardView) =>
  v === 'mine' ? t.assigneeId === currentUserId.value
  : v === 'unassigned' ? !t.assigneeId && t.status !== 'resolved'
  : v === 'overdue' ? isOverdue(t.waitingSince)
  : true
const inCategory = (t: Ticket) => !boardCategory.value || t.category === boardCategory.value
const boardRows = computed(() => rows.value.filter((t) => inView(t, boardView.value) && inCategory(t)))
const viewCounts = computed(() => {
  const base = rows.value.filter(inCategory)
  const n = (v: BoardView) => base.filter((t) => inView(t, v)).length
  return [
    { value: 'all' as const, label: 'All tickets', icon: 'lucide:inbox', count: n('all') },
    { value: 'mine' as const, label: 'Assigned to me', icon: 'lucide:user-round-check', count: n('mine') },
    { value: 'unassigned' as const, label: 'Unassigned', icon: 'lucide:user-round-x', count: n('unassigned') },
    { value: 'overdue' as const, label: 'Overdue', icon: 'lucide:alarm-clock', count: n('overdue') },
  ]
})
const categoryCounts = computed(() => {
  const by = new Map<string, number>()
  for (const t of rows.value) if (inView(t, boardView.value)) by.set(t.category, (by.get(t.category) ?? 0) + 1)
  return [...by].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)
})

/* ---- Resolve: always through the prompt, since it notifies the requester ---- */
const resolving = ref<Ticket | null>(null)
const resolvingBusy = ref(false)
function askResolveSelected() {
  resolving.value = selectedTicket.value
}
function onStatusPick(status: string) {
  if (status === 'resolved') askResolveSelected()
  else void updateStatus(status)
}
async function confirmResolve(note: string) {
  const t = resolving.value
  if (!t || resolvingBusy.value) return
  resolvingBusy.value = true
  try {
    if (note) await sendMessage(note, { ticketId: t.id })
    if (await setStatus([t.id], 'resolved')) resolving.value = null
  } finally {
    resolvingBusy.value = false
  }
}

/* ---- Table: lane tabs, the Filter menu, pagination ---- */
const laneTab = ref<'all' | BoardLane>('all')
const tableFilters = ref<Record<string, string[]>>({})

const tabs = computed(() => {
  const n = (lane: BoardLane) => rows.value.filter((t) => boardLane(t) === lane).length
  return [
    { name: 'all', label: `All (${rows.value.length})` },
    { name: 'new', label: `New (${n('new')})` },
    { name: 'needs_reply', label: `Needs reply (${n('needs_reply')})` },
    { name: 'waiting', label: `Waiting (${n('waiting')})` },
    { name: 'resolved', label: `Resolved (${n('resolved')})` },
  ]
})

// Counted over the open tab's tickets: an option that would show nothing isn't offered.
const filterConfig = computed(() => {
  const lane = rows.value.filter((t) => laneTab.value === 'all' || boardLane(t) === laneTab.value)
  const SHOW = [
    { label: 'Assigned to me', value: 'mine' },
    { label: 'Unassigned', value: 'unassigned' },
    { label: 'Overdue', value: 'overdue' },
  ]
  return [
    { key: 'show', label: 'Show', options: SHOW
      .map((o) => ({ ...o, n: lane.filter((t) => inView(t, o.value as BoardView)).length }))
      .filter((o) => o.n > 0)
      .map((o) => ({ label: `${o.label} (${o.n})`, value: o.value })) },
    { key: 'category', label: 'Category', options: counted(lane, 'category', capitalize) },
    { key: 'priority', label: 'Priority', options: counted(lane, 'priority', (v) => PRIORITY_OPTS.find((o) => o.value === v)?.label ?? capitalize(v), PRIORITY_OPTS.map((o) => o.value)) },
  ]
})

/** Any ticked option within a group, every group that has one ticked. */
const tableRows = computed(() => {
  const { show = [], category = [], priority = [] } = tableFilters.value
  return rows.value.filter((t) =>
    (laneTab.value === 'all' || boardLane(t) === laneTab.value) &&
    (!show.length || show.some((v) => inView(t, v as BoardView))) &&
    (!category.length || category.includes(t.category)) &&
    (!priority.length || priority.includes(t.priority)))
})

const totalLabel = computed(() => {
  const n = tableRows.value.length
  return `${n} ${n === 1 ? 'ticket' : 'tickets'}`
})

/**
 * Slice like every other table does — the table was once handed the whole list
 * while still rendering a pager, which then changed a `page` nothing read.
 */
const { sort, sorted: sortedRows } = useSort(() => tableRows.value, () => TICKET_COLUMNS)

const paginatedRows = computed(() => {
  const start = (page.value - 1) * 10
  return sortedRows.value.slice(start, start + 10)
})

// A new tab, filter or search starts at the first page. A live refetch must
// not (it used to reset on every change to `tickets`); it only pulls the page
// back if the list shrank past it.
watch([laneTab, tableFilters, search, sort], () => { page.value = 1 })
watch(() => tableRows.value.length, (n) => {
  page.value = Math.min(page.value, Math.max(1, Math.ceil(n / 10)))
})

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
  // Each day is labelled by its first message's own timestamp. It used to be
  // rebuilt from the key, whose month is getMonth()'s zero-based one, so every
  // date rule read a month early ("Aug 15" above a Sep 15 message).
  const groups: MsgGroup[] = [...byDay.values()].map((items) => ({ day: items[0].createdAt, items }))
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
/* Views rail | lanes, side by side. */
.support-tickets-body.is-board { flex-direction: row; gap: var(--sp-3); }

</style>
