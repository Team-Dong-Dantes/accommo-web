<template>
  <Teleport to="body">
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
            :style="{ width: width, maxWidth: '92vw' }"
            role="dialog"
            aria-modal="true"
            @click.stop
          >
            <button class="dd-close" type="button" aria-label="Close" @click="close">
              <Icon icon="mdi:close" width="20" height="20" />
            </button>

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
    loading?: boolean
    closeOnBackdrop?: boolean
  }>(),
  {
    width: '440px',
    loading: false,
    closeOnBackdrop: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'closed'): void
}>()

function close() {
  emit('update:modelValue', false)
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
  justify-content: flex-end;
}
.dd-backdrop--static {
  background: transparent;
  backdrop-filter: none;
  pointer-events: none;
}

.dd-panel {
  position: relative;
  height: 100%;
  background: var(--c-surface);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  overflow: hidden;
}

.dd-close {
  position: absolute;
  top: 14px;
  right: 14px;
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
  border-radius: 6px;
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
  transform: translateX(100%);
}
</style>
