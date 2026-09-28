<template>
  <!-- Mirrors the board: masthead with four counters, then two rows of three.
       A skeleton that does not match what replaces it just moves the page twice. -->
  <div class="dsk" aria-hidden="true">
    <div class="dsk-head">
      <div class="dsk-head-left">
        <span class="sk sk-title" />
        <span class="sk sk-sub" />
      </div>
      <div class="dsk-counters">
        <span v-for="i in 4" :key="i" class="sk sk-counter" />
      </div>
    </div>
    <div class="dsk-grid">
      <span v-for="i in 6" :key="i" class="sk" />
    </div>
  </div>
</template>

<style scoped>
.dsk {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--sp-3);
  height: 100%;
}
.sk {
  display: block;
  border-radius: var(--radius);
  background: linear-gradient(90deg, var(--c-surface-2), var(--c-border), var(--c-surface-2));
  background-size: 200% 100%;
  animation: dsk-shimmer 1.4s ease infinite;
}
.dsk-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.dsk-head-left { display: flex; flex-direction: column; gap: 8px; }
.sk-title { width: 240px; height: 26px; border-radius: 8px; }
.sk-sub { width: 160px; height: 12px; border-radius: 6px; }
.dsk-counters { display: flex; gap: var(--sp-2); }
.sk-counter { width: calc(13 * var(--u)); height: 50px; border-radius: var(--radius-sm); }
.dsk-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: var(--sp-3);
  min-height: 0;
}
@keyframes dsk-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .sk { animation: none; }
}
</style>
