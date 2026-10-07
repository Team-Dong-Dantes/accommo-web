<template>
  <!-- The triage table: one row per ticket, one fact per column, ordered by who
       is waiting on OSAS. Which lane it sits in (New / Needs reply / …) lives
       in the tabs above, the same lanes as the board. -->
  <TableCard
    :search="search"
    :page="page"
    :loading="loading"
    :total-label="totalLabel"
    :rows="rows"
    :columns="TICKET_COLUMNS"
    :sort="sort"
    row-key="id"
    :total-items="totalItems"
    item-name="tickets"
    :row-class="rowClass"
    :filters="filters"
    :active-filters="activeFilters"
    @update:search="$emit('update:search', $event)"
    @update:page="$emit('update:page', $event)"
    @update:sort="$emit('update:sort', $event)"
    @update:active-filters="$emit('update:activeFilters', $event)"
    @clear-filters="$emit('update:activeFilters', {})"
    @row-click="(t: Ticket) => $emit('select', t.id)"
    @refresh="$emit('refresh')"
  >
    <template #empty>
      <div class="full-width row flex-center text-muted q-pa-xl column">
        <Icon icon="lucide:ticket" width="48" height="48" class="q-mb-md" />
        <div class="text-h6 text-weight-bold">No tickets found</div>
        <div v-if="error" class="text-caption q-mt-xs" style="color: var(--c-danger)">{{ error }}</div>
        <div v-else>No support tickets match the current tab and filters.</div>
      </div>
    </template>

    <template #body="{ props, rowNumber }">
      <!-- DataTable always draws the "#" header, so every body row carries the cell. -->
      <q-td class="row-num-cell">{{ rowNumber }}</q-td>

      <!-- Two lines per cell at most: DataTable caps a row at 76px. -->
      <q-td key="ticket" :props="props" class="tk-stack tk-grow">
        <div class="tk-line tk-title" :title="props.row.subject">
          <span v-if="props.row.unread" class="tk-unread" aria-label="Unread reply" />
          <span class="tk-ref">{{ props.row.ref }}</span>
          <span class="tk-subject">{{ props.row.subject }}</span>
        </div>
        <div v-if="boardLane(props.row) === 'waiting' && props.row.lastReplyAt" class="tk-line tk-sub">
          You replied {{ getTimeAgo(props.row.lastReplyAt) }}
        </div>
        <div v-else class="tk-line tk-said" :title="props.row.lastRequesterText">“{{ props.row.lastRequesterText }}”</div>
      </q-td>

      <q-td key="requester" :props="props" class="tk-requester tk-wide">
        <q-avatar size="26px" :color="props.row.avatarColor" text-color="white" class="tk-av">
          <img v-if="props.row.avatarUrl" :src="props.row.avatarUrl" :alt="props.row.reporterName" />
          <template v-else>{{ props.row.initials }}</template>
        </q-avatar>
        <div class="tk-stack">
          <div class="tk-line tk-strong" :title="props.row.reporterName">{{ props.row.reporterName }}</div>
          <div class="tk-line tk-sub">{{ props.row.reporterTitle }}</div>
        </div>
      </q-td>

      <q-td key="place" :props="props" class="tk-stack">
        <template v-if="props.row.accommodationName">
          <div class="tk-line tk-strong" :title="props.row.accommodationName">{{ props.row.accommodationName }}</div>
          <div v-if="props.row.room !== '—'" class="tk-line tk-sub">{{ props.row.room }}</div>
        </template>
        <span v-else class="tk-none">—</span>
      </q-td>

      <q-td key="category" :props="props" class="tk-plain tk-narrow">{{ capitalize(props.row.category) }}</q-td>

      <q-td key="priority" :props="props" class="tk-narrow">
        <BadgePill :tone="getStatus(props.row.priority).tone" :icon="getStatus(props.row.priority).icon ?? ''" :label="stLabel(props.row.priority)" />
      </q-td>

      <q-td key="waiting" :props="props" class="tk-stack">
        <template v-if="props.row.waitingSince">
          <span class="tk-wait" :class="{ 'is-overdue': isOverdue(props.row.waitingSince) }">
            {{ waitAge(props.row.waitingSince) }}
          </span>
          <div v-if="isOverdue(props.row.waitingSince)" class="tk-overdue">Overdue</div>
          <div v-else class="tk-sub">{{ props.row.lastReplyAt ? 'since reply' : 'no reply yet' }}</div>
        </template>
        <template v-else>
          <span class="tk-none">—</span>
          <div v-if="props.row.status === 'resolved'" class="tk-sub">Resolved</div>
          <div v-else-if="props.row.lastReplyAt" class="tk-sub">replied {{ getTimeAgo(props.row.lastReplyAt) }}</div>
        </template>
      </q-td>

      <q-td key="assignee" :props="props" class="tk-assignee tk-wide">
        <template v-if="props.row.assignee">
          <span class="tk-ring">{{ getInitials(props.row.assignee) }}</span>
          <span class="tk-line tk-strong" :title="props.row.assignee">{{ props.row.assignee }}</span>
        </template>
        <template v-else>
          <span class="tk-ring is-none" />
          <span class="tk-none">Unassigned</span>
        </template>
      </q-td>
    </template>
  </TableCard>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import TableCard from '@/components/table/TableCard.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import { getStatus } from '@/utils/status.config'
