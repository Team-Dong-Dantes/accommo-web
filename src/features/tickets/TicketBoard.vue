<template>
  <!-- Workflow board: columns are who owes the next move (utils/ticketTriage
       boardLane), not the status field, so replying moves a card on its own.
       Dragging only does what a drop can honestly mean — claim, resolve,
       reopen — and a column that can't take the card never lights up. -->
  <div class="board">
    <section
      v-for="col in columns"
      :key="col.lane"
      class="lane"
      :class="[`lane--${col.lane}`, { 'is-open': col.lane !== 'resolved' || resolvedOpen, 'is-drop': dropLane === col.lane, 'is-target': dragged && canDrop(dragged, col.lane) }]"
      :aria-label="`${col.label}: ${col.total} tickets`"
      @dragover="onDragOver($event, col.lane)"
      @dragleave="onDragLeave($event, col.lane)"
      @drop.prevent="onDrop(col.lane)"
    >
      <!-- Resolved folds to a slim rail; it still takes drops while folded.
           The column's width slides (CSS flex transition) while its contents
           cross-fade, so it opens like a drawer rather than snapping. -->
      <Transition name="lane-swap" mode="out-in">
        <button
          v-if="col.lane === 'resolved' && !resolvedOpen"
          key="rail"
          type="button"
          class="rail"
          :aria-label="`Show resolved tickets (${col.recent} in the last 7 days)`"
          @click="resolvedOpen = true"
        >
          <Icon icon="lucide:chevrons-left" width="16" height="16" />
          <span class="rail-count">{{ col.recent }}</span>
          <span class="rail-label">Resolved · 7 days</span>
        </button>

        <div v-else key="open" class="lane-inner">
          <header class="lane-head">
            <span class="lane-dot" />
            <h2>{{ col.label }}</h2>
            <span class="lane-count">{{ col.total }}</span>
            <button v-if="col.lane === 'resolved'" type="button" class="lane-fold" aria-label="Fold resolved" @click="resolvedOpen = false">
              <Icon icon="lucide:chevrons-right" width="16" height="16" />
            </button>
          </header>
          <p class="lane-hint">
            <span class="lane-hint-text">{{ col.hint }}</span>
            <span v-if="col.overdue" class="lane-overdue">{{ col.overdue }} overdue</span>
          </p>

          <div class="lane-body">
            <BoardCard
              v-for="g in col.items"
              :key="g.id"
              :ticket="g"
              :lane="col.lane"
              :active="g.id === selectedId"
              :dragging="dragged?.id === g.id"
              @click="$emit('select', g.id)"
              @dragstart="onDragStart($event, g)"
              @dragend="onDragEnd"
            />
            <div v-if="!col.total" class="lane-empty">{{ col.empty }}</div>
            <button v-if="col.older" type="button" class="lane-more" @click="showOlder = !showOlder">
              {{ showOlder ? 'Hide older' : `Show ${col.older} older` }}
            </button>
          </div>
        </div>
      </Transition>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { boardLane, isOverdue, waitingSince, type BoardLane } from '@/utils/ticketTriage'
import type { Ticket } from '@/composables/useTickets'
import BoardCard from './BoardCard.vue'

const props = defineProps<{ tickets: Ticket[]; selectedId: string | null }>()
const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'claim', ids: string[]): void
  (e: 'resolve', ticket: Ticket): void
  (e: 'reopen', ids: string[]): void
}>()

const LANES: { lane: BoardLane; label: string; hint: string; empty: string }[] = [
  { lane: 'new', label: 'New', hint: 'Unclaimed and unanswered', empty: 'Nothing new' },
  { lane: 'needs_reply', label: 'Needs reply', hint: 'OSAS owes an answer', empty: 'Nobody is waiting on OSAS' },
  { lane: 'waiting', label: 'Waiting', hint: 'OSAS replied last', empty: 'Nothing waiting on requesters' },
  { lane: 'resolved', label: 'Resolved', hint: 'Last 7 days', empty: 'Nothing resolved yet' },
]

/** Resolved work older than this folds away; the column is a recent record, not an archive. */
const RESOLVED_WINDOW_MS = 7 * 86400 * 1000
const resolvedOpen = ref(false)
const showOlder = ref(false)

function isRecent(g: Ticket) {
  return Date.now() - new Date(g.resolvedAt ?? g.updatedAt).getTime() < RESOLVED_WINDOW_MS
}

const columns = computed(() =>
  LANES.map((l) => {
    const all = props.tickets.filter((g) => boardLane(g) === l.lane)
    const recent = l.lane === 'resolved' ? all.filter(isRecent) : all
    return {
      ...l,
      items: l.lane === 'resolved' && !showOlder.value ? recent : all,
      total: all.length,
      recent: recent.length,
      older: all.length - recent.length,
      overdue: all.filter((g) => isOverdue(g.waitingSince)).length,
    }
  }),
)

/* ---- Drag rules ---- */

/** Where a reopened ticket lands: its conversation decides, as for any other. */
function reopenLane(l: Ticket): BoardLane {
  return boardLane({ ...l, status: 'open', waitingSince: waitingSince(l.messages, l.reportedAt, 'open') })
}

function canDrop(g: Ticket, to: BoardLane) {
  const from = boardLane(g)
  if (from === to) return false
  if (to === 'resolved') return true
  if (from === 'resolved') return to === reopenLane(g)
  return from === 'new' && to === 'needs_reply'
}

