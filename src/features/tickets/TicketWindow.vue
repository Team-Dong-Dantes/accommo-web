<template>
  <teleport to="body">
    <transition name="tw" :duration="450">
      <div class="ticket-window" v-if="ticket">
        <div class="tw-scrim" @click="$emit('close')"></div>

        <TicketSidebar
          :ticket="ticket"
          @update:status="(v) => $emit('update:status', v)"
          @update:priority="(v) => $emit('update:priority', v)"
          @resolve="$emit('resolve')"
        />

        <div class="tw-panel">
          <header class="tw-head">
            <button class="tw-back" @click="$emit('close')" aria-label="Back"><Icon icon="mdi:arrow-left" width="20" height="20" /></button>
            <div class="tw-head-main">
              <div class="tw-subject">{{ ticket.subject }}</div>
            </div>
          </header>

          <div class="tw-body">
            <MessageThread
              :ticket="ticket"
              :groups="groups"
              :sending="sending"
              @send="(body, opts) => $emit('send', body, opts)"
            />

            <TicketDetails
              :ticket="ticket"
              :drill="drill"
              @open-drill="(k) => $emit('open-drill', k)"
              @view-entity="$emit('view-entity')"
              @back-drill="$emit('back-drill')"
            />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useTickets, type Ticket } from '@/composables/useTickets'
import TicketSidebar from './TicketSidebar.vue'
import MessageThread from './MessageThread.vue'
import TicketDetails from './TicketDetails.vue'
import type { MsgGroup } from './types'

export type DrillKind = 'user' | 'accommodation' | 'accommodation_manager' | 'room'

defineProps<{
  /** Nullable so the leave transition can play while the ticket deselects. */
  ticket: Ticket | null
  groups: MsgGroup[]
  sending?: boolean
  drill: { kind: DrillKind } | null
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'update:status', value: string): void
  (e: 'update:priority', value: string): void
  (e: 'resolve'): void
  (e: 'send', body: string, opts: { isInternal: boolean }): void
  (e: 'open-drill', kind: DrillKind): void
  (e: 'view-entity'): void
  (e: 'back-drill'): void
}>()
</script>

<style scoped>
.ticket-window {
  position: fixed;
  inset: 0;
  z-index: 4000;
  overflow: hidden;
}
.tw-scrim {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}
.tw-panel {
  position: absolute;
  top: var(--sp-6);
  right: var(--sp-6);
  bottom: var(--sp-6);
  left: calc(var(--sp-6) + 320px + var(--sp-4));
  border-radius: var(--radius);
  background: var(--c-surface);
  box-shadow: -24px 0 60px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tw-enter-from .tw-panel,
.tw-leave-to .tw-panel { transform: translateX(100%); }
.tw-enter-active .tw-panel,
.tw-leave-active .tw-panel { transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1); }
.tw-enter-from .tw-side,
.tw-leave-to .tw-side { transform: translateX(-100%); opacity: 0; }
.tw-enter-active .tw-side,
.tw-leave-active .tw-side { transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease; }
.tw-enter-from .tw-scrim,
.tw-leave-to .tw-scrim { opacity: 0; }
.tw-enter-active .tw-scrim,
.tw-leave-active .tw-scrim { transition: opacity 0.42s ease; }
.tw-enter-from,
.tw-leave-to { opacity: 0; }
.tw-enter-active,
.tw-leave-active { transition: opacity 0.42s ease; }

.tw-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface);
}
.tw-head-main { min-width: 0; }
.tw-subject { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--c-ink); }
.tw-back {
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  color: var(--c-muted);
  width: 38px; height: 38px;
  border-radius: 10px;
  display: grid; place-items: center;
  cursor: pointer;
  transition: all var(--t-fast);
  flex-shrink: 0;
}
.tw-back:hover { color: var(--c-ink); border-color: var(--c-border-strong); }

.tw-body { flex: 1 1 0; min-height: 0; display: flex; gap: var(--sp-4); padding: var(--sp-4); }

@media (max-width: 1100px) {
  .tw-panel {
    top: var(--sp-2);
    right: var(--sp-2);
    bottom: var(--sp-2);
    left: calc(var(--sp-2) + 260px + var(--sp-2));
    border-radius: var(--radius);
  }
}
</style>