import { capitalize, getInitials, getTimeAgo } from '@/utils/format'
import { boardLane, isOverdue, waitAge } from '@/utils/ticketTriage'
import type { Ticket } from '@/composables/useTickets'
import type { SortState } from '@/composables/useSort'
import { stLabel, TICKET_COLUMNS } from './types'

const props = defineProps<{
  rows: Ticket[]
  totalItems: number
  totalLabel: string
  search: string
  page: number
  loading: boolean
  error: string | null
  selectedId: string | null
  highlightId: string
  filters: { key: string; label: string; options: { label: string; value: string }[] }[]
  activeFilters: Record<string, string[]>
  sort: SortState
}>()

defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:page', value: number): void
  (e: 'update:sort', value: SortState): void
  (e: 'update:activeFilters', value: Record<string, string[]>): void
  (e: 'select', id: string): void
  (e: 'refresh'): void
}>()

function rowClass(t: Ticket) {
  // DataTable asks for the filler rows' class too, and those carry no ticket.
  if (!t.id) return ''
  return [
    'cursor-pointer ticket-row',
    `prio-${t.priority}`,
    t.id === props.selectedId ? 'is-active' : '',
    t.id === props.highlightId ? 'row-flash' : '',
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
/* People columns need room for a full name; category and priority are one word. */
:global(.tk-wide) { flex: 1.4 1 0 !important; }
:global(.tk-narrow) { flex: 0.8 1 0 !important; }
/* DataTable lays every cell out as a centred flex row; these cells stack lines,
   and its rule outranks a scoped one, hence !important. */
.tk-stack { display: flex; flex-direction: column !important; align-items: flex-start !important; justify-content: center; min-width: 0; }
.tk-line { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.tk-title { display: flex; align-items: center; gap: 8px; }
.tk-unread { flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: var(--c-primary); }
.tk-ref { flex-shrink: 0; color: var(--c-muted); font-family: var(--font-mono); font-size: 11px; font-weight: 700; }
.tk-subject { overflow: hidden; color: var(--c-ink); font-size: 13.5px; font-weight: 700; text-overflow: ellipsis; }
.tk-said { margin-top: 2px; color: var(--c-text); font-size: 12px; }

.tk-strong { color: var(--c-ink); font-size: 13px; font-weight: 600; }
.tk-sub { color: var(--c-muted); font-size: 11.5px; }
.tk-none { color: var(--c-muted); font-size: 12.5px; }
.tk-plain { color: var(--c-text); font-size: 13px; }

.tk-requester { gap: 8px; min-width: 0; }
.tk-av { flex-shrink: 0; font-size: 10px; font-weight: 800; }

.tk-wait { color: var(--c-ink); font-family: var(--font-display); font-size: 15px; font-weight: 700; }
.tk-wait.is-overdue { color: var(--c-danger); }
.tk-overdue { color: var(--c-danger); font-size: 10.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }

.tk-assignee { gap: 8px; min-width: 0; }
.tk-ring { display: inline-grid; flex-shrink: 0; place-items: center; width: 24px; height: 24px; border: 1px solid var(--c-border); border-radius: 50%; background: var(--c-surface-2); color: var(--c-ink); font-size: 9.5px; font-weight: 800; }
.tk-ring.is-none { border-style: dashed; background: transparent; }
</style>
