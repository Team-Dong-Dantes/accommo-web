<template>
  <!-- The one confirmation every change to a person's account goes through: it
       says what will happen, asks why (the person is told), and for a
       suspension, when it ends. Built from an AccountActionSpec, so each action
       only describes itself. -->
  <q-dialog :model-value="!!spec" @update:model-value="(v) => { if (!v) close() }">
    <form v-if="spec" class="aa" @submit.prevent="submit">
      <header class="aa-head">
        <span class="aa-icon" :class="{ 'aa-icon--danger': spec.danger }"><Icon :icon="spec.icon" width="18" height="18" /></span>
        <div class="aa-titles">
          <h2 class="aa-title">{{ spec.title }}</h2>
          <span class="aa-who">{{ spec.name }}</span>
        </div>
        <button type="button" class="aa-x" aria-label="Close" @click="close"><Icon icon="lucide:x" width="16" height="16" /></button>
      </header>

      <p class="aa-blurb">{{ spec.blurb }}</p>

      <!-- Shown once, after the action ran: a temporary password to hand over. -->
      <div v-if="revealed" class="aa-reveal">
        <span class="aa-label">{{ revealed.label }}</span>
        <div class="aa-reveal-row">
          <code class="aa-reveal-value">{{ revealed.value }}</code>
          <q-btn flat dense no-caps color="primary" :label="copied ? 'Copied' : 'Copy'" @click="copy" />
        </div>
        <span class="aa-opt aa-reveal-note">{{ revealed.note }}</span>
      </div>

      <label v-if="spec.field && !revealed" class="aa-field">
        <span class="aa-label">{{ spec.field.label }}</span>
        <q-input v-model="value" :type="spec.field.type" dense outlined :placeholder="spec.field.placeholder" autofocus />
      </label>

      <div v-if="spec.restrictions" class="aa-field">
        <span class="aa-label">Restrict</span>
        <label v-for="r in spec.restrictions" :key="r.key" class="aa-check">
          <q-checkbox v-model="picked" :val="r.key" dense color="primary" />
          <span>
            <span class="aa-check-label">{{ r.label }}</span>
            <span class="aa-check-hint">{{ r.hint }}</span>
          </span>
        </label>
      </div>

      <label v-if="spec.until" class="aa-field">
        <span class="aa-label">Suspended until <span class="aa-opt">optional — leave empty to suspend until OSAS lifts it</span></span>
        <q-input v-model="until" type="date" dense outlined :min="tomorrow" />
      </label>

      <label v-if="spec.message" class="aa-field">
        <span class="aa-label">{{ spec.titleLabel ?? 'Title' }}</span>
        <q-input v-model="title" dense outlined maxlength="120" />
      </label>

      <label v-if="spec.reason !== 'none' && !revealed" class="aa-field">
        <span class="aa-label">
          {{ spec.reasonLabel ?? (spec.message ? 'Message' : 'Reason') }}
          <span class="aa-opt">{{ reasonRequired ? 'the person is told this' : 'optional' }}</span>
        </span>
        <q-input v-model="reason" type="textarea" autogrow dense outlined maxlength="1000" :input-style="{ minHeight: '64px' }" />
      </label>

      <label v-if="spec.confirmPhrase && !revealed" class="aa-field">
        <span class="aa-label">Type <strong>{{ spec.confirmPhrase }}</strong> to confirm</span>
        <q-input v-model="typed" dense outlined />
      </label>

      <p v-if="error" class="aa-error"><Icon icon="lucide:circle-alert" width="14" height="14" />{{ error }}</p>

      <footer v-if="revealed" class="aa-foot">
        <q-btn unelevated no-caps color="primary" label="Done" @click="close" />
      </footer>
      <footer v-else class="aa-foot">
        <q-btn flat no-caps label="Cancel" :disable="busy" @click="close" />
        <q-btn
          unelevated
          no-caps
          type="submit"
          :color="spec.danger ? 'negative' : 'primary'"
          :label="spec.confirm"
          :loading="busy"
          :disable="!canSubmit"
        />
      </footer>
    </form>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import type { AccountActionSpec, AccountActionInput } from './accountActions'
import type { Restriction } from '@/api/accounts'

const props = defineProps<{ spec: AccountActionSpec | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const reason = ref('')
const until = ref('')
const title = ref('')
const picked = ref<Restriction[]>([])
const value = ref('')
const typed = ref('')
const revealed = ref<{ label: string; value: string; note: string } | null>(null)
const copied = ref(false)
const busy = ref(false)
const error = ref('')

watch(() => props.spec, (s) => {
  reason.value = ''
  until.value = ''
  title.value = s?.message && !s.titleLabel ? 'A message from OSAS' : ''
  picked.value = [...(s?.picked ?? [])]
  value.value = s?.field?.initial ?? ''
  revealed.value = null
  typed.value = ''
  copied.value = false
  error.value = ''
  busy.value = false
})

const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)

