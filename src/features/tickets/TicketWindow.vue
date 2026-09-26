<template>
  <!-- A right-hand drawer over the list or board — the same gesture as the
       record drawer on Users and Verification. Was a full-screen, three-column
       overlay (overview + activity | conversation | receipt); now the status
       controls sit in the header, reachable from every tab, and the three
       bodies share the drawer's width one at a time. -->
  <teleport to="body">
    <transition name="tw" :duration="420">
      <div v-if="ticket" class="ticket-window" @keydown.esc="$emit('close')">
        <div class="tw-scrim" @click="$emit('close')"></div>

        <aside class="tw-panel" role="dialog" aria-modal="true" :aria-label="`Ticket ${ticket.ref}: ${ticket.subject}`">
          <header class="tw-head">
            <div class="tw-title-row">
              <div class="tw-head-main">
                <span class="tw-ref">{{ ticket.ref }} · {{ capitalize(ticket.category) }}</span>
                <h1 class="tw-subject" :title="ticket.subject">{{ ticket.subject }}</h1>
              </div>
              <button class="tw-close" type="button" aria-label="Close ticket" @click="$emit('close')">
                <Icon icon="lucide:x" width="18" height="18" />
              </button>
            </div>

            <!-- Grouped reports of one incident: each is its own ticket with its
                 own requester, so each gets its own reply. -->
            <div v-if="reports.length > 1" class="tw-reports" role="group" aria-label="Reports of this issue">
              <span class="tw-reports-label">{{ reports.length }} reports</span>
              <button
                v-for="r in reports"
                :key="r.id"
                type="button"
                class="tw-report"
                :class="{ 'is-active': r.id === ticket.id }"
                :aria-pressed="r.id === ticket.id"
                @click="$emit('select-report', r.id)"
              >
                <q-avatar size="20px" :color="r.avatarColor" text-color="white" class="tw-report-av">
                  <img v-if="r.avatarUrl" :src="r.avatarUrl" :alt="r.reporterName" />
                  <template v-else>{{ r.initials }}</template>
                </q-avatar>
                {{ r.reporterName }}
                <span v-if="r.waitingSince" class="tw-report-dot" aria-label="Waiting on a reply" />
              </button>
            </div>

            <div class="tw-controls">
              <q-btn unelevated no-caps padding="none" class="chip-trigger" :ripple="false" aria-label="Change status">
                <BadgePill :tone="getStatus(ticket.status).tone" :icon="getStatus(ticket.status).icon ?? ''" :label="stLabel(ticket.status)" />
                <Icon icon="lucide:chevron-down" width="14" height="14" class="chip-caret" />
                <q-menu anchor="bottom left" self="top left" class="tw-chip-menu">
                  <button v-for="o in STATUS_OPTS" :key="o.value" v-close-popup class="pop-item" :class="{ 'is-active': ticket.status === o.value }" @click="$emit('update:status', o.value)">
                    <span class="pop-dot" :style="{ background: toneVar(getStatus(o.value).tone) }"></span>{{ o.label }}
                  </button>
                </q-menu>
              </q-btn>

              <q-btn unelevated no-caps padding="none" class="chip-trigger" :ripple="false" aria-label="Change priority">
                <BadgePill :tone="getStatus(ticket.priority).tone" :icon="getStatus(ticket.priority).icon ?? ''" :label="stLabel(ticket.priority)" />
                <Icon icon="lucide:chevron-down" width="14" height="14" class="chip-caret" />
                <q-menu anchor="bottom left" self="top left" class="tw-chip-menu">
                  <button v-for="o in PRIORITY_OPTS" :key="o.value" v-close-popup class="pop-item" :class="{ 'is-active': ticket.priority === o.value }" @click="$emit('update:priority', o.value)">
                    <span class="pop-dot" :style="{ background: toneVar(getStatus(o.value).tone) }"></span>{{ o.label }}
                  </button>
                </q-menu>
              </q-btn>

              <button v-if="ticket.status !== 'resolved'" class="btn-resolve" type="button" @click="$emit('resolve')">
                <Icon icon="lucide:circle-check" width="16" height="16" /> Resolve
              </button>
              <span v-else class="resolved-tag"><Icon icon="lucide:circle-check" width="16" height="16" /> Resolved</span>
            </div>

            <TabNav v-model="tab" :tabs="tabs" flat class="tw-tabs" />
          </header>

          <div class="tw-body">
            <MessageThread
              v-if="tab === 'conversation'"
              :ticket="ticket"
              :groups="groups"
              :sending="sending"
              @send="(body, opts) => $emit('send', body, opts)"
            />
            <TicketDetails
              v-else-if="tab === 'details'"
              :ticket="ticket"
              :drill="drill"
              @open-drill="(k) => $emit('open-drill', k)"
              @view-entity="$emit('view-entity')"
              @back-drill="$emit('back-drill')"
            />
            <TicketActivity v-else :ticket="ticket" />
          </div>
        </aside>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { getStatus, toneVar } from '@/utils/status.config'
