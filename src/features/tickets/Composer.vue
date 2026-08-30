<template>
  <div class="tw-composer" :class="{ 'is-internal': replyMode === 'internal' }">
    <div class="cmp-toolbar">
      <div class="reply-toggle">
        <button class="rt-btn" :class="{ 'is-active': replyMode === 'public' }" @click="replyMode = 'public'"><Icon icon="mdi:reply-outline" width="15" height="15" /> Public reply</button>
        <button class="rt-btn internal" :class="{ 'is-active': replyMode === 'internal' }" @click="replyMode = 'internal'"><Icon icon="mdi:lock-outline" width="15" height="15" /> Internal note</button>
      </div>
      <span class="composer-hint" :class="{ int: replyMode === 'internal' }">
        <Icon :icon="replyMode === 'internal' ? 'mdi:lock-outline' : 'mdi:eye-outline'" width="14" height="14" />
        {{ replyMode === 'internal' ? 'Internal only' : 'Visible to requester' }}
      </span>
    </div>

    <div class="cmp-quick">
      <span class="tpl-label">Quick replies</span>
      <div class="tpl-row" v-if="templates.length">
        <button v-for="t in templates" :key="t.key" class="tpl-chip" @click="draft = t.text">{{ t.label }}</button>
      </div>
    </div>

    <div class="cmp-box">
      <q-input v-model="draft" type="textarea" autogrow borderless :placeholder="replyMode === 'internal' ? 'Write an internal note (not visible to requester)…' : 'Write a reply to the requester…'" class="conv-input" />
      <button class="send-fab" :disabled="!draft.trim() || sending" @click="submit" :title="replyMode === 'internal' ? 'Add note' : 'Send reply'">
        <Icon :icon="replyMode === 'internal' ? 'mdi:note-plus-outline' : 'mdi:send-outline'" width="18" height="18" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { REPLY_TEMPLATES, type ReplyTemplate } from './types'

withDefaults(
  defineProps<{
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

function submit() {
  const body = draft.value.trim()
  if (!body) return
  emit('send', body, { isInternal: replyMode.value === 'internal' })
  draft.value = ''
}
</script>

<style scoped>
.tw-composer {
  flex-shrink: 0;
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  transition: background var(--t-fast);
  position: relative;
}
.tw-composer.is-internal { background: linear-gradient(0deg, rgba(245, 158, 11, 0.06), rgba(245, 158, 11, 0.06)), var(--c-surface); }

.cmp-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: var(--sp-2); }
.reply-toggle { display: inline-flex; background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: 999px; padding: 3px; gap: 2px; }
.rt-btn { display: inline-flex; align-items: center; gap: 5px; border: none; background: transparent; color: var(--c-muted); font-size: 12px; font-weight: 600; padding: 5px 13px; border-radius: 999px; cursor: pointer; transition: background var(--t-fast), color var(--t-fast); }
.rt-btn.is-active { background: var(--c-primary); color: #fff; box-shadow: var(--shadow-sm); }
.rt-btn.internal.is-active { background: var(--c-warning); color: #1F2937; }

.cmp-quick { margin-bottom: var(--sp-2); }
.tpl-label { display: block; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-muted); font-weight: 700; margin-bottom: 6px; }
.tpl-row { display: flex; flex-wrap: wrap; gap: 6px; }
.tpl-chip { display: inline-flex; align-items: center; gap: 5px; border: 1px dashed var(--c-border-strong); background: var(--c-surface-2); color: var(--c-muted); font-size: 11px; font-weight: 600; padding: 5px 11px; border-radius: 999px; cursor: pointer; transition: color var(--t-fast), border-color var(--t-fast), background var(--t-fast); }
.tpl-chip:hover { color: var(--c-ink); border-color: var(--c-primary); background: var(--c-primary-soft); }
.tpl-chip.resolve { border-style: solid; border-color: var(--c-success); color: var(--c-success); background: rgba(16, 185, 129, 0.12); }
.tpl-chip.resolve:hover { filter: brightness(0.97); }

.cmp-box { position: relative; display: flex; align-items: flex-end; gap: 10px; background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 8px 8px 8px 12px; transition: border-color var(--t-fast), box-shadow var(--t-fast); }
.cmp-box:focus-within { border-color: var(--c-primary); box-shadow: 0 0 0 3px var(--c-primary-soft); }
.tw-composer.is-internal .cmp-box:focus-within { border-color: var(--c-warning); box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25); }
.conv-input { flex: 1 1 auto; background: transparent; border: none; padding: 4px 0; }
.conv-input :deep(.q-field__control) { border-radius: 0; }
.conv-input :deep(textarea) { min-height: 44px; }
.send-fab { flex: 0 0 auto; width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--c-primary); color: #fff; display: grid; place-items: center; cursor: pointer; transition: filter var(--t-fast), transform var(--t-fast); }
.send-fab:disabled { opacity: 0.45; cursor: not-allowed; }
.send-fab:not(:disabled):hover { filter: brightness(1.05); transform: translateY(-1px); }
.tw-composer.is-internal .send-fab { background: var(--c-warning); color: #1F2937; }

.composer-hint { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--c-info); font-weight: 600; background: rgba(59, 130, 246, 0.12); padding: 4px 10px; border-radius: 999px; }
.composer-hint.int { color: #B45309; background: rgba(245, 158, 11, 0.14); }
</style>
