<template>
  <!-- A landlord/landlady's accommodations, in the accommodation record's
       row-list look; each row opens that accommodation's record. -->
  <div v-if="items.length" class="rl">
    <div class="rl-list">
      <button v-for="a in items" :key="a.id" type="button" class="rl-row" @click="$emit('go-hub', 'accommodation', a.id)">
        <span class="rl-thumb"><Icon icon="lucide:building-2" width="17" height="17" /></span>
        <span class="rl-main">
          <span class="rl-name">{{ a.name }}</span>
          <span class="rl-sub">{{ a.address }}</span>
        </span>
        <span class="rl-col pp-occ">
          <span class="pp-track"><span class="pp-fill" :style="{ width: a.beds ? `${(a.taken / a.beds) * 100}%` : '0%' }"></span></span>
          <span class="rl-count">{{ a.taken }}/{{ a.beds }}</span>
        </span>
        <span class="rl-status">
          <span class="rl-pill" :class="a.status === 'accredited' ? 'rl-pill--ok' : 'rl-pill--warn'">{{ humanizeEnum(a.status) || '—' }}</span>
        </span>
        <span class="pp-rating">
          <template v-if="a.rating != null"><Icon icon="lucide:star" width="12" height="12" class="pp-star" />{{ a.rating.toFixed(1) }}</template>
          <template v-else>—</template>
        </span>
      </button>
    </div>
  </div>
  <TabEmptyState v-else icon="lucide:building-2" title="No accommodations" message="This landlord/landlady has not listed an accommodation yet." />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { humanizeEnum } from '@/utils/format'
import TabEmptyState from '../TabEmptyState.vue'
import type { DrawerPreview, HubKind } from '../preview'

const props = defineProps<{ preview: DrawerPreview }>()
defineEmits<{ (e: 'go-hub', kind: HubKind, id?: string): void }>()

const items = computed(() => props.preview.userOverview?.portfolio ?? [])
</script>

<style scoped src="../accommodation/rowList.css"></style>
<style scoped>
/* rowList.css leaves layout to Quasar's expansion header; a plain button row
   needs it spelled out. */
.rl-row {
  display: flex;
  width: 100%;
  border: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.rl-row:hover { background: color-mix(in srgb, var(--ar-soft) 60%, var(--ar-surface)); }
.rl-row:focus-visible { outline: 2px solid var(--ar-accent); outline-offset: -2px; }
.pp-occ { gap: 8px; }
.pp-track { flex: 1; height: 6px; border-radius: 3px; background: var(--ar-soft); box-shadow: inset 0 0 0 1px var(--ar-border); }
.pp-fill { display: block; height: 100%; border-radius: 3px; background: var(--ar-accent); }
.pp-rating { display: inline-flex; flex-shrink: 0; align-items: center; gap: 3px; width: 40px; color: var(--ar-text); font-size: 12px; }
.pp-star { color: #fb8c00; }
.pp-star :deep(path) { fill: currentColor; }
</style>
