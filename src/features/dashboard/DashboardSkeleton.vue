<template>
  <!-- Mirrors the real proportions: masthead, the backlog board, then the
       6/6/7/5/12 chart grid. A skeleton that does not match what replaces it
       just moves the page twice. -->
  <div class="dsk" aria-hidden="true">
    <div class="dsk-intro">
      <div class="dsk-intro-left">
        <span class="sk sk-title" />
        <span class="sk sk-sub" />
      </div>
      <div class="dsk-counters">
        <span v-for="i in 4" :key="i" class="sk sk-counter" />
      </div>
    </div>

    <div class="sk sk-board" />

    <div class="dsk-grid">
      <div class="sk s6" /><div class="sk s6" />
      <div class="sk s7" /><div class="sk s5" />
      <div class="sk s12" />
    </div>
  </div>
</template>

<style scoped>
.dsk { display: flex; flex-direction: column; gap: clamp(14px, 1.5vw, 18px); }

.sk {
  display: block;
  border-radius: var(--radius-lg, 16px);
  background: linear-gradient(90deg, var(--c-surface-2), var(--c-border), var(--c-surface-2));
  background-size: 200% 100%;
  animation: dsk-shimmer 1.4s ease infinite;
}

.dsk-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--c-border);
}
.dsk-intro-left { display: flex; flex-direction: column; gap: 8px; }
.sk-title { width: 240px; height: 26px; border-radius: 8px; }
.sk-sub { width: 160px; height: 12px; border-radius: 6px; }
.dsk-counters { display: flex; gap: clamp(16px, 2.4vw, 34px); }
.sk-counter { width: 96px; height: 38px; border-radius: 8px; }

/* Squared off, like the board it stands in for. */
.sk-board { height: 250px; border-radius: 6px; }

.dsk-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(12px, 1.4vw, 18px);
}
.s5 { grid-column: span 5; height: 380px; }
.s6 { grid-column: span 6; height: 430px; }
.s7 { grid-column: span 7; height: 380px; }
.s12 { grid-column: span 12; height: 400px; }

@keyframes dsk-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (max-width: 1100px) {
  .s5, .s6, .s7 { grid-column: span 12; }
}
@media (prefers-reduced-motion: reduce) {
  .sk { animation: none; }
}
</style>