import { capitalize } from '@/utils/format'
import BadgePill from '@/components/user/BadgePill.vue'
import TabNav from '@/components/ui/TabNav.vue'
import type { Ticket } from '@/composables/useTickets'
import MessageThread from './MessageThread.vue'
import TicketDetails from './TicketDetails.vue'
import TicketActivity from './TicketActivity.vue'
import { STATUS_OPTS, PRIORITY_OPTS, stLabel, type MsgGroup } from './types'

export type DrillKind = 'user' | 'accommodation' | 'landlord' | 'room'

const props = defineProps<{
  /** Nullable so the leave transition can play while the ticket deselects. */
  ticket: Ticket | null
  /** Every report of the open ticket's incident (itself included); one entry when ungrouped. */
  reports: Ticket[]
  groups: MsgGroup[]
  sending?: boolean
  drill: { kind: DrillKind } | null
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'select-report', id: string): void
  (e: 'update:status', value: string): void
  (e: 'update:priority', value: string): void
  (e: 'resolve'): void
  (e: 'send', body: string, opts: { isInternal: boolean }): void
  (e: 'open-drill', kind: DrillKind): void
  (e: 'view-entity'): void
  (e: 'back-drill'): void
}>()

// Which body the drawer shows. View state only, so it lives here rather than
// in the page; every newly opened ticket starts on its conversation.
const tab = ref('conversation')
watch(() => props.ticket?.id, () => { tab.value = 'conversation' })

const tabs = computed(() => [
  { name: 'conversation', label: `Conversation (${(props.ticket?.messages.length ?? 0) + 1})` },
  { name: 'details', label: 'Details' },
  { name: 'activity', label: 'Activity' },
])
</script>

<style scoped>
.ticket-window { position: fixed; inset: 0; z-index: 4000; overflow: hidden; }
.tw-scrim { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.38); backdrop-filter: blur(2px); }

.tw-panel {
  position: absolute;
  top: var(--sp-3);
  right: var(--sp-3);
  bottom: var(--sp-3);
  display: flex;
  width: min(760px, calc(100vw - var(--rail-w) - var(--sp-6)));
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-surface);
  box-shadow: -24px 0 60px rgba(15, 23, 42, 0.22);
}

.tw-head { flex: 0 0 auto; padding: var(--sp-4) var(--sp-5) 0; border-bottom: 1px solid var(--c-border); background: var(--c-surface-2); }
.tw-title-row { display: flex; align-items: flex-start; gap: var(--sp-3); }
.tw-head-main { flex: 1; min-width: 0; }
.tw-ref { display: block; color: var(--c-muted); font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .04em; }
.tw-subject { overflow: hidden; margin: 3px 0 0; color: var(--c-ink); font-family: var(--font-display); font-size: 19px; font-weight: 700; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.tw-close { display: grid; flex-shrink: 0; width: 34px; height: 34px; place-items: center; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-surface); color: var(--c-muted); cursor: pointer; transition: color var(--t-fast), border-color var(--t-fast); }
.tw-close:hover { color: var(--c-ink); border-color: var(--c-border-strong); }

