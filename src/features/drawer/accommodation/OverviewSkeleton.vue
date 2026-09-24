<template>
  <!-- Stands in for OverviewCharts plus the Accepts | Amenities row while the
       record loads. Every block uses the loaded section's measurements, so the
       real content lands in place instead of pushing the panel around. -->
  <div class="os" aria-busy="true" aria-label="Loading accommodation overview">
    <q-skeleton type="rect" height="34px" class="os-standing" />

    <section class="os-sec">
      <div class="os-head"><q-skeleton type="text" width="110px" height="14px" /><q-skeleton type="text" width="150px" height="12px" /></div>
      <div v-for="n in 2" :key="n" class="os-bullet">
        <q-skeleton type="text" width="58px" height="14px" />
        <q-skeleton type="rect" height="8px" class="os-round" />
        <q-skeleton type="text" width="30px" height="16px" />
        <q-skeleton type="rect" width="72px" height="18px" class="os-pill" />
      </div>
    </section>

    <section class="os-sec">
      <div class="os-head"><q-skeleton type="text" width="90px" height="14px" /><q-skeleton type="text" width="170px" height="12px" /></div>
      <div v-for="(w, i) in FLOORS" :key="i" class="os-floor">
        <q-skeleton type="text" width="16px" height="12px" />
        <div class="os-slab">
          <q-skeleton v-for="(g, j) in w" :key="j" type="rect" height="21px" class="os-room" :style="{ flexGrow: g }" />
        </div>
        <q-skeleton type="text" width="24px" height="12px" />
      </div>
      <div class="os-legend"><q-skeleton v-for="n in 3" :key="n" type="text" width="58px" height="12px" /></div>
    </section>

    <div class="os-pair">
      <section class="os-sec os-half">
        <div class="os-head"><q-skeleton type="text" width="50px" height="14px" /><q-skeleton type="text" width="60px" height="12px" /></div>
        <div class="os-rating">
          <div class="os-avg"><q-skeleton type="text" width="44px" height="28px" /><q-skeleton type="text" width="54px" height="10px" /></div>
          <div class="os-cols"><q-skeleton v-for="(h, i) in COLS" :key="i" type="rect" :height="`${h}px`" class="os-col" /></div>
        </div>
      </section>
      <section class="os-sec os-half">
        <div class="os-head"><q-skeleton type="text" width="90px" height="14px" /><q-skeleton type="text" width="70px" height="12px" /></div>
        <q-skeleton type="text" width="96px" height="18px" />
        <q-skeleton type="rect" height="12px" class="os-round" />
        <div class="os-head"><q-skeleton type="text" width="48px" height="10px" /><q-skeleton type="text" width="48px" height="10px" /></div>
      </section>
    </div>

    <div class="os-details">
      <div class="os-detail"><q-skeleton type="text" width="56px" height="12px" /><q-skeleton type="text" width="64px" height="16px" /></div>
      <div class="os-detail os-wide">
        <q-skeleton type="text" width="72px" height="12px" />
        <div class="os-chips"><q-skeleton v-for="w in [56, 56, 82, 52]" :key="w" type="rect" :width="`${w}px`" height="22px" class="os-chip" /></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Rough room widths per floor, so the building reads as a building while loading. */
const FLOORS = [[3], [4, 1, 2], [1, 2, 3]]
const COLS = [14, 22, 30, 6, 4]
</script>

<style scoped>
.os { display: flex; flex-direction: column; }
.os-standing { margin-top: 6px; border-radius: 9px; }
.os-sec { display: flex; flex-direction: column; gap: 6px; padding: 9px 0; border-bottom: 1px solid var(--ar-border); }
.os-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.os-bullet { display: grid; grid-template-columns: 70px minmax(0, 1fr) 34px auto; align-items: center; gap: 8px; min-height: 22px; }
.os-round { border-radius: 4px; }
.os-pill { border-radius: 999px; }
.os-floor { display: grid; grid-template-columns: 20px minmax(0, 1fr) 30px; align-items: center; gap: 6px; }
.os-slab { display: flex; gap: 4px; padding: 4px; border-radius: 7px; background: var(--ar-soft); }
.os-room { flex-basis: 0; border-radius: 5px; }
.os-legend { display: flex; gap: 12px; }
.os-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; border-bottom: 1px solid var(--ar-border); }
.os-half { min-width: 0; border-bottom: none; }
.os-half + .os-half { padding-left: 16px; border-left: 1px solid var(--ar-border); }
.os-rating { display: flex; align-items: flex-end; gap: 12px; }
.os-avg { display: flex; flex-direction: column; gap: 4px; }
.os-cols { display: flex; flex: 1; align-items: flex-end; gap: 4px; height: 44px; }
.os-col { flex: 1; border-radius: 3px 3px 0 0; }
.os-details { display: flex; gap: 16px; padding: 9px 0 10px; }
.os-detail { display: flex; flex-direction: column; gap: 6px; }
.os-wide { flex: 1; padding-left: 16px; border-left: 1px solid var(--ar-border); }
.os-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.os-chip { border-radius: 6px; }
</style>
