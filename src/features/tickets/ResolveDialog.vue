<template>
  <!-- Resolving notifies the requester, so it is never one stray drop away:
       both the board and the ticket window's Resolve button come through here. -->
  <q-dialog :model-value="!!ticket" @update:model-value="(v) => { if (!v) $emit('cancel') }">
    <q-card v-if="ticket" class="resolve-card">
      <header class="rs-head">
        <span class="rs-ref">{{ ticket.ref }}</span>
        <h2 class="rs-title">Resolve “{{ ticket.subject }}”</h2>
        <p class="rs-sub">
          {{ ticket.reporterName }} is notified and can reply to reopen it.
        </p>
      </header>

      <div class="rs-body">
        <label class="rs-label" for="rs-note">Closing reply <span>(optional)</span></label>
        <textarea
          id="rs-note"
          v-model="note"
          class="rs-note"
          rows="4"
          placeholder="Let them know what was done…"
          :disabled="busy"
        />
        <div class="rs-templates">
          <button v-for="tpl in RESOLVE_TEMPLATES" :key="tpl.key" type="button" class="rs-template" :disabled="busy" @click="note = tpl.text">
            {{ tpl.label }}
          </button>
        </div>
      </div>

      <footer class="rs-foot">
        <button type="button" class="rs-cancel" :disabled="busy" @click="$emit('cancel')">Cancel</button>
        <button type="button" class="rs-confirm" :disabled="busy" @click="$emit('resolve', note.trim())">
          <Icon icon="lucide:circle-check" width="16" height="16" />
          {{ busy ? 'Resolving…' : note.trim() ? 'Send & resolve' : 'Resolve' }}
        </button>
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { landlordTitle } from '@/utils/format'
import { Icon } from '@iconify/vue'
import type { Ticket } from '@/composables/useTickets'

const props = defineProps<{ ticket: Ticket | null; busy?: boolean }>()
defineEmits<{ (e: 'resolve', note: string): void; (e: 'cancel'): void }>()

// The ticket's landlord/landlady, titled by their sex.
const RESOLVE_TEMPLATES = computed(() => {
  const who = landlordTitle(props.ticket?.landlordSex)
  return [
    { key: 'fixed', label: 'Fixed', text: 'This has been fixed. Thank you for reporting it — reply here if the problem comes back.' },
    { key: 'handled', label: `Handled by ${who.toLowerCase()}`, text: `Your ${who.toLowerCase()} has confirmed this is resolved. Reply here if it is not.` },
    { key: 'no-reply', label: 'No response', text: 'We are closing this since we have not heard back. Reply here any time to reopen it.' },
  ]
})

const note = ref('')
watch(() => props.ticket?.id, () => { note.value = '' })
</script>

<style scoped>
.resolve-card { width: min(520px, 92vw); border-radius: var(--radius-lg); background: var(--c-surface); }
.rs-head { padding: var(--sp-5) var(--sp-5) var(--sp-3); }
.rs-ref { color: var(--c-muted); font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .04em; }
.rs-title { overflow: hidden; margin: 4px 0 0; color: var(--c-ink); font-family: var(--font-display); font-size: 18px; font-weight: 700; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
.rs-sub { margin: 6px 0 0; color: var(--c-muted); font-size: 13px; }
.rs-body { padding: 0 var(--sp-5); }
.rs-label { display: block; margin-bottom: 6px; color: var(--c-ink); font-size: 12.5px; font-weight: 700; }
.rs-label span { color: var(--c-muted); font-weight: 500; }
.rs-note { display: block; width: 100%; padding: 10px 12px; border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-bg); color: var(--c-ink); font: inherit; font-size: 13.5px; line-height: 1.45; resize: vertical; }
.rs-note:focus { border-color: var(--c-primary); outline: none; }
.rs-templates { display: flex; flex-wrap: wrap; gap: 6px; margin-top: var(--sp-2); }
.rs-template { padding: 4px 10px; border: 1px solid var(--c-border); border-radius: 999px; background: var(--c-surface); color: var(--c-text); cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
.rs-template:hover { border-color: var(--c-primary); }
.rs-foot { display: flex; justify-content: flex-end; gap: var(--sp-2); padding: var(--sp-4) var(--sp-5) var(--sp-5); }
.rs-cancel { padding: 8px 16px; border: 1px solid var(--c-border); border-radius: var(--radius-btn); background: var(--c-surface); color: var(--c-text); cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; }
.rs-confirm { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: var(--radius-btn); background: var(--c-success); color: #fff; cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; }
/* Dark mode's success green is light; white on it fails contrast (as in TicketWindow). */
:root[data-theme='dark'] .rs-confirm { color: #052e16; }
.rs-confirm:disabled, .rs-cancel:disabled { cursor: default; opacity: .6; }
</style>
