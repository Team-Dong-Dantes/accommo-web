<template>
  <!-- Kanban view of the same rows the table shows: one column per status,
       one card per incident (grouped reports), in queue order. Props in,
       `select` out — the page owns useTickets. -->
  <div class="board">
    <section v-for="col in columns" :key="col.value" class="board-col" :aria-label="`${col.label} tickets`">
      <header class="col-head">
        <span class="col-dot" :style="{ background: toneVar(getStatus(col.value).tone) }" />
        <h2>{{ col.label }}</h2>
        <span class="col-count">{{ col.items.length }}</span>
      </header>

      <div class="col-body">
        <button
          v-for="g in col.items"
          :key="g.key"
          type="button"
          class="card"
          :class="{ 'is-active': g.reports.some((r) => r.id === selectedId) }"
          :style="{ '--prio': toneVar(getStatus(g.lead.priority).tone) }"
          @click="$emit('select', g.lead.id)"
        >
          <div class="card-top">
            <span class="card-ref">{{ g.lead.ref }}</span>
            <BadgePill :tone="getStatus(g.lead.priority).tone" :icon="getStatus(g.lead.priority).icon ?? ''" :label="stLabel(g.lead.priority)" />
          </div>
          <div class="card-subject" :title="g.lead.subject">{{ g.lead.subject }}</div>
          <div class="card-where">
            <template v-if="g.lead.accommodationName">{{ g.lead.accommodationName }}<template v-if="g.lead.room !== '—'"> · {{ g.lead.room }}</template></template>
            <template v-else>No accommodation</template>
            <span v-if="g.reports.length > 1" class="card-reports">{{ g.reports.length }} reports</span>
          </div>
          <div class="card-preview" :title="g.lead.lastRequesterText">“{{ g.lead.lastRequesterText }}”</div>
          <div class="card-foot">
            <q-avatar size="22px" :color="g.lead.avatarColor" text-color="white" class="card-av">
              <img v-if="g.lead.avatarUrl" :src="g.lead.avatarUrl" :alt="g.lead.reporterName" />
              <template v-else>{{ g.lead.initials }}</template>
            </q-avatar>
            <span class="card-name">{{ g.lead.reporterName }}<template v-if="g.reports.length > 1"> +{{ g.reports.length - 1 }}</template></span>
            <span class="card-cat">{{ capitalize(g.lead.category) }}</span>
            <span v-if="g.lead.waitingSince" class="card-time" :class="{ 'is-overdue': isOverdue(g.lead.waitingSince) }">
              waiting {{ waitAge(g.lead.waitingSince) }}
            </span>
            <span v-else class="card-time">{{ g.lead.assignee || 'Unassigned' }}</span>
          </div>
        </button>

        <div v-if="!col.items.length" class="col-empty">No {{ col.label.toLowerCase() }} tickets</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getStatus, toneVar } from '@/utils/status.config'
import { capitalize } from '@/utils/format'
import BadgePill from '@/components/user/BadgePill.vue'
import { isOverdue, waitAge, type TicketGroup } from '@/utils/ticketTriage'
import { STATUS_OPTS, stLabel } from './types'

const props = defineProps<{ groups: TicketGroup[]; selectedId: string | null }>()
defineEmits<{ (e: 'select', id: string): void }>()

const columns = computed(() =>
  STATUS_OPTS.map((o) => ({ ...o, items: props.groups.filter((g) => g.lead.status === o.value) })),
)
</script>

<style scoped>
.board { display: grid; flex: 1 1 0; min-height: 0; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sp-3); }
.board-col { display: flex; min-height: 0; flex-direction: column; border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface-2); }
.col-head { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-3) var(--sp-4); }
.col-head h2 { margin: 0; color: var(--c-ink); font-family: var(--font-display); font-size: 14px; font-weight: 700; }
.col-dot { width: 8px; height: 8px; border-radius: 50%; }
.col-count { margin-left: auto; padding: 1px 8px; border-radius: 999px; background: var(--c-surface); color: var(--c-muted); font-family: var(--font-mono); font-size: 11px; font-weight: 700; }
.col-body { display: flex; flex: 1 1 0; min-height: 0; flex-direction: column; gap: var(--sp-2); overflow-y: auto; padding: 0 var(--sp-2) var(--sp-2); }

/* The priority tone runs down the card's left edge, so a column can be read
   for urgency at a glance before any text is. */
.card { display: flex; flex-direction: column; gap: 6px; width: 100%; padding: var(--sp-3) var(--sp-3) var(--sp-3) calc(var(--sp-3) + 3px); border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-surface); box-shadow: inset 3px 0 0 var(--prio); color: inherit; cursor: pointer; font: inherit; text-align: left; transition: background var(--t-fast), border-color var(--t-fast); }
.card:hover { border-color: var(--c-primary); background: var(--c-primary-soft); }
.card.is-active { border-color: var(--c-primary); background: var(--c-primary-soft); }
.card:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.card-top { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2); }
.card-ref { color: var(--c-muted); font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .03em; }
.card-subject { overflow: hidden; color: var(--c-ink); font-size: 13.5px; font-weight: 700; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.card-preview { display: -webkit-box; overflow: hidden; color: var(--c-muted); font-size: 12px; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.card-foot { display: flex; align-items: center; gap: 6px; min-width: 0; margin-top: 2px; font-size: 11px; }
.card-av { flex-shrink: 0; font-size: 9px; font-weight: 800; }
.card-name { overflow: hidden; min-width: 0; color: var(--c-text); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.card-cat { flex-shrink: 0; padding: 1px 7px; border-radius: 999px; background: var(--c-surface-2); color: var(--c-muted); font-size: 10px; font-weight: 700; }
.card-time { flex-shrink: 0; margin-left: auto; color: var(--c-muted); }
.card-time.is-overdue { color: var(--c-danger); font-weight: 700; }
.card-where { display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden; color: var(--c-text); font-size: 12px; font-weight: 600; white-space: nowrap; }
.card-reports { flex-shrink: 0; padding: 1px 7px; border-radius: 999px; background: var(--c-warning-soft); color: var(--c-warning); font-size: 10px; font-weight: 800; }
.col-empty { padding: var(--sp-6) var(--sp-3); color: var(--c-muted); font-size: 12px; text-align: center; }
</style>
