<template>
  <main class="dashboard-skeleton" aria-busy="true" aria-label="Preparing dashboard">
    <section class="skeleton-briefing">
      <div class="skeleton-title skel" />
      <div class="skeleton-date skel" />
    </section>

    <section class="skeleton-command">
      <div class="skeleton-command-main">
        <span class="skeleton-kicker skel" />
        <span class="skeleton-message skel" />
        <span class="skeleton-copy skel" />
        <span class="skeleton-button skel" />
      </div>
      <div class="skeleton-command-queues">
        <div v-for="item in 3" :key="item" class="skeleton-queue">
          <span class="skeleton-kicker skel" />
          <span class="skeleton-number skel" />
          <span class="skeleton-short-copy skel" />
        </div>
      </div>
    </section>

    <div class="skeleton-grid">
      <div class="skeleton-column">
        <section class="skeleton-panel skeleton-chart-panel">
          <div class="skeleton-panel-head"><span class="skeleton-heading skel" /><span class="skeleton-toggle skel" /></div>
          <div class="skeleton-chart"><span v-for="item in 8" :key="item" class="skeleton-bar skel" :style="{ height: `${32 + ((item * 17) % 54)}%` }" /></div>
          <span class="skeleton-legend skel" />
        </section>

        <section class="skeleton-panel">
          <div class="skeleton-panel-head"><span class="skeleton-heading skel" /><span class="skeleton-link skel" /></div>
          <div class="skeleton-stats-three"><span v-for="item in 3" :key="item" class="skeleton-stat skel" /></div>
          <div class="skeleton-charts"><span class="skeleton-mini-chart skel" /><span class="skeleton-mini-chart skel" /></div>
        </section>

        <section class="skeleton-panel skeleton-follow-up">
          <div class="skeleton-panel-head"><span class="skeleton-heading skel" /><span class="skeleton-link skel" /></div>
          <div v-for="item in 4" :key="item" class="skeleton-list-row"><span class="skeleton-row-label skel" /><span class="skeleton-track skel" /></div>
        </section>
      </div>

      <div class="skeleton-column">
        <section class="skeleton-panel">
          <div class="skeleton-panel-head"><span class="skeleton-heading skel" /><span class="skeleton-link skel" /></div>
          <div class="skeleton-triage skel" />
          <div class="skeleton-ticket-facts"><span v-for="item in 3" :key="item" class="skeleton-ticket-fact skel" /></div>
          <div v-for="item in 3" :key="item" class="skeleton-ticket-row"><span class="skeleton-ref skel" /><span class="skeleton-ticket-title skel" /><span class="skeleton-pill skel" /></div>
        </section>

        <section class="skeleton-panel">
          <div class="skeleton-panel-head"><span class="skeleton-heading skel" /><span class="skeleton-link skel" /></div>
          <div class="skeleton-capacity skel" />
          <div class="skeleton-capacity-stats"><span v-for="item in 4" :key="item" class="skeleton-capacity-stat skel" /></div>
        </section>
      </div>
    </div>
    <span class="sr-only">Preparing dashboard data.</span>
  </main>
</template>

