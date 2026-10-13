<template>
  <!-- The one date/time control in accommo-web, matching accommo-mobile's
       DateTimeField: the same calendar and clock, in the same floating card, in
       place of the browser's <input type="date|datetime-local">. Built on
       q-field, so it takes the same props as the q-inputs beside it — outlined,
       dense, label, hint, rules, clearable — and looks exactly like them. -->
  <q-field
    v-bind="$attrs"
    :model-value="modelValue || null"
    :disable="disable"
    :rules="rules"
    tabindex="0"
    class="picker-qfield"
    @update:model-value="onFieldUpdate"
    @click="open"
    @keydown.enter.space.prevent="open"
  >
    <template #control>
      <span class="picker-value" :class="{ 'picker-value--empty': !modelValue }">{{ display || placeholder }}</span>
    </template>
    <template #append>
      <Icon :icon="mode === 'date' ? 'lucide:calendar' : 'lucide:calendar-clock'" width="16" height="16" class="picker-icon" />
    </template>
  </q-field>

  <PickerDialog v-model="showing" :title="title">
    <!-- Date and time are two steps rather than two stacked panels, as on mobile;
         the pills double as a summary of what has been chosen so far. -->
    <div v-if="mode === 'datetime'" class="pick-steps">
      <button type="button" class="step" :class="{ 'step--on': step === 'date' }" @click="step = 'date'">
        {{ draftDate ? prettyDate(draftDate) : 'Date' }}
      </button>
      <button type="button" class="step" :class="{ 'step--on': step === 'time' }" @click="step = 'time'">
        {{ draftTime ? prettyTime(draftTime) : 'Time' }}
      </button>
    </div>
    <q-date v-show="step === 'date'" v-model="draftDate" mask="YYYY-MM-DD" minimal flat :options="allowed" class="pick-body" />
    <q-time v-if="mode === 'datetime'" v-show="step === 'time'" v-model="draftTime" mask="HH:mm" flat class="pick-body" />

    <template #footer>
      <q-btn flat no-caps label="Clear" @click="set('')" />
      <span class="pick-spacer" />
      <q-btn flat no-caps label="Cancel" @click="showing = false" />
      <q-btn unelevated no-caps color="primary" label="Done" :disable="!draftDate" @click="commit" />
    </template>
  </PickerDialog>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { Icon } from '@iconify/vue'
import PickerDialog from './PickerDialog.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** 'YYYY-MM-DD' in date mode, 'YYYY-MM-DDTHH:mm' in datetime mode — the
        strings the native inputs produced, so callers keep their own parsing. */
    modelValue: string | null | undefined
    mode?: 'date' | 'datetime'
    /** Earliest selectable day, 'YYYY-MM-DD'. */
    min?: string
    /** Latest selectable day, 'YYYY-MM-DD'. */
    max?: string
    placeholder?: string
    disable?: boolean
    rules?: Array<(val: string | null | undefined) => true | string>
  }>(),
  { mode: 'date', min: '', max: '', placeholder: '', disable: false, rules: () => [] },
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()
const attrs = useAttrs()

const showing = ref(false)
const step = ref<'date' | 'time'>('date')
const draftDate = ref('')
const draftTime = ref('')

const title = computed(() =>
  String(attrs.label || attrs['aria-label'] || props.placeholder || (props.mode === 'date' ? 'Pick a date' : 'Pick a date and time')),
)

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** The next whole hour: the sensible default for a notice, never "right now". */
function nextHour(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  return `${pad(d.getHours())}:00`
}

function open() {
  if (props.disable) return
  const [datePart = '', timePart = ''] = (props.modelValue ?? '').split('T')
  draftDate.value = datePart
  draftTime.value = timePart.slice(0, 5) || nextHour()
  step.value = 'date'
  showing.value = true
}

function set(value: string) {
  emit('update:modelValue', value)
  showing.value = false
}

function commit() {
  if (!draftDate.value) return
  set(props.mode === 'date' ? draftDate.value : `${draftDate.value}T${draftTime.value}`)
}

/** q-field only ever emits here for its clear button. */
function onFieldUpdate(v: unknown) {
  if (v === null || v === undefined) emit('update:modelValue', '')
}

/** QDate calls this per day; comparing the same 'YYYY-MM-DD' shape it hands in. */
function allowed(day: string): boolean {
  const d = day.replace(/\//g, '-')
  return (!props.min || d >= props.min) && (!props.max || d <= props.max)
}

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function prettyTime(hhmm: string): string {
  const d = new Date(`2000-01-01T${hhmm}`)
  return Number.isNaN(d.getTime()) ? hhmm : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const display = computed(() => {
  if (!props.modelValue) return ''
  const [datePart = '', timePart = ''] = props.modelValue.split('T')
  if (props.mode === 'date') return prettyDate(datePart)
  return `${prettyDate(datePart)} · ${prettyTime(timePart.slice(0, 5))}`
})
</script>

<style scoped>
.picker-qfield { cursor: pointer; }
.picker-value {
  display: flex;
  align-items: center;
  min-width: 0;
  color: var(--c-ink);
  white-space: nowrap;
}
.picker-value--empty { color: var(--c-muted); }
.picker-icon { color: var(--c-muted); }
.pick-steps { display: flex; gap: 6px; margin-bottom: 8px; }
.step {
  min-height: 32px;
  flex: 1 1 0;
  padding: 0 10px;
  border: 1px solid var(--c-border-strong);
  border-radius: 999px;
  background: var(--c-surface);
  color: var(--c-muted);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}
.step--on {
  border-color: var(--c-primary);
  background: var(--c-primary-soft);
  color: var(--c-primary-ink);
}
/* QDate and QTime bring their own surface; let the card show through. */
.pick-body { width: 100%; background: transparent; box-shadow: none; }
.pick-spacer { flex: 1 1 auto; }
</style>
