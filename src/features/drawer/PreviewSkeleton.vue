<template>
  <div>
    <!-- Common top bar -->
    <div class="dd-header row items-center justify-between q-pa-md">
      <q-skeleton type="text" width="160px" height="22px" />
      <q-skeleton type="circle" size="36px" />
    </div>
    <q-separator style="background: var(--c-border)" />

    <!-- Accommodation preview skeleton -->
    <template v-if="kind === 'accommodation'">
      <div class="q-pa-md">
        <div class="row items-center q-gutter-x-md">
          <q-skeleton type="circle" size="72px" />
          <div class="col">
            <q-skeleton type="text" width="55%" height="24px" class="q-mb-xs" />
            <div class="row q-gutter-x-sm q-mt-xs">
              <q-skeleton type="rect" width="96px" height="22px" style="border-radius: 999px" />
              <q-skeleton type="rect" width="96px" height="22px" style="border-radius: 999px" />
            </div>
          </div>
        </div>
      </div>
      <div class="q-px-md q-pb-md">
        <div class="row border-all rounded-borders q-pa-md text-center" style="border-radius: var(--radius-sm);">
          <div v-for="n in 4" :key="n" class="col" :class="n < 4 ? 'border-right' : ''">
            <q-skeleton type="text" width="60%" class="q-mx-auto q-mb-xs" />
            <q-skeleton type="text" width="50%" class="q-mx-auto" />
          </div>
        </div>
      </div>
      <div class="q-px-md q-pb-md">
        <div class="border-all rounded-borders" style="border-radius: var(--radius-sm);">
          <div class="row items-center justify-between q-pa-md border-bottom">
            <q-skeleton type="text" width="40%" />
            <q-skeleton type="rect" width="104px" height="22px" style="border-radius: 999px" />
          </div>
          <div class="row q-pa-sm">
            <div v-for="n in 4" :key="n" class="col" :class="n < 4 ? 'border-right' : ''">
              <div class="q-pa-xs">
                <q-skeleton type="text" width="50%" class="q-mb-xs" />
                <q-skeleton type="text" width="60%" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="q-px-md q-pb-md">
        <div class="dd-hc-list">
          <div v-for="n in 2" :key="n" class="dd-hc-row">
            <div class="dd-hc-rail">
              <q-skeleton type="circle" size="40px" />
            </div>
            <div class="dd-hc-card border-all rounded-borders" style="border-radius: var(--radius-sm);">
              <div class="row justify-between items-center">
                <q-skeleton type="text" width="55%" height="16px" />
                <q-skeleton type="rect" width="64px" height="20px" style="border-radius: 999px;" />
              </div>
              <div class="row justify-between items-end">
                <q-skeleton type="text" width="40%" height="12px" />
                <q-skeleton type="text" width="28%" height="12px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Room Preview skeleton -->
    <template v-else-if="kind === 'room'">
      <div class="q-pa-md">
        <div class="row items-center q-gutter-x-md">
          <q-skeleton type="circle" size="72px" />
          <div class="col">
            <q-skeleton type="text" width="50%" height="24px" class="q-mb-xs" />
            <div class="row q-gutter-x-sm q-mt-xs">
              <q-skeleton type="rect" width="84px" height="22px" style="border-radius: 999px" />
              <q-skeleton type="rect" width="72px" height="22px" style="border-radius: 999px" />
            </div>
          </div>
        </div>
      </div>
      <div class="q-px-md q-pb-md">
        <div class="row border-all rounded-borders q-pa-md text-center" style="border-radius: var(--radius-sm);">
          <div v-for="n in 3" :key="n" class="col" :class="n < 3 ? 'border-right' : ''">
            <q-skeleton type="text" width="60%" class="q-mx-auto q-mb-xs" />
            <q-skeleton type="text" width="50%" class="q-mx-auto" />
          </div>
        </div>
      </div>
      <div class="q-px-md q-pb-md">
        <div class="border-all rounded-borders" style="border-radius: var(--radius-sm);">
          <div class="row items-center justify-between q-pa-md border-bottom">
            <q-skeleton type="text" width="40%" />
            <q-skeleton type="rect" width="104px" height="22px" style="border-radius: 999px" />
          </div>
          <div class="row q-pa-sm">
            <div v-for="n in 3" :key="n" class="col" :class="n < 3 ? 'border-right' : ''">
              <div class="q-pa-xs">
                <q-skeleton type="text" width="50%" class="q-mb-xs" />
                <q-skeleton type="text" width="60%" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="q-px-md q-pb-md">
        <!-- Matches DetailSections: one bordered card of titled sections. -->
        <div class="sk-card">
          <div v-for="g in 2" :key="g" class="sk-group">
            <div class="sk-head"><q-skeleton type="text" width="34%" /></div>
            <div class="sk-body">
              <div v-for="c in 2" :key="c" class="sk-col">
                <div v-for="n in 2" :key="n" class="sk-row">
                  <q-skeleton type="text" width="42%" />
                  <q-skeleton type="text" width="34%" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- User (default) skeleton -->
    <template v-else>
      <div class="q-pa-md">
        <div class="row items-center q-gutter-x-md">
          <q-skeleton type="circle" size="72px" />
          <div class="col">
            <q-skeleton type="text" width="55%" height="24px" class="q-mb-xs" />
            <div class="row q-gutter-x-sm q-mt-xs">
              <q-skeleton type="rect" width="84px" height="22px" style="border-radius: 999px" />
              <q-skeleton type="rect" width="72px" height="22px" style="border-radius: 999px" />
            </div>
          </div>
        </div>
      </div>
      <div class="q-px-md q-pb-md">
        <div class="row border-all rounded-borders q-pa-md text-center" style="border-radius: var(--radius-sm);">
          <div v-for="n in 3" :key="n" class="col" :class="n < 3 ? 'border-right' : ''">
            <q-skeleton type="text" width="60%" class="q-mx-auto q-mb-xs" />
            <q-skeleton type="text" width="50%" class="q-mx-auto" />
          </div>
        </div>
      </div>
      <div class="q-px-md q-pb-md">
        <!-- Matches DetailSections: one bordered card of titled sections. -->
        <div class="sk-card">
          <div v-for="g in 2" :key="g" class="sk-group">
            <div class="sk-head"><q-skeleton type="text" width="34%" /></div>
            <div class="sk-body">
              <div v-for="c in 2" :key="c" class="sk-col">
                <div v-for="n in 2" :key="n" class="sk-row">
                  <q-skeleton type="text" width="42%" />
                  <q-skeleton type="text" width="34%" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <q-separator style="background: var(--c-border)" />
      <div class="q-px-md q-pb-md">
        <!-- Tab strip -->
        <div class="row q-gutter-x-sm q-mb-md">
          <q-skeleton type="rect" width="120px" height="30px" style="border-radius: 8px;" />
          <q-skeleton type="rect" width="96px" height="30px" style="border-radius: 8px;" />
          <q-skeleton type="rect" width="84px" height="30px" style="border-radius: 8px;" />
          <q-skeleton type="rect" width="96px" height="30px" style="border-radius: 8px;" />
        </div>
        <!-- Boarding-history / Active-Listing card timeline -->
        <div class="dd-hc-list">
          <div v-for="n in 2" :key="n" class="dd-hc-row">
            <div class="dd-hc-rail">
              <q-skeleton type="circle" size="40px" />
            </div>
            <div class="dd-hc-card border-all rounded-borders" style="border-radius: var(--radius-sm);">
              <div class="row justify-between items-center">
                <q-skeleton type="text" width="55%" height="16px" />
                <q-skeleton type="rect" width="64px" height="20px" style="border-radius: 999px;" />
              </div>
              <div class="row justify-between items-end">
                <q-skeleton type="text" width="40%" height="12px" />
                <q-skeleton type="text" width="28%" height="12px" />
              </div>
            </div>
          </div>
        </div>
        <!-- Payment lease card skeleton -->
        <div class="dd-payments-skel border-all rounded-borders" style="border-radius: var(--radius-sm);">
          <div class="row justify-between items-center q-pa-sm border-bottom">
            <div class="row items-center q-gutter-x-sm">
              <q-skeleton type="circle" size="18px" />
              <q-skeleton type="text" width="45%" height="16px" />
              <q-skeleton type="rect" width="60px" height="20px" style="border-radius: 999px;" />
            </div>
            <q-skeleton type="text" width="55%" height="12px" />
          </div>
          <div class="q-pa-sm">
            <div v-for="n in 2" :key="n" class="row items-center justify-between q-py-sm">
              <div class="row items-center q-gutter-x-sm">
                <q-skeleton type="text" width="60px" height="14px" />
                <q-skeleton type="rect" width="56px" height="18px" style="border-radius: 999px;" />
              </div>
              <div class="row items-center q-gutter-x-sm">
                <q-skeleton type="text" width="50px" height="14px" />
                <q-skeleton type="text" width="60px" height="12px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  kind?: 'user' | 'accommodation' | 'room' | undefined
}>()
</script>

