<template>
  <!-- One ticket on the workflow board. The fourth line changes with the lane:
       where OSAS owes a reply it quotes the requester; where the requester owes
       one it says when OSAS last answered. -->
  <button
    type="button"
    class="card"
    :class="{ 'is-active': active, 'is-dragging': dragging }"
    :style="{ '--prio': toneVar(getStatus(lead.priority).tone) }"
    draggable="true"
    :aria-label="`${lead.ref}: ${lead.subject}`"
  >
    <div class="card-top">
      <span class="card-ref">
        <span v-if="unread" class="card-unread" aria-label="Unread reply" />
        {{ lead.ref }}
      </span>
      <BadgePill :tone="getStatus(lead.priority).tone" :icon="getStatus(lead.priority).icon ?? ''" :label="stLabel(lead.priority)" />
    </div>

    <div class="card-subject" :title="lead.subject">{{ lead.subject }}</div>

    <div class="card-where">
      <span class="card-place">
        <template v-if="lead.accommodationName">{{ lead.accommodationName }}<template v-if="lead.room !== '—'"> · {{ lead.room }}</template></template>
        <template v-else>{{ capitalize(lead.category) }}</template>
      </span>
    </div>

    <div v-if="lane === 'waiting' && lead.lastReplyAt" class="card-line card-line--us">
      <Icon icon="lucide:reply" width="12" height="12" />You replied {{ getTimeAgo(lead.lastReplyAt) }}
    </div>
    <div v-else-if="lane !== 'resolved'" class="card-line" :title="lead.lastRequesterText">“{{ lead.lastRequesterText }}”</div>

    <div class="card-foot">
      <q-avatar size="20px" :color="lead.avatarColor" text-color="white" class="card-av">
        <img v-if="lead.avatarUrl" :src="lead.avatarUrl" :alt="lead.reporterName" />
        <template v-else>{{ lead.initials }}</template>
      </q-avatar>
      <span class="card-name">{{ lead.reporterName }}</span>
      <span v-if="lead.waitingSince" class="card-time" :class="{ 'is-overdue': isOverdue(lead.waitingSince) }">
        {{ waitAge(lead.waitingSince) }}
      </span>
      <span v-else-if="lane === 'resolved'" class="card-time">{{ getTimeAgo(lead.resolvedAt ?? lead.updatedAt) }}</span>
      <span
        class="card-assignee"
        :class="{ 'is-none': !lead.assignee, 'is-pushed': !lead.waitingSince && lane !== 'resolved' }"
        :title="lead.assignee ? `Assigned to ${lead.assignee}` : 'Unassigned'"
      >
        {{ lead.assignee ? getInitials(lead.assignee) : '' }}
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { getStatus, toneVar } from '@/utils/status.config'
import { capitalize, getInitials, getTimeAgo } from '@/utils/format'
import BadgePill from '@/components/user/BadgePill.vue'
import { isOverdue, waitAge, type BoardLane } from '@/utils/ticketTriage'
import type { Ticket } from '@/composables/useTickets'
import { stLabel } from './types'

const props = defineProps<{ ticket: Ticket; lane: BoardLane; active: boolean; dragging: boolean }>()

const lead = computed(() => props.ticket)
const unread = computed(() => props.ticket.unread > 0)
</script>

<style scoped>
/* The priority tone runs down the card's left edge, so a column can be read
   for urgency at a glance before any text is. */
.card { display: flex; flex-direction: column; gap: 5px; width: 100%; padding: var(--sp-3) var(--sp-3) var(--sp-3) calc(var(--sp-3) + 3px); border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-surface); box-shadow: inset 3px 0 0 var(--prio); color: inherit; cursor: grab; font: inherit; text-align: left; transition: background var(--t-fast), border-color var(--t-fast), opacity var(--t-fast); }
.card:hover { border-color: var(--c-primary); }
.card.is-active { border-color: var(--c-primary); background: var(--c-primary-soft); }
.card.is-dragging { opacity: .4; }
.card:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.card-top { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2); }
.card-ref { display: inline-flex; flex-shrink: 0; white-space: nowrap; align-items: center; gap: 6px; color: var(--c-muted); font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .03em; }
.card-unread { width: 7px; height: 7px; border-radius: 50%; background: var(--c-primary); }
.card-subject { overflow: hidden; color: var(--c-ink); font-size: 13.5px; font-weight: 700; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.card-where { display: flex; align-items: center; gap: 6px; min-width: 0; color: var(--c-text); font-size: 12px; font-weight: 600; }
.card-place { overflow: hidden; min-width: 0; text-overflow: ellipsis; white-space: nowrap; }
.card-line { overflow: hidden; color: var(--c-muted); font-size: 12px; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
.card-line--us { display: flex; align-items: center; gap: 5px; }
.card-foot { display: flex; align-items: center; gap: 6px; min-width: 0; margin-top: 3px; font-size: 11px; }
.card-av { flex-shrink: 0; font-size: 8.5px; font-weight: 800; }
.card-name { overflow: hidden; min-width: 0; color: var(--c-text); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.card-time { flex-shrink: 0; margin-left: auto; color: var(--c-muted); font-family: var(--font-mono); font-weight: 700; }
.card-time.is-overdue { color: var(--c-danger); }
/* Assignee initials; a dashed empty ring when nobody has picked it up. */
.card-assignee { display: inline-grid; flex-shrink: 0; place-items: center; width: 20px; height: 20px; border: 1px solid var(--c-border); border-radius: 50%; background: var(--c-surface-2); color: var(--c-ink); font-size: 8.5px; font-weight: 800; }
.card-assignee.is-none { border-style: dashed; background: transparent; }
.card-assignee.is-pushed { margin-left: auto; }
</style>
