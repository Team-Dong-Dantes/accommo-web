<template>
  <!-- The triage table: one row per incident (grouped reports), ordered by who
       is waiting on OSAS. Status lives in the tabs above, not on the rows. -->
  <TableCard
    :search="search"
    :page="page"
    :loading="loading"
    :total-label="totalLabel"
    :rows="rows"
    :columns="COLUMNS"
    row-key="key"
    :total-items="totalItems"
    item-name="issues"
    :row-class="rowClass"
    @update:search="$emit('update:search', $event)"
    @update:page="$emit('update:page', $event)"
    @row-click="(g: TicketGroup) => $emit('select', g.lead.id)"
    @refresh="$emit('refresh')"
  >
    <template #empty>
      <div class="full-width row flex-center text-muted q-pa-xl column">
        <Icon icon="lucide:ticket" width="48" height="48" class="q-mb-md" />
        <div class="text-h6 text-weight-bold">No tickets found</div>
        <div v-if="error" class="text-caption q-mt-xs" style="color: var(--c-danger)">{{ error }}</div>
        <div v-else>No support tickets match the current filter.</div>
      </div>
    </template>

    <template #body="{ props, rowNumber }">
      <!-- DataTable always draws the "#" header, so every body row carries the cell. -->
      <q-td class="row-num-cell">{{ rowNumber }}</q-td>
      <q-td key="ticket" :props="props" class="tk-ticket tk-grow">
        <div class="tk-subject" :title="props.row.lead.subject">
          {{ props.row.lead.subject }}
          <span v-if="props.row.reports.length > 1" class="tk-reports">{{ props.row.reports.length }} reports</span>
        </div>
        <!-- Two lines, not three: DataTable caps a row at 76px. -->
        <div class="tk-meta" :title="props.row.lead.lastRequesterText">
          <span class="tk-prio" :style="{ color: toneVar(getStatus(props.row.lead.priority).tone) }">{{ stLabel(props.row.lead.priority) }}</span>
          · {{ capitalize(props.row.lead.category) }} · <span class="tk-ref">{{ props.row.lead.ref }}</span>
          <span class="tk-said">— “{{ props.row.lead.lastRequesterText }}”</span>
        </div>
      </q-td>

      <q-td key="where" :props="props" class="tk-where">
        <template v-if="props.row.lead.accommodationName">
          <div class="tk-place" :title="props.row.lead.accommodationName">{{ props.row.lead.accommodationName }}</div>
          <div v-if="props.row.lead.room !== '—'" class="tk-sub">{{ props.row.lead.room }}</div>
        </template>
        <span v-else class="tk-none">—</span>
      </q-td>

      <q-td key="reporter" :props="props" class="tk-reporter">
        <div class="tk-avatars">
          <q-avatar
            v-for="r in props.row.reports.slice(0, 3)"
            :key="r.id"
            size="26px"
            :color="r.avatarColor"
            text-color="white"
            class="tk-av"
          >
            <img v-if="r.avatarUrl" :src="r.avatarUrl" :alt="r.reporterName" />
            <template v-else>{{ r.initials }}</template>
          </q-avatar>
        </div>
        <span class="tk-name" :title="props.row.reports.map((r: Ticket) => r.reporterName).join(', ')">
          {{ props.row.lead.reporterName }}<template v-if="props.row.reports.length > 1"> +{{ props.row.reports.length - 1 }}</template>
        </span>
      </q-td>

      <q-td key="waiting" :props="props" class="tk-waiting">
        <template v-if="props.row.lead.waitingSince">
          <span class="tk-wait" :class="{ 'is-overdue': isOverdue(props.row.lead.waitingSince) }">
            {{ waitAge(props.row.lead.waitingSince) }}
          </span>
          <div v-if="isOverdue(props.row.lead.waitingSince)" class="tk-overdue">Overdue</div>
          <div v-else class="tk-sub">{{ props.row.lead.lastReplyAt ? 'since reply' : 'no reply yet' }}</div>
        </template>
        <template v-else>
          <span class="tk-none">—</span>
          <div v-if="props.row.lead.status === 'resolved'" class="tk-sub">Resolved</div>
          <div v-else-if="props.row.lead.lastReplyAt" class="tk-sub">replied {{ getTimeAgo(props.row.lead.lastReplyAt) }}</div>
        </template>
      </q-td>

      <q-td key="assignee" :props="props" class="tk-assignee">
        <span v-if="props.row.lead.assignee">{{ props.row.lead.assignee }}</span>
        <span v-else class="tk-none">Unassigned</span>
      </q-td>
    </template>
  </TableCard>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import TableCard from '@/components/table/TableCard.vue'
