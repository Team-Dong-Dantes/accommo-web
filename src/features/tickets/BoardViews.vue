<template>
  <!-- Saved views down the board's left edge. One view and at most one
       category at a time; picking the active category again clears it. -->
  <nav class="views" aria-label="Ticket views">
    <button
      v-for="v in views"
      :key="v.value"
      type="button"
      class="view"
      :class="{ 'is-on': view === v.value }"
      :aria-pressed="view === v.value"
      :disabled="v.value !== 'all' && !v.count && view !== v.value"
      @click="$emit('update:view', v.value)"
    >
      <Icon :icon="v.icon" width="16" height="16" />
      <span class="view-label">{{ v.label }}</span>
      <span class="view-count" :class="{ 'is-alert': v.value === 'overdue' && v.count > 0 }">{{ v.count }}</span>
    </button>

    <template v-if="categories.length">
      <h3 class="views-head">Category</h3>
      <button
        v-for="c in categories"
        :key="c.value"
        type="button"
        class="view"
        :class="{ 'is-on': category === c.value }"
        :aria-pressed="category === c.value"
        @click="$emit('update:category', category === c.value ? '' : c.value)"
      >
        <span class="view-dot" />
        <span class="view-label">{{ capitalize(c.value) }}</span>
        <span class="view-count">{{ c.count }}</span>
      </button>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { capitalize } from '@/utils/format'

export type BoardView = 'all' | 'mine' | 'unassigned' | 'overdue'

defineProps<{
  view: BoardView
  category: string
  views: { value: BoardView; label: string; icon: string; count: number }[]
  categories: { value: string; count: number }[]
}>()
defineEmits<{ (e: 'update:view', v: BoardView): void; (e: 'update:category', v: string): void }>()
</script>

<style scoped>
.views { display: flex; flex-direction: column; gap: 2px; width: 176px; flex-shrink: 0; overflow-y: auto; padding-right: var(--sp-2); }
.views-head { margin: var(--sp-4) 0 var(--sp-1); padding: 0 var(--sp-3); color: var(--c-muted); font-size: 10.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.view { display: flex; align-items: center; gap: var(--sp-2); width: 100%; padding: 7px var(--sp-3); border: none; border-radius: var(--radius-sm); background: transparent; color: var(--c-text); cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; text-align: left; transition: background var(--t-fast); }
.view:hover:not(:disabled) { background: var(--c-surface-2); }
.view:disabled { opacity: 0.45; cursor: default; }
.view.is-on { background: var(--c-primary-soft); color: var(--c-primary-ink); }
.view-label { overflow: hidden; flex: 1; min-width: 0; text-overflow: ellipsis; white-space: nowrap; }
.view-count { color: var(--c-muted); font-family: var(--font-mono); font-size: 11px; font-weight: 700; }
.view-count.is-alert { color: var(--c-danger); }
.view-dot { width: 6px; height: 6px; margin: 0 5px; border-radius: 50%; background: var(--c-border-strong); }
</style>