<style scoped>
.sk-card {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm, 10px);
  background: var(--c-surface);
  overflow: hidden;
}
.sk-group + .sk-group { border-top: 1px solid var(--c-border); }
.sk-head { padding: 10px 14px; border-bottom: 1px solid var(--c-border); }
.sk-body { display: grid; grid-template-columns: 1fr 1fr; }
.sk-col + .sk-col { border-left: 1px solid var(--c-border); }
.sk-row {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--c-border);
}
.sk-col:last-child .sk-row:last-child { border-bottom: 0; }
.border-bottom {
  border-bottom: 1px solid var(--c-border);
}
.border-right {
  border-right: 1px solid var(--c-border);
}
.border-all {
  border: 1px solid var(--c-border);
}
.dd-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--c-surface);
}

/* Boarding-history card timeline (skeleton shares the layout classes) */
.dd-hc-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dd-hc-row {
  display: flex;
  align-items: stretch;
}
.dd-hc-rail {
  position: relative;
  flex: 0 0 40px;
  width: 40px;
  margin-right: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.dd-hc-card {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dd-preview :deep(.q-skeleton) {
  background: linear-gradient(
    90deg,
    var(--c-surface-2) 25%,
    color-mix(in srgb, var(--c-border) 65%, var(--c-surface-2)) 37%,
    var(--c-surface-2) 63%
  );
  background-size: 400% 100%;
  animation: dd-shimmer 1.4s ease infinite;
}
@keyframes dd-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dd-preview :deep(.q-skeleton) {
    animation: none;
  }
}
</style>