/** Taking something away always needs a reason; giving it back does not. */
const addsRestriction = computed(() => picked.value.some((k) => !(props.spec?.picked ?? []).includes(k)))
const reasonRequired = computed(() => props.spec?.reason === 'required' || addsRestriction.value)
const changed = computed(() => !props.spec?.restrictions || picked.value.slice().sort().join() !== [...(props.spec.picked ?? [])].sort().join())
const canSubmit = computed(() =>
  !busy.value && changed.value
  && (!reasonRequired.value || reason.value.trim().length > 0)
  && (!props.spec?.message || title.value.trim().length > 0)
  && (!props.spec?.confirmPhrase || typed.value.trim() === props.spec.confirmPhrase)
  && (!props.spec?.field || (value.value.trim().length > 0 && value.value.trim() !== (props.spec.field.initial ?? ''))),
)

async function copy() {
  if (!revealed.value) return
  try {
    await navigator.clipboard.writeText(revealed.value.value)
    copied.value = true
  } catch {
    // No clipboard permission: the value is on screen to copy by hand.
  }
}

function close() {
  if (!busy.value) emit('close')
}

async function submit() {
  if (!props.spec || !canSubmit.value) return
  busy.value = true
  error.value = ''
  const input: AccountActionInput = {
    reason: reason.value.trim() || null,
    // End of that day in Manila, so "until Oct 30" means through Oct 30.
    until: until.value ? new Date(`${until.value}T23:59:59+08:00`).toISOString() : null,
    title: title.value.trim(),
    restrictions: picked.value,
    value: value.value.trim(),
  }
  try {
    const result = await props.spec.run(input)
    busy.value = false
    if (result) revealed.value = result
    else emit('close')
  } catch (e) {
    busy.value = false
    error.value = (e as { message?: string })?.message || 'That did not go through. Try again.'
  }
}
</script>

<style scoped>
.aa {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 460px;
  max-width: calc(100vw - 32px);
  padding: 20px;
  border-radius: var(--radius);
  background: var(--c-surface);
  color: var(--c-text);
  font-family: var(--font-body);
  box-shadow: var(--shadow-lg);
  box-sizing: border-box;
}
.aa-head { display: flex; align-items: center; gap: 12px; }
.aa-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c-primary) 12%, var(--c-surface));
  color: var(--c-primary);
}
.aa-icon--danger { background: color-mix(in srgb, var(--c-danger) 12%, var(--c-surface)); color: var(--c-danger); }
.aa-titles { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.aa-title { margin: 0; color: var(--c-ink); font-family: var(--font-display); font-size: 17px; font-weight: 700; line-height: 1.25; }
.aa-who { overflow: hidden; color: var(--c-muted); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
.aa-x {
  display: flex;
  align-self: flex-start;
  padding: 4px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--c-muted);
  cursor: pointer;
}
.aa-x:hover { color: var(--c-ink); background: var(--c-surface-2); }
.aa-blurb { margin: 0; color: var(--c-text); font-size: 13px; line-height: 1.5; }
.aa-field { display: flex; flex-direction: column; gap: 6px; }
.aa-label { color: var(--c-ink); font-size: 12.5px; font-weight: 600; }
.aa-opt { margin-left: 4px; color: var(--c-muted); font-weight: 400; }
.aa-check { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border: 1px solid var(--c-border); border-radius: 8px; cursor: pointer; }
.aa-check-label { display: block; color: var(--c-ink); font-size: 13px; font-weight: 600; }
.aa-check-hint { display: block; color: var(--c-muted); font-size: 12px; }
.aa-error { display: flex; align-items: center; gap: 6px; margin: 0; color: var(--c-danger); font-size: 12.5px; }
.aa-reveal { display: flex; flex-direction: column; gap: 6px; padding: 12px; border: 1px solid var(--c-border); border-radius: 10px; background: var(--c-surface-2); }
.aa-reveal-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.aa-reveal-value { color: var(--c-ink); font-family: var(--font-mono); font-size: 20px; font-weight: 700; letter-spacing: 0.06em; user-select: all; }
.aa-reveal-note { margin-left: 0; }
.aa-foot { display: flex; justify-content: flex-end; gap: 8px; }
</style>
