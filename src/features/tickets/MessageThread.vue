<template>
  <section class="correspondence" aria-label="Ticket conversation">
    <header class="conversation-context">
      <span class="context-avatar" :style="{ background: ticket.avatarColor }">
        <img v-if="ticket.avatarUrl" :src="ticket.avatarUrl" :alt="ticket.reporterName" />
        <template v-else>{{ ticket.initials }}</template>
      </span>
      <div class="context-copy">
        <span>Request from</span>
        <strong>{{ ticket.reporterName }}</strong>
        <small>{{ roleLabel(ticket.reporterRole) }} <span aria-hidden="true">&middot;</span> {{ ticket.reporterEmail || 'No email recorded' }}</small>
      </div>
      <time :datetime="ticket.reportedAt">Opened {{ formatDate(ticket.reportedAt) }}</time>
    </header>

    <div ref="threadEl" class="correspondence-body" aria-live="polite">
      <article class="correspondence-item is-request">
        <header class="message-header">
          <span class="message-avatar" :style="{ background: ticket.avatarColor }">
            <img v-if="ticket.avatarUrl" :src="ticket.avatarUrl" :alt="ticket.reporterName" />
            <template v-else>{{ ticket.initials }}</template>
          </span>
          <div class="message-sender">
            <strong>{{ ticket.reporterName }}</strong>
            <span>{{ ticket.reporterEmail || 'Requester' }} <span aria-hidden="true">&middot;</span> to Support team</span>
          </div>
          <time :datetime="ticket.reportedAt">{{ formatDateTime(ticket.reportedAt) }}</time>
        </header>
        <div class="message-content">{{ ticket.description || ticket.subject }}</div>
      </article>

      <template v-for="group in groups" :key="group.day">
        <div v-if="group.items.length" class="date-rule"><span>{{ dayLabel(group.day) }}</span></div>
        <article
          v-for="message in group.items"
          :key="message.id"
          class="correspondence-item"
          :class="{
            'is-support': message.authorRole === 'agent',
            'is-note': message.isInternal,
          }"
        >
          <header class="message-header">
            <span
              class="message-avatar"
              :class="{ 'is-support': message.authorRole === 'agent', 'is-note': message.isInternal }"
              :style="message.authorRole === 'student' ? { background: ticket.avatarColor } : undefined"
            >
              <img
                v-if="message.authorRole === 'student' && message.authorAvatarUrl"
                :src="message.authorAvatarUrl"
                :alt="message.authorName"
              />
              <template v-else>{{ messageInitials(message) }}</template>
            </span>
            <div class="message-sender">
              <strong>{{ message.authorName }}</strong>
              <span v-if="message.isInternal"><Icon icon="lucide:lock" width="12" height="12" aria-hidden="true" />Internal note <span aria-hidden="true">&middot;</span> Support staff only</span>
              <span v-else-if="message.authorRole === 'agent'">Support team <span aria-hidden="true">&middot;</span> to {{ ticket.reporterName }}</span>
              <span v-else>{{ ticket.reporterEmail || 'Requester' }} <span aria-hidden="true">&middot;</span> to Support team</span>
            </div>
            <time :datetime="message.createdAt">{{ formatDateTime(message.createdAt) }}</time>
          </header>
          <div v-if="message.isInternal" class="note-banner"><Icon icon="lucide:lock" width="14" height="14" aria-hidden="true" />This note is not visible to the requester.</div>
          <div class="message-content">{{ message.body }}</div>
        </article>
      </template>
    </div>

    <Composer :ticket="ticket" :sending="sending" @send="(body, opts) => $emit('send', body, opts)" />
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { formatDateTime, roleLabel, dayLabel } from '@/utils/format'
import Composer from './Composer.vue'
import type { MsgGroup } from './types'
import type { Ticket, TicketMessage } from '@/composables/useTickets'

const props = defineProps<{
  ticket: Ticket
  groups: MsgGroup[]
  sending?: boolean
}>()

defineEmits<{
  (e: 'send', body: string, opts: { isInternal: boolean }): void
}>()

