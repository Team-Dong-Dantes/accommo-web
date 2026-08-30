<template>
  <aside class="tw-details">
    <template v-if="!drill">
      <div class="tw-details-head">Details</div>

      <div class="rd-section">
        <div class="rd-ticket receipt">
          <div class="rc-paper">
            <div class="rc-head">
              <div class="rc-ref">{{ ticket.ref }}</div>
            </div>
            <div class="rc-rule"></div>
            <div class="rc-row"><span>Category</span><span>{{ ticket.category }}</span></div>
            <div class="rc-row"><span>Logged</span><span>{{ parcelDate }}</span></div>
            <div class="rc-row"><span>Updated</span><span>{{ updatedDate }}</span></div>
            <div class="rc-row"><span>Messages</span><span>{{ ticket.messages.length }}</span></div>
            <div class="rc-rule"></div>
            <button class="rc-row rc-link" @click="$emit('open-drill', 'user')"><span>Reported by</span><span class="rc-val">{{ ticket.reporterName }} <Icon icon="mdi:open-in-new" width="13" height="13" /></span></button>
            <button v-if="ticket.accommodationName" class="rc-row rc-link" @click="$emit('open-drill', 'accommodation')"><span>Accommodation</span><span class="rc-val">{{ ticket.accommodationName }} <Icon icon="mdi:open-in-new" width="13" height="13" /></span></button>
            <button v-if="ticket.accommodationManagerName && ticket.accommodationManagerName !== ticket.reporterName" class="rc-row rc-link" @click="$emit('open-drill', 'accommodation_manager')"><span>Accommodation manager</span><span class="rc-val">{{ ticket.accommodationManagerName }} <Icon icon="mdi:open-in-new" width="13" height="13" /></span></button>
            <button v-if="ticket.accommodationName && ticket.room !== '—'" class="rc-row rc-link" @click="$emit('open-drill', 'room')"><span>Room</span><span class="rc-val">{{ ticket.room }} <Icon icon="mdi:open-in-new" width="13" height="13" /></span></button>
            <div class="rc-row" v-if="ticket.reporterEmail"><span>Email</span><span>{{ ticket.reporterEmail }}</span></div>
            <div class="rc-row" v-if="ticket.reporterPhone"><span>Phone</span><span>{{ ticket.reporterPhone }}</span></div>
            <div class="rc-block">
              <div class="rc-label">Details</div>
              <div class="rc-text">{{ ticket.description }}</div>
            </div>
            <div class="rc-rule"></div>
            <div class="rc-barcode"></div>
            <div class="rc-thanks">Accommo Care Team</div>
            <div class="rc-copy">For your records</div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="dt-card">
        <header class="dt-head">
          <button class="tw-back" @click="$emit('back-drill')" aria-label="Back"><Icon icon="mdi:arrow-left" width="20" height="20" /></button>
          <div class="dt-av" :style="{ background: drillMeta?.color || 'var(--c-primary)' }">{{ drillMeta?.initials }}</div>
          <div class="dt-id">
            <div class="dt-title">{{ drillMeta?.title }}</div>
            <div class="dt-sub">{{ drillMeta?.sub }}</div>
          </div>
        </header>
        <div class="dt-body">
          <div class="dt-row" v-for="f in drillFields" :key="f.label">
            <span class="dt-key">{{ f.label }}</span>
            <span class="dt-val">{{ f.value || '—' }}</span>
          </div>
        </div>
        <button class="dt-view" @click="$emit('view-entity')">
          <Icon icon="mdi:open-in-new" width="16" height="16" />
          View full {{ drillKindLabel }}
        </button>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { roleLabel } from '@/utils/format'
import type { Ticket } from '@/composables/useTickets'
import type { DrillKind } from './TicketWindow.vue'

const props = defineProps<{
  ticket: Ticket
  drill: { kind: DrillKind } | null
}>()

defineEmits<{
  (e: 'open-drill', kind: DrillKind): void
  (e: 'view-entity'): void
  (e: 'back-drill'): void
}>()

const parcelDate = computed(() => {
  const t = props.ticket
  const d = new Date(t.reportedAt)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
})

const updatedDate = computed(() => {
  const t = props.ticket
  const d = new Date(t.updatedAt)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
})

const drillMeta = computed(() => {
  const t = props.ticket
  const k = props.drill?.kind
  if (!t || !k) return null
  if (k === 'user') {
    return { title: t.reporterName, sub: roleLabel(t.reporterRole), initials: t.reporterName.slice(0, 2).toUpperCase(), color: 'var(--c-primary)' }
  }
  if (k === 'accommodation') {
    return { title: t.accommodationName || 'Accommodation', sub: 'Accommodation', initials: (t.accommodationName || 'A').slice(0, 2).toUpperCase(), color: 'var(--c-info)' }
  }
  if (k === 'accommodation_manager') {
    return { title: t.accommodationManagerName || 'Accommodation Manager', sub: 'Accommodation Manager', initials: (t.accommodationManagerName || 'A').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase(), color: 'var(--c-warning)' }
  }
  return { title: t.room, sub: 'Room', initials: (t.room || 'R').slice(0, 2).toUpperCase(), color: 'var(--c-success)' }
})

const drillKindLabel = computed(() => {
  const k = props.drill?.kind
  if (k === 'user') return 'profile'
  if (k === 'accommodation') return 'accommodation'
  if (k === 'accommodation_manager') return 'accommodation manager profile'
  if (k === 'room') return 'room'
  return 'record'
})