const dragged = ref<Ticket | null>(null)
const dropLane = ref<BoardLane | null>(null)

function onDragStart(e: DragEvent, g: Ticket) {
  dragged.value = g
  // Firefox won't start a drag without data on the transfer.
  e.dataTransfer?.setData('text/plain', g.ref)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
function onDragOver(e: DragEvent, lane: BoardLane) {
  if (!dragged.value || !canDrop(dragged.value, lane)) return
  e.preventDefault()
  dropLane.value = lane
}
function onDragLeave(e: DragEvent, lane: BoardLane) {
  // dragleave also fires when crossing into a child card; only clear on leaving the column.
  const to = e.relatedTarget as Node | null
  if (dropLane.value === lane && !(e.currentTarget as HTMLElement).contains(to)) dropLane.value = null
}
function onDrop(lane: BoardLane) {
  const g = dragged.value
  onDragEnd()
  if (!g || !canDrop(g, lane)) return
  const ids = [g.id]
  if (lane === 'resolved') emit('resolve', g)
  else if (boardLane(g) === 'resolved') emit('reopen', ids)
  else emit('claim', ids)
}
function onDragEnd() {
  dragged.value = null
  dropLane.value = null
}
</script>

<style scoped>
.board { display: flex; flex: 1 1 0; min-width: 0; min-height: 0; gap: var(--sp-3); }

/* Open lanes share the width equally; folded Resolved is a fixed 52px rail.
   flex-grow and flex-basis are both animatable, so the rail widens into a
   column (and back) instead of snapping. */
.lane { display: flex; flex: 0 0 52px; min-width: 0; min-height: 0; flex-direction: column; border: 1px solid transparent; border-radius: var(--radius); background: var(--c-surface-2); transition: flex 0.34s cubic-bezier(0.22, 1, 0.36, 1), border-color var(--t-fast), background var(--t-fast); }
.lane.is-open { flex: 1 1 0; }
.lane-inner { display: flex; flex: 1; min-width: 0; min-height: 0; flex-direction: column; }

.lane-swap-enter-active { transition: opacity 0.22s ease 0.08s, transform 0.26s cubic-bezier(0.22, 1, 0.36, 1) 0.08s; }
.lane-swap-leave-active { transition: opacity 0.1s ease; }
.lane-swap-enter-from { opacity: 0; transform: translateX(16px); }
.lane-swap-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .lane, .lane-swap-enter-active, .lane-swap-leave-active { transition: none; }
}
/* While dragging, columns that can take the card say so; the one under the pointer fills. */
.lane.is-target { border-color: var(--c-primary); border-style: dashed; }
.lane.is-drop { background: var(--c-primary-soft); }

.lane-head { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-3) var(--sp-3) 0 var(--sp-4); }
.lane-head h2 { overflow: hidden; margin: 0; color: var(--c-ink); font-family: var(--font-display); font-size: 14px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.lane-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--c-muted); }
.lane--new .lane-dot { background: var(--c-info); }
.lane--needs_reply .lane-dot { background: var(--c-warning); }
.lane--waiting .lane-dot { background: var(--c-border-strong); }
.lane--resolved .lane-dot { background: var(--c-success); }
.lane-overdue { flex-shrink: 0; color: var(--c-danger); font-weight: 700; white-space: nowrap; }
.lane-count { flex-shrink: 0; margin-left: auto; padding: 1px 8px; border-radius: 999px; background: var(--c-surface); color: var(--c-muted); font-family: var(--font-mono); font-size: 11px; font-weight: 700; }
.lane-fold { display: grid; flex-shrink: 0; width: 26px; height: 26px; place-items: center; border: none; border-radius: 8px; background: transparent; color: var(--c-muted); cursor: pointer; }
.lane-fold:hover { background: var(--c-surface); color: var(--c-ink); }
.lane-hint { display: flex; gap: var(--sp-2); margin: 2px 0 var(--sp-2); padding: 0 var(--sp-3) 0 var(--sp-4); color: var(--c-muted); font-size: 11.5px; }
.lane-hint-text { overflow: hidden; flex: 1; min-width: 0; text-overflow: ellipsis; white-space: nowrap; }
.lane-body { display: flex; flex: 1 1 0; min-height: 0; flex-direction: column; gap: var(--sp-2); overflow-y: auto; padding: 0 var(--sp-2) var(--sp-2); }
.lane-empty { padding: var(--sp-6) var(--sp-3); color: var(--c-muted); font-size: 12px; text-align: center; }
.lane-more { padding: var(--sp-2); border: none; border-radius: var(--radius-sm); background: transparent; color: var(--c-primary); cursor: pointer; font: inherit; font-size: 12px; font-weight: 700; }
.lane-more:hover { background: var(--c-surface); }

.rail { display: flex; flex: 1; flex-direction: column; align-items: center; gap: var(--sp-2); padding: var(--sp-3) 0; border: none; border-radius: var(--radius); background: transparent; color: var(--c-muted); cursor: pointer; font: inherit; }
.rail:hover { color: var(--c-ink); }
.rail-count { color: var(--c-success); font-family: var(--font-mono); font-size: 13px; font-weight: 800; }
.rail-label { font-size: 12px; font-weight: 700; white-space: nowrap; writing-mode: vertical-rl; }
</style>