const threadEl = ref<HTMLElement | null>(null)

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function messageInitials(message: TicketMessage) {
  return message.authorName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?'
}

watch(
  () => props.groups.flatMap((group) => group.items).at(-1)?.id,
  async (latestId) => {
    if (!latestId) return
    await nextTick()
    threadEl.value?.scrollTo({ top: threadEl.value.scrollHeight, behavior: 'smooth' })
  },
)
</script>

<style scoped>
.correspondence { display: flex; min-width: 0; flex: 1 1 0; flex-direction: column; overflow: hidden; border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-surface); }
.conversation-context { display: flex; min-height: 68px; align-items: center; gap: var(--sp-3); padding: 0 var(--sp-4); border-bottom: 1px solid var(--c-border); background: var(--c-surface); }.context-avatar img, .message-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }.context-avatar, .message-avatar { display: grid; flex: 0 0 auto; place-items: center; border-radius: 50%; color: #fff; font-size: 12px; font-weight: 800; }.context-avatar { width: 38px; height: 38px; }.context-copy { display: flex; min-width: 0; flex-direction: column; }.context-copy > span { color: var(--c-muted); font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }.context-copy strong { overflow: hidden; margin-top: 1px; color: var(--c-ink); font-size: 13px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }.context-copy small { overflow: hidden; margin-top: 1px; color: var(--c-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.conversation-context time { flex: 0 0 auto; margin-left: auto; color: var(--c-muted); font-size: 11px; font-weight: 600; }
.correspondence-body { flex: 1 1 0; min-height: 0; overflow-y: auto; padding: 0 var(--sp-4) var(--sp-4); background: var(--c-surface); scrollbar-color: var(--c-border-strong) transparent; scrollbar-width: thin; }.correspondence-body::-webkit-scrollbar { width: 8px; }.correspondence-body::-webkit-scrollbar-thumb { border-radius: 999px; background: var(--c-border-strong); }.correspondence-item { padding: var(--sp-4) 0; border-bottom: 1px solid var(--c-border); }.correspondence-item.is-request { border-top: 0; }.correspondence-item.is-note { margin: 0 calc(var(--sp-2) * -1); padding-right: var(--sp-2); padding-left: var(--sp-2); border-left: 3px solid var(--c-warning); background: color-mix(in srgb, var(--c-warning) 7%, var(--c-surface)); }.date-rule { display: flex; align-items: center; gap: var(--sp-2); height: 40px; color: var(--c-muted); font-size: 10px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }.date-rule::before, .date-rule::after { height: 1px; flex: 1; background: var(--c-border); content: ''; }
.message-header { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; align-items: center; gap: var(--sp-2); }.message-avatar { width: 34px; height: 34px; background: var(--c-primary); }.message-avatar.is-support { background: var(--c-info); }.message-avatar.is-note { background: var(--c-warning); color: #3b2a00; }.message-sender { display: flex; min-width: 0; flex-direction: column; }.message-sender strong { overflow: hidden; color: var(--c-ink); font-size: 13px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }.message-sender span { display: inline-flex; align-items: center; gap: 4px; overflow: hidden; margin-top: 2px; color: var(--c-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.correspondence-item.is-note .message-sender span { color: #92400e; }.message-header time { color: var(--c-muted); font-size: 11px; white-space: nowrap; }.message-content { max-width: 720px; margin: var(--sp-3) 0 0 42px; color: var(--c-text); font-size: 14px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }.note-banner { display: inline-flex; align-items: center; gap: 6px; margin: var(--sp-3) 0 0 42px; color: #92400e; font-size: 11px; font-weight: 700; }
@media (max-width: 760px) { .conversation-context { min-height: 60px; padding: 0 var(--sp-3); }.conversation-context time { display: none; }.correspondence-body { padding-right: var(--sp-3); padding-bottom: var(--sp-3); padding-left: var(--sp-3); }.correspondence-item { padding: var(--sp-3) 0; }.message-header time { font-size: 10px; }.message-content, .note-banner { margin-left: 0; }.message-sender span { max-width: 190px; } }
@media (prefers-reduced-motion: reduce) { .correspondence-item { transition: none; } }
</style>
