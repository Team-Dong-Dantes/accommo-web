<template>
  <!-- The drawer's Details tab. Was a thermal-receipt card in the old three-
       column window; in a tab it has the whole width, so it is plain rows. -->
  <div class="tw-details">
    <template v-if="!drill">
      <section class="dl-section">
        <h3 class="dl-title">Ticket</h3>
        <div class="dl-row"><span>Reference</span><span class="mono">{{ ticket.ref }}</span></div>
        <div class="dl-row"><span>Assignee</span><span>{{ ticket.assignee || 'Unassigned' }}</span></div>
        <div class="dl-row"><span>Category</span><span>{{ capitalize(ticket.category) }}</span></div>
        <div class="dl-row"><span>Reported</span><span>{{ formatDateTime(ticket.reportedAt) }}</span></div>
        <div class="dl-row"><span>Updated</span><span>{{ formatDateTime(ticket.updatedAt) }}</span></div>
        <div class="dl-row"><span>Messages</span><span>{{ ticket.messages.length }}</span></div>
      </section>

      <section class="dl-section">
        <h3 class="dl-title">Description</h3>
        <p class="dl-text">{{ ticket.description || 'No description was provided.' }}</p>
      </section>

      <section class="dl-section">
        <h3 class="dl-title">People &amp; place</h3>
        <button class="dl-row dl-link" @click="$emit('open-drill', 'user')"><span>Reported by</span><span>{{ ticket.reporterName }}<Icon icon="lucide:chevron-right" width="15" height="15" /></span></button>
        <button v-if="ticket.accommodationName" class="dl-row dl-link" @click="$emit('open-drill', 'accommodation')"><span>Accommodation</span><span>{{ ticket.accommodationName }}<Icon icon="lucide:chevron-right" width="15" height="15" /></span></button>
        <button v-if="ticket.landlordName && ticket.landlordName !== ticket.reporterName" class="dl-row dl-link" @click="$emit('open-drill', 'landlord')"><span>Landlord/Landlady</span><span>{{ ticket.landlordName }}<Icon icon="lucide:chevron-right" width="15" height="15" /></span></button>
        <button v-if="ticket.accommodationName && ticket.room !== '—'" class="dl-row dl-link" @click="$emit('open-drill', 'room')"><span>Room</span><span>{{ ticket.room }}<Icon icon="lucide:chevron-right" width="15" height="15" /></span></button>
        <div v-if="ticket.reporterEmail" class="dl-row"><span>Email</span><span>{{ ticket.reporterEmail }}</span></div>
        <div v-if="ticket.reporterPhone" class="dl-row"><span>Phone</span><span>{{ ticket.reporterPhone }}</span></div>
      </section>
    </template>

    <template v-else>
      <div class="dt-card">
        <header class="dt-head">
          <button class="dt-back" @click="$emit('back-drill')" aria-label="Back"><Icon icon="lucide:arrow-left" width="20" height="20" /></button>
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
          <Icon icon="lucide:external-link" width="16" height="16" />
          View full {{ drillKindLabel }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { capitalize, formatDateTime, roleLabel } from '@/utils/format'
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
  if (k === 'landlord') {
    return { title: t.landlordName || 'Landlord/Landlady', sub: 'Landlord/Landlady', initials: (t.landlordName || 'A').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase(), color: 'var(--c-warning)' }
  }
  return { title: t.room, sub: 'Room', initials: (t.room || 'R').slice(0, 2).toUpperCase(), color: 'var(--c-success)' }
})

const drillKindLabel = computed(() => {
  const k = props.drill?.kind
  if (k === 'user') return 'profile'
  if (k === 'accommodation') return 'accommodation'
  if (k === 'landlord') return 'landlord/landlady profile'
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
      { label: 'Landlord/Landlady', value: t.landlordName ?? '' },
      { label: 'Room', value: t.room },
    ]
  }
  if (props.drill.kind === 'landlord') {
    return [
      { label: 'Landlord/Landlady', value: t.landlordName ?? '' },
      { label: 'Accommodation', value: t.accommodationName ?? '' },
    ]
  }
  return [
    { label: 'Room', value: t.room },
    { label: 'Accommodation', value: t.accommodationName ?? '' },
    { label: 'Landlord/Landlady', value: t.landlordName ?? '' },
  ]
})
</script>

<style scoped>
.tw-details { display: flex; flex-direction: column; gap: var(--sp-5); padding: var(--sp-5); }
.dl-section { display: flex; flex-direction: column; }
.dl-title { margin: 0 0 var(--sp-2); color: var(--c-muted); font-family: var(--font-body); font-size: 10.5px; font-weight: 800; letter-spacing: .08em; line-height: 1.2; text-transform: uppercase; }
.dl-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-4); padding: 10px 2px; border-bottom: 1px solid var(--c-border); font-size: 13px; }
.dl-row:last-child { border-bottom: 0; }
.dl-row > span:first-child { flex-shrink: 0; color: var(--c-muted); }
.dl-row > span:last-child { display: inline-flex; align-items: center; gap: 4px; min-width: 0; color: var(--c-ink); font-weight: 600; text-align: right; word-break: break-word; }
.dl-link { width: 100%; margin: 0; border-width: 0 0 1px; background: transparent; color: inherit; cursor: pointer; font: inherit; font-size: 13px; }
.dl-link:hover { background: var(--c-primary-soft); }
.dl-link:hover > span:last-child { color: var(--c-primary); }
.dl-link:focus-visible { outline: 2px solid var(--c-primary); outline-offset: -2px; }
.mono { font-family: var(--font-mono); }
.dl-text { margin: 0; padding: var(--sp-3); border-radius: var(--radius-sm); background: var(--c-surface-2); color: var(--c-text); font-size: 13.5px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }

/* Drill panel */
.dt-card { display: flex; flex-direction: column; min-height: 0; }
.dt-head { display: flex; align-items: center; gap: var(--sp-3); margin-bottom: var(--sp-3); }
.dt-back { display: grid; flex-shrink: 0; width: 34px; height: 34px; place-items: center; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-surface-2); color: var(--c-muted); cursor: pointer; }
.dt-back:hover { color: var(--c-ink); border-color: var(--c-border-strong); }
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
</style>
