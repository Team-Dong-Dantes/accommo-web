<template>
  <q-btn unelevated class="primary-action-btn full-width" v-bind="$attrs">
    <slot />
  </q-btn>
</template>

<style scoped>
.primary-action-btn {
  background: var(--c-primary) !important;
  color: #ffffff !important;
  height: 44px;
  border-radius: var(--radius-btn) !important;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);
  transition: all 0.2s ease;
}

.primary-action-btn:hover {
  background: var(--c-primary-ink) !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 118, 110, 0.3);
}
</style>