.tw-reports { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: var(--sp-3); }
.tw-reports-label { margin-right: 2px; padding: 2px 8px; border-radius: 999px; background: var(--c-warning-soft); color: var(--c-warning); font-size: 10.5px; font-weight: 800; }
.tw-report { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px 3px 3px; border: 1px solid var(--c-border); border-radius: 999px; background: var(--c-surface); color: var(--c-text); cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
.tw-report:hover { border-color: var(--c-primary); }
.tw-report.is-active { border-color: var(--c-primary); background: var(--c-primary-soft); color: var(--c-primary); }
.tw-report-av { font-size: 8px; font-weight: 800; }
.tw-report-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-danger); }
.tw-controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-2); margin-top: var(--sp-3); }
.chip-trigger { display: inline-flex; align-items: center; gap: 2px; background: transparent; font-weight: 600; }
.chip-caret { margin-left: 2px; color: var(--c-muted); }
.chip-trigger:hover .chip-caret { color: var(--c-ink); }
.btn-resolve { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding: 6px 14px; border: none; border-radius: var(--radius-btn); background: var(--c-success); color: #fff; cursor: pointer; font-size: 12.5px; font-weight: 700; transition: background var(--t-fast); }
/* Dark mode's success green is light; white on it fails contrast. */
:root[data-theme='dark'] .btn-resolve { color: #052e16; }
.btn-resolve:hover { background: color-mix(in srgb, var(--c-success) 88%, black); }
.btn-resolve:focus-visible { outline: 3px solid var(--c-primary); outline-offset: 2px; }
.resolved-tag { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; color: var(--c-success); font-size: 12.5px; font-weight: 700; }

.tw-tabs { margin-top: var(--sp-3); }

/* One body at a time fills what the header leaves. The thread keeps its own
   scroller and pins the composer; details and activity scroll here. */
.tw-body { display: flex; flex: 1 1 0; min-height: 0; flex-direction: column; overflow-y: auto; }
.tw-body :deep(.correspondence) { border: 0; border-radius: 0; }

/* Menus teleport to <body>, out of this component's scope. */
:global(.tw-chip-menu) { min-width: 160px; padding: 6px; border-radius: var(--radius-sm); box-shadow: var(--shadow-lg); }
.pop-item { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border: none; border-radius: 10px; background: transparent; color: var(--c-text); cursor: pointer; font-size: 13px; font-weight: 600; text-align: left; transition: background var(--t-fast); }
.pop-item:hover { background: var(--c-surface-2); }
.pop-item.is-active { background: var(--c-primary-soft); color: var(--c-primary-ink); }
.pop-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }

.tw-enter-from .tw-panel, .tw-leave-to .tw-panel { transform: translateX(calc(100% + var(--sp-3))); }
.tw-enter-active .tw-panel, .tw-leave-active .tw-panel { transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1); }
.tw-enter-from .tw-scrim, .tw-leave-to .tw-scrim { opacity: 0; }
.tw-enter-active .tw-scrim, .tw-leave-active .tw-scrim { transition: opacity 0.3s ease; }

@media (max-width: 760px) {
  .tw-panel { top: 0; right: 0; bottom: 0; width: 100vw; border-radius: 0; }
  .tw-head { padding: var(--sp-3) var(--sp-3) 0; }
  .tw-subject { font-size: 17px; }
}
@media (prefers-reduced-motion: reduce) {
  .tw-enter-active .tw-panel, .tw-leave-active .tw-panel,
  .tw-enter-active .tw-scrim, .tw-leave-active .tw-scrim { transition: none; }
}
</style>
