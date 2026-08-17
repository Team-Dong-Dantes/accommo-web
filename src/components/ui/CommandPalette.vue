<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)"
    transition-show="fade" transition-hide="fade" class="command-palette-dialog" @show="onShow" @hide="onHide">
    <q-card class="command-palette" flat>
      <div class="cp-search row items-center no-wrap">
        <Icon icon="mdi:magnify" width="20" height="20" class="cp-search-icon" />
        <input ref="inputRef" v-model="query" type="text" placeholder="Search pages, actions…"
          class="cp-input" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="selectActive" />
        <kbd class="cp-kbd">ESC</kbd>
      </div>

      <q-separator class="cp-sep" />

      <q-scroll-area class="cp-results" :thumb-style="{ width: '6px', borderRadius: '6px', background: 'rgba(0,0,0,0.18)' }">
        <div v-if="filtered.length === 0" class="cp-empty">
          <Icon icon="mdi:search-off-outline" width="32" height="32" />
          <div class="q-mt-sm">No results for "{{ query }}"</div>
        </div>

        <div v-for="(item, idx) in filtered" :key="item.id">
          <div v-if="showGroup(item, idx)" class="cp-group-label">{{ item.group || 'Navigation' }}</div>
          <div class="cp-item row items-center no-wrap" :class="{ 'cp-item--active': idx === activeIndex }"
            @mouseenter="activeIndex = idx" @click="selectItem(item)">
            <Icon :icon="item.icon" width="20" height="20" class="cp-item-icon" />
            <span class="cp-item-label">{{ item.label }}</span>
            <Icon v-if="idx === activeIndex" icon="mdi:keyboard-return" width="16" height="16" class="cp-item-enter" />
          </div>
        </div>
      </q-scroll-area>

      <q-separator class="cp-sep" />
      <div class="cp-footer row items-center justify-between">
        <div class="row items-center q-gutter-x-sm cp-hint">
          <span><kbd class="cp-kbd">↑</kbd><kbd class="cp-kbd q-ml-xs">↓</kbd> navigate</span>
          <span><kbd class="cp-kbd">↵</kbd> select</span>
        </div>
        <div class="cp-hint">Accommo Command</div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { flattenNav, type FlatNavItem } from '../layout/nav-config';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const router = useRouter();
const query = ref('');
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

const allItems = flattenNav();

const filtered = computed<FlatNavItem[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return allItems;
  return allItems.filter(
    (i) => i.label.toLowerCase().includes(q) || (i.group ?? '').toLowerCase().includes(q)
  );
});

function showGroup(item: FlatNavItem, idx: number) {
  if (idx === 0) return true;
  return filtered.value[idx - 1]?.group !== item.group;
}

function move(delta: number) {
  if (filtered.value.length === 0) return;
  const next = activeIndex.value + delta;
  activeIndex.value = (next + filtered.value.length) % filtered.value.length;
  scrollActiveIntoView();
}

function selectItem(item: FlatNavItem) {
  emit('update:modelValue', false);
  void router.push(item.to);
}

function selectActive() {
  const item = filtered.value[activeIndex.value];
  if (item) selectItem(item);
}

function onShow() {
  query.value = '';
  activeIndex.value = 0;
  void nextTick(() => inputRef.value?.focus());
}

function onHide() {
  activeIndex.value = 0;
}

function scrollActiveIntoView() {
  void nextTick(() => {
    const el = document.querySelector('.cp-item--active');
    el?.scrollIntoView({ block: 'nearest' });
  });
}

watch(filtered, () => {
  activeIndex.value = 0;
});
</script>

<style scoped>
.command-palette-dialog :deep(.q-dialog__inner) {
  max-width: 560px;
}

.command-palette {
  width: 560px;
  max-width: 92vw;
  border-radius: var(--radius-lg);
  background: var(--c-surface);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--c-border);
}

.cp-search {
  padding: 14px 16px;
  gap: 12px;
}

.cp-search-icon {
  color: var(--c-muted);
  flex-shrink: 0;
}

.cp-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--c-ink);
}

.cp-input::placeholder {
  color: var(--c-muted);
}

.cp-sep {
  background: var(--c-border);
}

.cp-results {
  max-height: 360px;
  min-height: 120px;
  padding: 8px;
}

.cp-group-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-muted);
  padding: 12px 12px 6px;
}

.cp-item {
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  gap: 12px;
  transition: background 0.12s ease;
}

.cp-item--active {
  background: var(--c-primary-soft);
}

.cp-item-icon {
  color: var(--c-primary);
  flex-shrink: 0;
}

.cp-item-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
  flex: 1;
}

.cp-item-enter {
  color: var(--c-muted);
}

.cp-empty {
  text-align: center;
  color: var(--c-muted);
  padding: 36px 0;
  font-size: 13px;
  font-weight: 600;
}

.cp-footer {
  padding: 10px 16px;
  background: var(--c-surface-2);
}

.cp-hint {
  font-size: 11px;
  font-weight: 600;
  color: var(--c-muted);
}

.cp-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 5px;
  background: var(--c-surface);
  border: 1px solid var(--c-border-strong);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--c-muted);
  line-height: 1;
}
</style>