<style scoped>
.dashboard-skeleton { display: flex; flex-direction: column; gap: var(--sp-4); }
.skeleton-briefing, .skeleton-command, .skeleton-panel { border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface); box-shadow: var(--shadow-sm); }
.skeleton-briefing { padding: var(--sp-5); min-height: 126px; background: linear-gradient(112deg, #0d312c 0%, #12443d 58%, #15554b 100%); }
.skeleton-title { width: min(340px, 74%); height: 34px; background: rgba(234, 244, 241, 0.24); }
.skeleton-date { width: 150px; height: 12px; margin-top: var(--sp-3); background: rgba(234, 244, 241, 0.18); }
.skeleton-command { display: grid; grid-template-columns: minmax(320px, 1.2fr) minmax(320px, 1fr); overflow: hidden; }
.skeleton-command-main { position: relative; display: flex; flex-direction: column; gap: var(--sp-2); min-height: 144px; padding: var(--sp-4) var(--sp-5); background: var(--c-surface-2); }
.skeleton-kicker { width: 84px; height: 10px; }
.skeleton-message { width: min(310px, 82%); height: 18px; margin-top: var(--sp-1); }
.skeleton-copy { width: min(390px, 96%); height: 11px; }
.skeleton-button { position: absolute; top: 50%; right: var(--sp-5); width: 132px; height: 40px; transform: translateY(-50%); }
.skeleton-command-queues { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.skeleton-queue { display: flex; flex-direction: column; justify-content: center; gap: var(--sp-2); min-height: 144px; padding: var(--sp-4); border-left: 1px solid var(--c-border); }
.skeleton-number { width: 44px; height: 28px; margin-top: var(--sp-1); }
.skeleton-short-copy { width: 78%; height: 10px; }
.skeleton-grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: var(--sp-4); }
.skeleton-column { display: flex; flex-direction: column; gap: var(--sp-4); min-width: 0; }
.skeleton-panel { padding: var(--sp-4); }
.skeleton-panel-head { display: flex; align-items: center; justify-content: space-between; min-height: 28px; margin-bottom: var(--sp-4); }
.skeleton-heading { width: 142px; height: 17px; }
.skeleton-toggle { width: 166px; height: 30px; }
.skeleton-link { width: 82px; height: 12px; }
.skeleton-chart { display: flex; align-items: end; justify-content: space-between; gap: 10px; height: 220px; padding: var(--sp-4) var(--sp-3) 0; border-bottom: 1px dashed var(--c-border); }
.skeleton-bar { width: 100%; max-width: 34px; }
.skeleton-legend { width: 240px; height: 20px; margin-top: var(--sp-3); }
.skeleton-stats-three { display: grid; grid-template-columns: 1.25fr 1fr 1fr; min-height: 116px; border: 1px solid var(--c-border); border-radius: var(--radius-sm); overflow: hidden; }
.skeleton-stat { margin: var(--sp-4); border-radius: 0; }
.skeleton-charts { display: grid; grid-template-columns: 1.15fr 1fr; gap: var(--sp-4); margin-top: var(--sp-4); }
.skeleton-mini-chart { display: block; height: 164px; }
.skeleton-follow-up { min-height: 224px; }
.skeleton-list-row { display: grid; grid-template-columns: minmax(120px, .9fr) minmax(110px, 1.1fr); gap: var(--sp-4); align-items: center; padding: var(--sp-3) 0; border-top: 1px solid var(--c-border); }
.skeleton-list-row:first-of-type { border-top: 0; }
.skeleton-row-label { width: 70%; height: 12px; }
.skeleton-track { height: 7px; }
.skeleton-triage { display: block; height: 122px; }
.skeleton-ticket-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; margin-top: var(--sp-3); overflow: hidden; border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-border); }
.skeleton-ticket-fact { height: 66px; border-radius: 0; }
.skeleton-ticket-row { display: grid; grid-template-columns: 80px minmax(0, 1fr) 58px; gap: var(--sp-3); align-items: center; min-height: 46px; border-bottom: 1px solid var(--c-border); }
.skeleton-ref { width: 62px; height: 11px; }.skeleton-ticket-title { width: 85%; height: 13px; }.skeleton-pill { justify-self: end; width: 52px; height: 20px; }
.skeleton-capacity { display: block; height: 116px; }.skeleton-capacity-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; margin-top: 1px; overflow: hidden; border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-border); }.skeleton-capacity-stat { height: 92px; border-radius: 0; }
.skel { overflow: hidden; border-radius: 5px; background: linear-gradient(100deg, var(--c-surface-2) 20%, color-mix(in srgb, var(--c-border) 74%, var(--c-surface)) 45%, var(--c-surface-2) 70%); background-size: 200% 100%; animation: dashboard-shimmer 1.5s ease-in-out infinite; }
.skeleton-briefing .skel { background: linear-gradient(100deg, rgba(234, 244, 241, .14) 20%, rgba(234, 244, 241, .3) 45%, rgba(234, 244, 241, .14) 70%); background-size: 200% 100%; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@keyframes dashboard-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (max-width: 1100px) { .skeleton-grid { grid-template-columns: 1fr; } }
@media (max-width: 1050px) { .skeleton-command { grid-template-columns: 1fr; }.skeleton-command-queues { border-top: 1px solid var(--c-border); }.skeleton-queue:first-child { border-left: 0; } }
@media (max-width: 720px) { .skeleton-briefing { padding: var(--sp-5) var(--sp-4); }.skeleton-command-main { min-height: 154px; padding: var(--sp-4); }.skeleton-button { position: static; width: 132px; margin-top: var(--sp-2); transform: none; }.skeleton-command-queues { grid-template-columns: 1fr; }.skeleton-queue { min-height: 80px; border-top: 1px solid var(--c-border); border-left: 0; }.skeleton-queue:first-child { border-top: 0; }.skeleton-stats-three { grid-template-columns: 1fr; }.skeleton-stat { min-height: 74px; margin: var(--sp-3); }.skeleton-charts { grid-template-columns: 1fr; }.skeleton-list-row { grid-template-columns: 1fr; gap: var(--sp-2); }.skeleton-ticket-facts { grid-template-columns: 1fr; }.skeleton-ticket-row { grid-template-columns: 64px minmax(0, 1fr) 48px; }.skeleton-capacity-stats { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .skel { animation: none; } }
</style>
