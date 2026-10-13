<template>
  <!-- The one dropdown in accommo-web, matching accommo-mobile's AppSelect: a
       field that opens a floating list with the current choice ticked. Built on
       q-field, so it takes the same props as the q-inputs beside it — outlined,
       dense, label, hint, clearable — and looks exactly like them. -->
  <q-field
    v-bind="$attrs"
    :model-value="display || null"
    :disable="disable"
    tabindex="0"
    class="picker-qfield"
    @update:model-value="onFieldUpdate"
    @click="open"
    @keydown.enter.space.prevent="open"
  >
    <template #control>
      <span class="picker-value" :class="{ 'picker-value--empty': !display }">{{ display || placeholder }}</span>
    </template>
    <template #append>
      <Icon icon="lucide:chevron-down" width="18" height="18" class="picker-icon" />
    </template>
  </q-field>

  <PickerDialog v-model="showing" :title="title">
    <div class="sel-list" role="listbox">
      <button
        v-for="opt in items"
        :key="String(opt.value)"
        type="button"
        role="option"
        class="sel-opt"
        :class="{ 'sel-opt--on': opt.value === (modelValue ?? null) }"
        :aria-selected="opt.value === (modelValue ?? null)"
        @click="pick(opt.value)"
      >
        <span class="sel-opt-label">{{ opt.label }}</span>
        <Icon v-if="opt.value === (modelValue ?? null)" icon="lucide:check" width="16" height="16" />
      </button>
    </div>
  </PickerDialog>
</template>

<script setup lang="ts" generic="T extends string | number">
import { computed, ref, useAttrs } from 'vue'
import { Icon } from '@iconify/vue'
import PickerDialog from './PickerDialog.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue: T | null | undefined
    /** A list of values, a list of {label, value}, or a value → label map. */
    options: readonly (T | { label: string; value: T | null })[] | Record<string, string>
    placeholder?: string
    disable?: boolean
  }>(),
  { placeholder: '', disable: false },
)

const emit = defineEmits<{ 'update:modelValue': [T | null] }>()
const attrs = useAttrs()

const showing = ref(false)

const items = computed(() =>
  Array.isArray(props.options)
    ? props.options.map((o) => (typeof o === 'object' ? o : { label: String(o), value: o }))
    : Object.entries(props.options).map(([value, label]) => ({ label, value: value as T })),
)

/** An option may stand for null ("Not recorded"), so it is looked up before falling back to the raw value. */
const display = computed(() => {
  const v = props.modelValue ?? null
  return items.value.find((o) => o.value === v)?.label ?? (v === null || v === '' ? '' : String(v))
})
const title = computed(() => String(attrs.label || attrs['aria-label'] || props.placeholder || 'Select'))

function open() {
  if (!props.disable) showing.value = true
}

/** q-field only ever emits here for its clear button. */
function onFieldUpdate(v: unknown) {
  if (v === null || v === undefined) emit('update:modelValue', null)
}

function pick(value: T | null) {
  emit('update:modelValue', value)
  showing.value = false
}
</script>

<style scoped>
.picker-qfield { cursor: pointer; }
.picker-value {
  display: flex;
  align-items: center;
  min-width: 0;
  color: var(--c-ink);
  line-height: 1.3;
}
.picker-value--empty { color: var(--c-muted); }
.picker-icon { color: var(--c-muted); }
.sel-list { display: flex; flex-direction: column; gap: 2px; }
.sel-opt {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--c-ink);
  cursor: pointer;
  font: inherit;
  font-size: 13.5px;
  line-height: 1.35;
  text-align: left;
}
.sel-opt:hover { background: var(--c-surface-2); }
.sel-opt-label { flex: 1 1 auto; min-width: 0; }
.sel-opt--on,
.sel-opt--on:hover {
  background: var(--c-primary-soft);
  color: var(--c-primary-ink);
  font-weight: 700;
}
</style>