import { getStatus, toneVar } from '@/utils/status.config'
import { capitalize, getTimeAgo } from '@/utils/format'
import { isOverdue, waitAge, type TicketGroup } from '@/utils/ticketTriage'
import type { Ticket } from '@/composables/useTickets'
import { stLabel } from './types'

const props = defineProps<{
  rows: TicketGroup[]
  totalItems: number
  totalLabel: string
  search: string
  page: number
  loading: boolean
  error: string | null
  selectedId: string | null
  highlightId: string
}>()

defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:page', value: number): void
  (e: 'select', id: string): void
  (e: 'refresh'): void
}>()

const COLUMNS = [
  { name: 'ticket', label: 'TICKET', align: 'left' as const, field: 'key', headerClasses: 'tk-grow' },
  { name: 'where', label: 'WHERE', align: 'left' as const, field: 'key' },
  { name: 'reporter', label: 'REPORTER', align: 'left' as const, field: 'key' },
  { name: 'waiting', label: 'WAITING ON US', align: 'left' as const, field: 'key' },
  { name: 'assignee', label: 'ASSIGNEE', align: 'left' as const, field: 'key' },
]

function rowClass(g: TicketGroup) {
  // DataTable asks for the filler rows' class too, and those carry no reports.
  if (!g.reports) return ''
  const ids = g.reports.map((r) => r.id)
  return [
    'cursor-pointer ticket-row',
    `prio-${g.lead.priority}`,
    props.selectedId && ids.includes(props.selectedId) ? 'is-active' : '',
    ids.includes(props.highlightId) ? 'row-flash' : '',
  ].filter(Boolean).join(' ')
}

</script>

<style scoped>
/* Rows and header cells are drawn by DataTable, and TableCard has two root
   elements, so this component's scope reaches neither — :deep() matched
   nothing. :global with the ticket-row / tk- prefixes keeps them contained.

   Priority runs down each row's left edge, so the queue reads for urgency
   before any text does. The tones are the ones the priority badges use. It
   sits on the first cell, not the row: cells paint an opaque background over
   anything the row draws beneath them. */
:global(.ticket-row > td:first-child) { box-shadow: inset 3px 0 0 var(--row-prio, transparent); }
:global(.ticket-row.prio-urgent) { --row-prio: var(--c-danger); }
:global(.ticket-row.prio-high) { --row-prio: color-mix(in srgb, var(--c-danger) 70%, var(--c-warning)); }
:global(.ticket-row.prio-medium) { --row-prio: var(--c-warning); }
:global(.ticket-row.prio-low) { --row-prio: var(--c-info); }
:global(.ticket-row.is-active) { background: var(--c-primary-soft) !important; }
:global(.ticket-row.row-flash) { animation: rowFlash 2.4s ease; }
@keyframes rowFlash {
  0% { background-color: var(--c-primary-soft); }
  100% { background-color: transparent; }
}

/* The ticket column takes the room. */
:global(.tk-grow) { flex: 3 1 0 !important; }
/* DataTable lays every cell out as a centred flex row; these cells stack lines,
   and its rule outranks a scoped one, hence !important. */
.tk-ticket, .tk-where, .tk-waiting { flex-direction: column !important; align-items: flex-start !important; justify-content: center; min-width: 0; }

.tk-subject { display: flex; align-items: center; gap: 8px; max-width: 100%; overflow: hidden; color: var(--c-ink); font-size: 13.5px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.tk-reports { flex-shrink: 0; padding: 1px 8px; border-radius: 999px; background: var(--c-warning-soft); color: var(--c-warning); font-size: 10.5px; font-weight: 800; }
.tk-meta { max-width: 100%; overflow: hidden; margin-top: 2px; color: var(--c-muted); font-size: 11.5px; text-overflow: ellipsis; white-space: nowrap; }
.tk-prio { font-weight: 700; }
.tk-ref { font-family: var(--font-mono); font-size: 11px; }
.tk-said { color: var(--c-text); }

.tk-place { max-width: 100%; overflow: hidden; color: var(--c-ink); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.tk-sub { color: var(--c-muted); font-size: 11.5px; }
.tk-none { color: var(--c-muted); font-size: 12.5px; }

.tk-reporter { gap: 8px; min-width: 0; }
.tk-avatars { display: flex; flex-shrink: 0; }
.tk-av { font-size: 10px; font-weight: 800; box-shadow: 0 0 0 2px var(--c-surface); }
.tk-av + .tk-av { margin-left: -8px; }
.tk-name { overflow: hidden; color: var(--c-ink); font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }

.tk-wait { color: var(--c-ink); font-family: var(--font-display); font-size: 15px; font-weight: 700; }
.tk-wait.is-overdue { color: var(--c-danger); }
.tk-overdue { color: var(--c-danger); font-size: 10.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }

.tk-assignee { color: var(--c-ink); font-size: 13px; font-weight: 600; }
</style>
