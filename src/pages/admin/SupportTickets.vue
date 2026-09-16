<template>
  <q-page class="support-tickets-page column no-wrap" style="background-color: var(--c-bg)">
    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="statusFilter" :tabs="tabs" />
    </div>

    <div class="support-tickets-body">
      <TableCard
        v-model:search="search"
        v-model:page="page"
        :loading="loading"
        :total-label="`${tickets.length} total ${tickets.length === 1 ? 'ticket' : 'tickets'}`"
        :rows="tickets"
        :columns="columns"
        row-key="id"
        :total-items="tickets.length"
        item-name="tickets"
        :row-class="(row) => [selectedTicket && selectedTicket.id === row.id ? 'is-active' : '', highlightId === row.id ? 'row-flash' : '', 'cursor-pointer ticket-row'].filter(Boolean).join(' ')"
        @row-click="(row) => selectTicket(row.id)"
        @refresh="fetch"
      >
        <template #empty>
          <div class="full-width row flex-center text-muted q-pa-xl column">
            <Icon icon="lucide:ticket" width="48" height="48" class="q-mb-md" />
            <div class="text-h6 text-weight-bold">No tickets found</div>
            <div v-if="error" class="text-caption q-mt-xs" style="color: var(--c-danger)">{{ error }}</div>
            <div v-else>No support tickets match the current filter.</div>
          </div>
        </template>
        <template #body="{ props }">
            <q-td key="ref" :props="props" class="text-muted text-weight-medium ref-cell" style="font-family: var(--font-mono)">{{ props.row.ref }}</q-td>
            <q-td key="reporter" :props="props">
              <UserInfoCell
                :initials="props.row.initials"
                :name="props.row.reporterName"
                :email="props.row.reporterEmail"
                :subtitle="roleLabel(props.row.reporterRole)"
                :avatar-color="props.row.avatarColor"
                :avatar-url="props.row.avatarUrl"
              />
            </q-td>
            <q-td key="subject" :props="props" class="subject-cell">
              <div class="subject-text">{{ props.row.subject }}</div>
              <div class="subject-preview">{{ props.row.lastPreview }}</div>
            </q-td>
            <q-td key="category" :props="props"><span class="cat-chip">{{ capitalize(props.row.category) }}</span></q-td>
            <q-td key="status" :props="props">
              <BadgePill :tone="getStatus(props.row.status).tone" :icon="getStatus(props.row.status).icon ?? ''" :label="stLabel(props.row.status)" />
            </q-td>
            <q-td key="priority" :props="props">
              <BadgePill :tone="getStatus(props.row.priority).tone" :icon="getStatus(props.row.priority).icon ?? ''" :label="stLabel(props.row.priority)" />
            </q-td>
            <q-td key="updated" :props="props" class="text-muted">{{ getTimeAgo(props.row.updatedAt) }}</q-td>
            <q-td key="unread" :props="props" class="unread-cell">
              <span v-if="props.row.unread > 0" class="unread-badge">{{ props.row.unread }}</span>
            </q-td>
        </template>
      </TableCard>
          </div>

    <TicketWindow
      :ticket="selectedTicket"
      :groups="messageGroups"
      :sending="sending"
      :drill="drill"
      @close="closeWindow"
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
import { Icon } from '@iconify/vue'
import { useTickets } from '@/composables/useTickets'
import { getStatus } from '@/utils/status.config'
import { roleLabel } from '@/utils/format'
import BadgePill from '@/components/user/BadgePill.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import TicketWindow from '@/features/tickets/TicketWindow.vue'
import { stLabel } from '@/features/tickets/types'
import type { MsgGroup } from '@/features/tickets/types'
import type { DrillKind } from '@/features/tickets/TicketWindow.vue'

const {
  loading, error, search, statusFilter, tickets, counts,
  selectedTicket, selectedId, selectTicket, allTickets,
  getTimeAgo, capitalize, fetch,
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
const tabs = computed(() => [
  { name: 'all', label: `All (${counts.value.all})` },
  { name: 'open', label: `Open (${counts.value.open})` },
  { name: 'in_progress', label: `In progress (${counts.value.in_progress})` },
  { name: 'resolved', label: `Resolved (${counts.value.resolved})` },
])
const columns = [
  { name: 'ref', label: 'REF', align: 'left' as const, field: 'ref' },
  { name: 'reporter', label: 'REPORTER', align: 'left' as const, field: 'reporterName' },
  { name: 'subject', label: 'SUBJECT', align: 'left' as const, field: 'subject' },
  { name: 'category', label: 'CATEGORY', align: 'left' as const, field: 'category' },
  { name: 'status', label: 'STATUS', align: 'left' as const, field: 'status' },
  { name: 'priority', label: 'PRIORITY', align: 'left' as const, field: 'priority' },
  { name: 'updated', label: 'UPDATED', align: 'left' as const, field: 'updatedAt' },
  { name: 'unread', label: '', align: 'center' as const, field: 'unread' },
]

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
.support-tickets-body {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ---- Table cell polish (table design preserved) ---- */
.ticket-row.is-active {
  background: var(--c-primary-soft);
  box-shadow: inset 3px 0 0 var(--c-primary);
}
.ref-cell { font-size: 12px; letter-spacing: 0.02em; }
.subject-cell { min-width: 0; }
.subject-text { font-weight: 700; color: var(--c-ink); }
.subject-preview { font-size: 12px; color: var(--c-muted); max-width: 340px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-chip {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-muted);
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  padding: 2px 10px;
  border-radius: 999px;
}
.unread-cell { text-align: center; }
.unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--c-accent);
  border-radius: 999px;
}

.ticket-row.row-flash {
  animation: rowFlash 2.4s ease;
}
@keyframes rowFlash {
  0% { background-color: var(--c-primary-soft, rgba(0, 150, 136, 0.16)); }
  100% { background-color: transparent; }
}
</style>
