<template>
  <form class="reply-draft" :class="{ 'is-note': replyMode === 'internal' }" @submit.prevent="submit">
    <header class="draft-head">
      <q-btn flat dense no-caps class="draft-mode">
        <Icon :icon="replyMode === 'internal' ? 'mdi:lock-outline' : 'mdi:reply-outline'" width="16" height="16" aria-hidden="true" />
        {{ replyMode === 'internal' ? 'Internal note' : `Reply to ${ticket.reporterName}` }}
        <Icon icon="mdi:chevron-down" width="15" height="15" aria-hidden="true" />
        <q-menu anchor="top left" self="bottom left" class="reply-mode-menu">
          <button v-close-popup type="button" class="reply-mode-option" :class="{ 'is-active': replyMode === 'public' }" @click="replyMode = 'public'">
            <Icon icon="mdi:reply-outline" width="16" height="16" aria-hidden="true" /><span><strong>Reply to requester</strong><small>{{ ticket.reporterName }}</small></span>
          </button>
          <button v-close-popup type="button" class="reply-mode-option" :class="{ 'is-active': replyMode === 'internal' }" @click="replyMode = 'internal'">
            <Icon icon="mdi:lock-outline" width="16" height="16" aria-hidden="true" /><span><strong>Internal note</strong><small>Visible to support staff only</small></span>
          </button>
        </q-menu>
      </q-btn>
      <span v-if="replyMode === 'internal'" class="draft-private"><Icon icon="mdi:eye-off-outline" width="14" height="14" aria-hidden="true" />Not visible to requester</span>
    </header>

    <q-input
      v-model="draft"
      type="textarea"
      autogrow
      borderless
      class="draft-editor"
      :placeholder="replyMode === 'internal' ? 'Add a note for your team...' : 'Write a reply...'"
      :aria-label="replyMode === 'internal' ? 'Internal note' : `Reply to ${ticket.reporterName}`"
    />

    <footer class="draft-footer">
      <q-btn flat round dense class="template-button" aria-label="Insert a quick reply template">
        <Icon icon="mdi:lightning-bolt-outline" width="17" height="17" aria-hidden="true" />
        <q-tooltip>Insert template</q-tooltip>
        <q-menu anchor="top left" self="bottom left" class="template-menu">
          <button v-close-popup v-for="template in templates" :key="template.key" type="button" class="template-item" @click="insertTemplate(template.text)">
            <strong>{{ template.label }}</strong>
            <span>{{ template.text }}</span>
          </button>
        </q-menu>
      </q-btn>
      <button class="draft-send" type="submit" :disabled="!draft.trim() || sending">
        {{ sending ? 'Sending' : replyMode === 'internal' ? 'Add note' : 'Send' }}
        <Icon v-if="sending" icon="mdi:loading" width="17" height="17" class="is-spinning" aria-hidden="true" />
        <Icon v-else :icon="replyMode === 'internal' ? 'mdi:note-plus-outline' : 'mdi:send-outline'" width="17" height="17" aria-hidden="true" />
      </button>
    </footer>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { REPLY_TEMPLATES, type ReplyTemplate } from './types'
import type { Ticket } from '@/composables/useTickets'

withDefaults(
  defineProps<{
    ticket: Ticket
    sending?: boolean
  }>(),
  { sending: false },
)

const emit = defineEmits<{
  (e: 'send', body: string, opts: { isInternal: boolean }): void
}>()

const replyMode = ref<'public' | 'internal'>('public')
const draft = ref('')
const templates: ReplyTemplate[] = REPLY_TEMPLATES

function insertTemplate(text: string) {
  draft.value = draft.value ? `${draft.value}\n\n${text}` : text
}

function submit() {
  const body = draft.value.trim()
  if (!body) return
  emit('send', body, { isInternal: replyMode.value === 'internal' })
  draft.value = ''
}
</script>

<style scoped>
.reply-draft { flex: 0 0 auto; margin: var(--sp-3); overflow: hidden; border: 1px solid var(--c-border-strong); border-radius: var(--radius-sm); background: var(--c-surface); }.draft-head { display: flex; min-height: 42px; align-items: center; justify-content: space-between; gap: var(--sp-3); padding: 0 var(--sp-2) 0 var(--sp-3); border-bottom: 1px solid var(--c-border); background: var(--c-surface-2); }.draft-mode { min-width: 0; min-height: 36px; color: var(--c-ink); font-size: 12px; font-weight: 750; }.draft-mode :deep(.q-btn__content) { gap: 6px; }.reply-draft.is-note .draft-mode { color: #92400e; }.draft-private { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 5px; color: #92400e; font-size: 11px; font-weight: 700; }.draft-editor { padding: var(--sp-2) var(--sp-3); }.draft-editor :deep(.q-field__control) { min-height: 96px; }.draft-editor :deep(textarea) { min-height: 80px; color: var(--c-text); font-size: 14px; line-height: 1.65; resize: none; }.draft-footer { display: flex; min-height: 48px; align-items: center; gap: var(--sp-2); padding: 0 var(--sp-2) var(--sp-2); }.draft-send { display: inline-flex; min-width: 84px; min-height: 34px; align-items: center; justify-content: center; gap: 7px; margin-left: auto; border: 0; border-radius: var(--radius-btn); background: var(--c-primary); color: #fff; cursor: pointer; font-size: 12px; font-weight: 800; padding: 0 var(--sp-3); }.draft-send:disabled { cursor: not-allowed; opacity: .45; }.reply-draft.is-note .draft-send { background: var(--c-warning); color: #3a2a00; }.template-button { min-width: 34px; min-height: 34px; color: var(--c-muted); }.template-button:hover { background: var(--c-primary-soft); color: var(--c-primary); }
.reply-mode-menu, .template-menu { width: min(320px, calc(100vw - 32px)); overflow: hidden; border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-surface); box-shadow: var(--shadow-lg); padding: var(--sp-1); }.reply-mode-option { display: grid; width: 100%; grid-template-columns: 20px minmax(0, 1fr); gap: var(--sp-2); border: 0; border-radius: 6px; background: transparent; color: var(--c-muted); cursor: pointer; padding: var(--sp-3); text-align: left; }.reply-mode-option:hover, .reply-mode-option.is-active { background: var(--c-surface-2); color: var(--c-primary); }.reply-mode-option > span { display: flex; min-width: 0; flex-direction: column; }.reply-mode-option strong { color: var(--c-ink); font-size: 12px; }.reply-mode-option small { overflow: hidden; margin-top: 2px; color: var(--c-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.template-item { display: flex; width: 100%; flex-direction: column; gap: 3px; border: 0; border-radius: 6px; background: transparent; color: var(--c-text); cursor: pointer; padding: var(--sp-3); text-align: left; }.template-item:hover { background: var(--c-surface-2); }.template-item strong { color: var(--c-ink); font-size: 12px; }.template-item span { display: -webkit-box; overflow: hidden; color: var(--c-muted); font-size: 11px; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.is-spinning { animation: reply-spin .8s linear infinite; }@keyframes reply-spin { to { transform: rotate(360deg); } }.draft-send:focus-visible { outline: 3px solid var(--c-primary); outline-offset: 2px; }@media (max-width: 760px) { .reply-draft { margin: var(--sp-2); }.draft-private { display: none; } }@media (prefers-reduced-motion: reduce) { .is-spinning { animation: none; } }
</style>
