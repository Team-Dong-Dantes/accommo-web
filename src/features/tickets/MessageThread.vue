<template>
  <section class="tw-conv">
    <header class="conv-profile">
      <div class="cp-av" :style="{ background: ticket.avatarColor }">{{ ticket.initials }}</div>
      <div class="cp-meta">
        <div class="cp-name">{{ ticket.reporterName }}</div>
        <div class="cp-sub">{{ roleLabel(ticket.reporterRole) }} · {{ ticket.reporterEmail }}</div>
      </div>
    </header>

    <div class="tw-thread">
      <template v-for="(group, gi) in groups" :key="gi">
        <div class="tw-day"><span>{{ dayLabel(group.day) }}</span></div>
        <div v-for="m in group.items" :key="m.id" class="msg" :class="[m.authorRole === 'agent' ? 'agent' : 'student', { 'is-internal': m.isInternal }]">
          <div v-if="m.authorRole === 'student'" class="msg-av">{{ ticket.initials }}</div>
          <div class="bubble">
            <div class="bubble-author" v-if="m.isInternal"><Icon icon="mdi:lock-outline" width="13" height="13" /> Internal note · {{ m.authorName }}</div>
            <div class="bubble-body">{{ m.body }}</div>
            <div class="bubble-foot">{{ formatTime(m.createdAt) }}</div>
          </div>
        </div>
      </template>
    </div>

    <Composer :sending="sending" @send="(body, opts) => $emit('send', body, opts)" />
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { roleLabel, formatTime, dayLabel } from '@/utils/format'
import Composer from './Composer.vue'
import type { MsgGroup } from './types'
import type { Ticket } from '@/composables/useTickets'

defineProps<{
  ticket: Ticket
  groups: MsgGroup[]
  sending?: boolean
}>()

defineEmits<{
  (e: 'send', body: string, opts: { isInternal: boolean }): void
}>()
</script>

<style scoped>
.tw-conv { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; background: var(--c-bg); border: 1px solid var(--c-border); border-radius: var(--radius); overflow: hidden; }
.conv-profile {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
}
.cp-av {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  flex-shrink: 0;
}
.cp-meta { min-width: 0; }
.cp-name { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-sub { font-size: 12px; color: var(--c-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tw-thread { flex: 1 1 0; min-height: 0; overflow-y: auto; padding: var(--sp-5); display: flex; flex-direction: column; gap: var(--sp-3); }
.tw-thread { scrollbar-width: thin; scrollbar-color: var(--c-border-strong) transparent; }
.tw-thread::-webkit-scrollbar { width: 8px; }
.tw-thread::-webkit-scrollbar-thumb { background: var(--c-border-strong); border-radius: 999px; }
.tw-thread::-webkit-scrollbar-track { background: transparent; }

.tw-day { display: flex; align-items: center; gap: 12px; margin: var(--sp-3) 0; }
.tw-day::before, .tw-day::after { content: ''; height: 1px; background: var(--c-border); flex: 1; }
.tw-day span {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--c-muted);
}

.msg { display: flex; align-items: flex-end; gap: 8px; max-width: 80%; }
.msg.student { align-self: flex-start; }
.msg.agent { align-self: flex-end; justify-content: flex-end; }
.msg.is-internal { align-self: flex-end; max-width: 86%; }
.msg-av {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: var(--c-primary-soft);
  color: var(--c-primary-ink);
  display: grid; place-items: center;
  font-size: 11px; font-weight: 700;
  flex-shrink: 0;
}
.bubble {
  box-shadow: var(--shadow-sm);
  border-radius: 18px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.5;
}
.msg.student .bubble { background: var(--c-surface); color: var(--c-ink); border: 1px solid var(--c-border); border-bottom-left-radius: 6px; }
.msg.agent .bubble { background: var(--c-primary); color: #fff; border-bottom-right-radius: 6px; }
.msg.is-internal .bubble { background: #FEF3C7; color: #78350F; border-bottom-right-radius: 6px; }
.bubble-author { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 5px; color: #92400E; }
.bubble-foot { font-size: 11px; opacity: 0.7; margin-top: 5px; text-align: right; }
</style>
