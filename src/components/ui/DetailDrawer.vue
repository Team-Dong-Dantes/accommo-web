<template>
  <!-- anchored mode: dock the panel flush to the nearest positioned ancestor,
       no full-screen backdrop, no page padding (used for in-table side drawers) -->
  <div
    v-if="anchored && modelValue"
    class="dd-anchored-wrap"
    :class="`dd-anchored-${position}`"
  >
    <aside
      class="dd-panel dd-panel--anchored"
      :class="{ 'is-expanded': expanded }"
      :style="{ width: expanded ? expandedWidth : width, maxWidth: '94vw' }"
      role="dialog"
      aria-modal="false"
    >
      <button class="dd-close" :class="`dd-close-${position}`" type="button" aria-label="Close" @click="close">
        <Icon icon="mdi:close" width="20" height="20" />
      </button>

      <button
        v-if="expandable"
        class="dd-expand"
        :class="`dd-expand-${position}`"
        type="button"
        :aria-label="expanded ? 'Collapse panel' : 'Expand panel'"
        @click="toggleExpand"
      >
        <Icon :icon="expanded ? 'mdi:arrow-collapse-all' : 'mdi:arrow-expand-all' " width="20" height="20" />
      </button>

      <div class="dd-inner">
        <slot name="banner" />
        <header v-if="$slots.header" class="dd-header">
          <slot name="header">
            <div class="dd-header-text">
              <div class="dd-title text-display">{{ title }}</div>
              <div v-if="subtitle" class="dd-subtitle">{{ subtitle }}</div>
            </div>
          </slot>
        </header>
        <q-separator v-if="$slots.header" />
        <div class="dd-body">
          <template v-if="loading">
            <div v-for="n in 4" :key="n" class="dd-skel-row q-mb-lg">
              <q-skeleton type="text" width="40%" class="dd-skel-label" />
              <q-skeleton type="rect" height="14px" class="dd-skel-value" />
            </div>
          </template>
          <slot v-else />
        </div>
        <footer v-if="$slots.footer" class="dd-footer">
          <slot name="footer" />
        </footer>
      </div>
    </aside>
  </div>

  <!-- modal mode (default): full-screen overlay / telported to body -->
  <Teleport v-else to="body">
    <transition name="dd-fade">
      <div
        v-if="modelValue"
        class="dd-backdrop"
        :class="{ 'dd-backdrop--static': !closeOnBackdrop }"
        @click="onBackdropClick"
      >
        <transition name="dd-slide" @after-leave="$emit('closed')">
          <aside
            v-if="modelValue"
            class="dd-panel"
            :class="{ 'is-expanded': expanded }"
            :style="{ width: expanded ? expandedWidth : width, maxWidth: '94vw' }"
            role="dialog"
            aria-modal="true"
            @click.stop
          >
            <button class="dd-close" type="button" aria-label="Close" @click="close">
              <Icon icon="mdi:close" width="20" height="20" />
            </button>

            <button
              v-if="expandable"
              class="dd-expand"
              type="button"
              :aria-label="expanded ? 'Collapse panel' : 'Expand panel'"
              @click="toggleExpand"
            >
              <Icon :icon="expanded ? 'mdi:arrow-collapse-all' : 'mdi:arrow-expand-all'" width="20" height="20" />
            </button>

            <div class="dd-inner">
              <!-- Full-bleed hero / banner -->
              <slot name="banner" />

              <!-- Standard header (used when no banner supplied) -->
              <header v-if="$slots.header" class="dd-header">
                <slot name="header">
                  <div class="dd-header-text">
                    <div class="dd-title text-display">{{ title }}</div>
                    <div v-if="subtitle" class="dd-subtitle">{{ subtitle }}</div>
                  </div>
                </slot>
              </header>

              <q-separator v-if="$slots.header" />

              <!-- Body -->
              <div class="dd-body">
                <template v-if="loading">
                  <div v-for="n in 4" :key="n" class="dd-skel-row q-mb-lg">
                    <q-skeleton type="text" width="40%" class="dd-skel-label" />
                    <q-skeleton type="rect" height="14px" class="dd-skel-value" />
                  </div>
                </template>
                <slot v-else />
              </div>

              <!-- Footer -->
              <footer v-if="$slots.footer" class="dd-footer">
                <slot name="footer" />
              </footer>
            </div>
          </aside>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    subtitle?: string
    width?: string
    expandedWidth?: string
    expandable?: boolean
    expanded?: boolean
    loading?: boolean
    closeOnBackdrop?: boolean
    /** Dock the panel flush to its positioned parent instead of a full-screen overlay. */
    anchored?: boolean
    /** Which side the anchored panel docks to. */
    position?: 'left' | 'right'
  }>(),
  {
    width: '440px',
    expandedWidth: 'min(860px, 92vw)',
    expandable: false,
    expanded: false,
    loading: false,
    closeOnBackdrop: true,
    anchored: false,
    position: 'right',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:expanded', value: boolean): void
  (e: 'closed'): void
}>()

