<template>
  <!-- The floating card DateTimeField and AppSelect open: accommo-mobile's
       picker sheet, drawn with this app's tokens. -->
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="pd">
      <header class="pd-head">
        <h2 class="pd-title">{{ title }}</h2>
        <button type="button" class="pd-x" aria-label="Close" @click="emit('update:modelValue', false)">
          <Icon icon="lucide:x" width="16" height="16" />
        </button>
      </header>
      <div class="pd-body"><slot /></div>
      <footer v-if="$slots.footer" class="pd-foot"><slot name="footer" /></footer>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{ modelValue: boolean; title: string }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<style scoped>
.pd {
  /* Quasar passes clicks only to a div directly inside the dialog. */
  pointer-events: all;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 360px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 48px);
  padding: 18px;
  border-radius: var(--radius);
  background: var(--c-surface);
  color: var(--c-text);
  font-family: var(--font-body);
  box-shadow: var(--shadow-lg);
  box-sizing: border-box;
}
.pd-head { display: flex; align-items: center; gap: 12px; }
.pd-title {
  flex: 1;
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
}
.pd-x {
  display: flex;
  padding: 4px;
  border: none;
  border-radius: 6px;
  background: none;
  color: var(--c-muted);
  cursor: pointer;
}
.pd-x:hover { color: var(--c-ink); background: var(--c-surface-2); }
.pd-body { min-height: 0; overflow-y: auto; }
.pd-foot { display: flex; align-items: center; gap: 8px; }
</style>
