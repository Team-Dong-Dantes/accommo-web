<template>
  <!-- Sized to exactly the space under the header: the dashboard is one screen
       and never scrolls. -->
  <q-page class="dash" :style-fn="fitViewport">
    <q-linear-progress v-if="loading" indeterminate color="primary" size="3px" class="dash-load" />

    <div v-if="error" class="dash-error" role="alert">
      <Icon icon="lucide:circle-alert" width="14" height="14" aria-hidden="true" />
      Some figures may be out of date. {{ error }}
      <button type="button" class="dash-retry" @click="load">Try again</button>
    </div>

    <DashboardSkeleton v-if="!hasLoaded" />
    <!-- Keyed on the theme: the charts read their colours from the tokens when
         they build, so a theme switch has to rebuild them. -->
    <DashboardBoard
      v-else
      :key="$q.dark.isActive ? 'dark' : 'light'"
      :data="data"
      :class="{ 'is-refreshing': loading }"
      :aria-busy="loading"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useDashboardStats } from '@/composables/useDashboardStats'
import DashboardSkeleton from '@/features/dashboard/DashboardSkeleton.vue'
import DashboardBoard from '@/features/dashboard/DashboardBoard.vue'

const { loading, error, data, hasLoaded, load } = useDashboardStats()
onMounted(load)

// QPage's default is a min-height; the dashboard wants a fixed one.
const fitViewport = (offset: number, height: number) => ({ height: `${height - offset}px` })
</script>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-2) clamp(14px, 1.6vw, 22px) clamp(12px, 1.4vw, 18px);
  overflow: hidden;
  background: var(--c-bg);
}
.dash > :not(.dash-load):not(.dash-error) { flex: 1; min-height: 0; }
.dash-load { position: absolute; top: 0; left: 0; right: 0; }

.dash-error {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--c-danger);
  border-radius: var(--radius-sm);
  background: var(--c-danger-soft);
  color: var(--c-danger);
  font-size: var(--fs-xs);
}
.dash-retry {
  margin-left: auto;
  border: 0;
  background: none;
  color: var(--c-danger);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
}
.is-refreshing { opacity: 0.72; transition: opacity 0.2s ease; }
@media (prefers-reduced-motion: reduce) {
  .is-refreshing { transition: none; }
}
</style>