const drillFields = computed(() => {
  const t = props.ticket
  if (!t || !props.drill) return []
  if (props.drill.kind === 'user') {
    return [
      { label: 'Name', value: t.reporterName },
      { label: 'Email', value: t.reporterEmail },
      { label: 'Phone', value: t.reporterPhone },
      { label: 'Role', value: roleLabel(t.reporterRole) },
    ]
  }
  if (props.drill.kind === 'accommodation') {
    return [
      { label: 'Accommodation', value: t.accommodationName ?? '' },
      { label: 'Accommodation manager', value: t.accommodationManagerName ?? '' },
      { label: 'Room', value: t.room },
    ]
  }
  if (props.drill.kind === 'accommodation_manager') {
    return [
      { label: 'Accommodation manager', value: t.accommodationManagerName ?? '' },
      { label: 'Accommodation', value: t.accommodationName ?? '' },
    ]
  }
  return [
    { label: 'Room', value: t.room },
    { label: 'Accommodation', value: t.accommodationName ?? '' },
    { label: 'Accommodation manager', value: t.accommodationManagerName ?? '' },
  ]
})
</script>

<style scoped>
.tw-details { width: 380px; flex-shrink: 0; border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface); overflow-y: auto; padding: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-4); }
.tw-details-head { font-family: var(--font-display); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-muted); margin-bottom: 10px; }
.tw-details { scrollbar-width: thin; scrollbar-color: var(--c-border-strong) transparent; }
.tw-details::-webkit-scrollbar { width: 8px; }
.tw-details::-webkit-scrollbar-thumb { background: var(--c-border-strong); border-radius: 999px; }
.tw-details::-webkit-scrollbar-track { background: transparent; }

.rd-section { display: flex; flex-direction: column; gap: var(--sp-2); }

/* Ticket paper — thermal receipt */
.rd-ticket.receipt { display: block; }
.rc-paper {
  background: #FBF8F1;
  color: #1F2937;
  font-family: var(--font-mono);
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  padding: 40px 18px 56px;
  clip-path: polygon(
    0% 0%, 100% 0%,
    100% calc(100% - 7px), 95% 100%, 90% calc(100% - 7px), 85% 100%, 80% calc(100% - 7px),
    75% 100%, 70% calc(100% - 7px), 65% 100%, 60% calc(100% - 7px),
    55% 100%, 50% calc(100% - 7px), 45% 100%, 40% calc(100% - 7px),
    35% 100%, 30% calc(100% - 7px), 25% 100%, 20% calc(100% - 7px),
    15% 100%, 10% calc(100% - 7px), 5% 100%, 0 calc(100% - 7px)
  );
}
.rc-head { text-align: center; }
.rc-ref { font-family: var(--font-display); font-weight: 800; font-size: 19px; letter-spacing: 0.14em; }
.rc-rule { height: 0; border-top: 1px dashed rgba(15, 23, 42,  0.35); margin: 13px 0; }
.rc-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; line-height: 2.5; }
.rc-row > span:first-child { opacity: 0.6; white-space: nowrap; }
.rc-row > span:last-child { text-align: right; word-break: break-word; }
.rc-link {
  width: 100%;
  background: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  padding: 4px 6px;
  margin: 0 -6px;
  border-radius: 6px;
  transition: background var(--t-fast);
}
.rc-link:hover { background: rgba(15, 23, 42, 0.06); }
.rc-link .rc-val { display: inline-flex; align-items: center; gap: 4px; justify-content: flex-end; }
.rc-link:hover .rc-val { color: var(--c-primary); }
.rc-block { margin: 2px 0; }
.rc-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.6; margin-bottom: 3px; }
.rc-text { font-size: 13px; line-height: 1.6; word-break: break-word; }
.rc-barcode {
  height: 28px; margin: 4px 0 11px; opacity: 0.9;
  background-image: repeating-linear-gradient(90deg,
    #1F2937 0 2px, transparent 2px 4px,
    #1F2937 4px 5px, transparent 5px 9px,
    #1F2937 9px 12px, transparent 12px 13px,
    #1F2937 13px 14px, transparent 14px 18px,
    #1F2937 18px 21px, transparent 21px 22px,
    #1F2937 22px 24px, transparent 24px 28px);
  background-size: 28px 100%;
}
.rc-thanks { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; }
.rc-copy { text-align: center; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.6; margin-top: 3px; }

/* Drill panel */
.dt-card { display: flex; flex-direction: column; min-height: 0; }
.dt-head { display: flex; align-items: center; gap: var(--sp-3); margin-bottom: var(--sp-3); }
.dt-av { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0; }
.dt-id { min-width: 0; }
.dt-title { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.dt-sub { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted); }
.dt-body { display: flex; flex-direction: column; margin-top: var(--sp-2); }
.dt-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-3); padding: 12px 2px; border-bottom: 1px solid var(--c-border); }
.dt-row:last-child { border-bottom: none; }
.dt-key { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted); flex-shrink: 0; }
.dt-val { font-size: 14px; color: var(--c-ink); text-align: right; word-break: break-word; }
.dt-view { margin-top: var(--sp-4); display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; border: 1px solid var(--c-border); background: var(--c-surface-2); color: var(--c-ink); font-size: 13px; font-weight: 600; padding: 10px; border-radius: var(--radius-sm); cursor: pointer; transition: all var(--t-fast); }
.dt-view:hover { border-color: var(--c-primary); color: var(--c-primary); background: var(--c-primary-soft); }
.tw-back {
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  color: var(--c-muted);
  width: 34px; height: 34px;
  border-radius: 10px;
  display: grid; place-items: center;
  cursor: pointer;
  transition: all var(--t-fast);
  flex-shrink: 0;
}
.tw-back:hover { color: var(--c-ink); border-color: var(--c-border-strong); }

@media (max-width: 1100px) {
  .tw-details { display: none; }
}
</style>