function close() {
  emit('update:modelValue', false)
}

function toggleExpand() {
  emit('update:expanded', !props.expanded)
}

function onBackdropClick() {
  if (props.closeOnBackdrop) close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.dd-backdrop {
  position: fixed;
  inset: 0;
  z-index: 6000;
  background: rgba(16, 32, 28, 0.42);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-start;
  padding: var(--sp-4);
  box-sizing: border-box;
}
.dd-backdrop--static {
  background: transparent;
  backdrop-filter: none;
  pointer-events: none;
}

.dd-panel {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}
.dd-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.dd-close {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 5;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-ink);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast), transform var(--t-fast);
}
.dd-close:hover {
  background: var(--c-border);
  transform: scale(1.05);
}

.dd-expand {
  position: absolute;
  top: 14px;
  right: -42px;
  z-index: 5;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-ink);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast), transform var(--t-fast);
}
.dd-expand:hover {
  background: var(--c-border);
  transform: scale(1.05);
}

.dd-header {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: var(--sp-5) var(--sp-5) var(--sp-4);
}
.dd-header-text {
  min-width: 0;
}
.dd-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--c-ink);
  line-height: 1.2;
}
.dd-subtitle {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--c-muted);
  margin-top: 2px;
}

.dd-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--sp-4) var(--sp-5) var(--sp-5);
}

.dd-footer {
  flex: 0 0 auto;
  padding: var(--sp-4) var(--sp-5);
  border-top: 1px solid var(--c-border);
  background: var(--c-surface-2);
}

/* Skeleton */
.dd-skel-label {
  margin-bottom: 8px;
}
.dd-skel-value {
  border-radius: var(--radius-sm);
}

/* Anchored (in-table) mode ------------------------------------------------ */
.dd-anchored-wrap {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 460px;
  display: flex;
  pointer-events: none; /* empty area lets clicks pass through */
  z-index: 30;
}
.dd-anchored-left {
  left: 0;
}
.dd-anchored-right {
  right: 0;
}
.dd-panel--anchored {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  width: 100% !important; /* override inline width; fill the anchor wrap */
  max-width: none !important;
  height: 100%;
}
.dd-panel--anchored .dd-inner {
  height: 100%;
  border-radius: var(--radius-lg);
  border: 1px solid var(--c-border);
}
/* Close button flush to the panel edge, on the correct side */
.dd-close-right {
  left: auto !important;
  right: 10px !important;
}
.dd-close-left {
  left: 10px !important;
  right: auto !important;
}
.dd-expand-right {
  right: auto !important;
  left: -42px !important;
}
.dd-expand-left {
  right: -42px !important;
  left: auto !important;
}

/* Transitions */
.dd-fade-enter-active,
.dd-fade-leave-active {
  transition: opacity 0.22s ease;
}
.dd-fade-enter-from,
.dd-fade-leave-to {
  opacity: 0;
}

.dd-slide-enter-active,
.dd-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.dd-slide-enter-from,
.dd-slide-leave-to {
  transform: translateX(-100%);
}
</style>
