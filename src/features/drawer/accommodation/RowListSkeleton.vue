<template>
  <!-- Stands in for the Rooms tab (rowList.css) while the record loads: floor
       headings over ruled lists of rows, at the loaded rows' measurements. -->
  <div class="rs" aria-busy="true" aria-label="Loading rooms">
    <section v-for="(count, f) in [3, 2]" :key="f" class="rs-floor">
      <div class="rs-head">
        <q-skeleton type="text" width="52px" height="12px" />
        <span class="rs-rule"></span>
        <q-skeleton type="text" width="44px" height="12px" />
      </div>
      <div class="rs-list">
        <div v-for="n in count" :key="n" class="rs-row">
          <q-skeleton type="rect" width="38px" height="38px" class="rs-thumb" />
          <div class="rs-main">
            <q-skeleton type="text" width="72px" height="14px" />
            <q-skeleton type="text" width="44px" height="11px" />
          </div>
          <div class="rs-col"><q-skeleton v-for="b in 3" :key="b" type="rect" width="14px" height="14px" class="rs-bed" /></div>
          <q-skeleton type="rect" width="64px" height="20px" class="rs-pill" />
          <q-skeleton type="rect" width="16px" height="16px" class="rs-bed" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.rs { display: flex; flex-direction: column; gap: 16px; }
.rs-floor { display: flex; flex-direction: column; gap: 8px; }
.rs-head { display: flex; align-items: center; gap: 10px; }
.rs-rule { flex: 1; height: 1px; background: var(--ar-border); }
.rs-list { display: flex; flex-direction: column; gap: 1px; overflow: hidden; border: 1px solid var(--ar-border); border-radius: 10px; background: var(--ar-border); }
.rs-row { display: flex; align-items: center; gap: 14px; padding: 12px 14px; background: var(--ar-surface); }
.rs-thumb { flex-shrink: 0; border-radius: 8px; }
.rs-main { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.rs-col { display: flex; flex-shrink: 0; gap: 4px; width: 110px; }
.rs-bed { border-radius: 4px; }
.rs-pill { flex-shrink: 0; margin-right: 26px; border-radius: 999px; }
</style>
