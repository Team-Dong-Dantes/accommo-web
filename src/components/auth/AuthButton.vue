<template>
  <q-btn unelevated class="primary-action-btn full-width" v-bind="$attrs">
    <slot />
  </q-btn>
</template>

<style scoped>
/* Glass, to match the fields it sits under. It carries a heavier tint and a
   brighter edge than the inputs so it still reads as the primary action —
   a button at the same weight as the fields above it stops looking pressable. */
.primary-action-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
  height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 12px !important;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  backdrop-filter: blur(12px) saturate(1.2);
  box-shadow: 0 8px 26px -12px rgba(0, 0, 0, 0.6);
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.08s ease;
}

.primary-action-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.66);
}

.primary-action-btn:active {
  transform: translateY(1px);
}

.primary-action-btn:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.85);
  outline-offset: 2px;
}
</style>
