<template>
  <div v-if="preview.reviews?.length" class="dd-reviews">
    <div v-if="isAccommodation" class="dd-rv-summary">
      <div class="dd-rv-avg">
        <span class="dd-rv-avg-num">{{ average.toFixed(1) }}</span>
        <div class="dd-stars row items-center">
          <Icon v-for="n in 5" :key="n" icon="lucide:star" width="13" height="13" :class="n <= Math.round(average) ? 'dd-star--on' : 'dd-star--off'" />
        </div>
        <span class="dd-muted text-caption">{{ count }} rating{{ count === 1 ? '' : 's' }}</span>
      </div>
      <div class="dd-rv-bars">
        <div v-for="b in bars" :key="b.stars" class="dd-rv-bar">
          <span class="dd-rv-bar-n">{{ b.stars }}</span>
          <div class="dd-rv-track"><div class="dd-rv-fill" :style="{ width: `${b.share}%` }"></div></div>
          <span class="dd-rv-bar-c">{{ b.count }}</span>
        </div>
      </div>
    </div>

    <div v-for="(r, i) in preview.reviews" :key="i" class="dd-review">
      <div class="row items-center justify-between q-mb-xs">
        <div class="text-weight-bold text-body2" style="color: var(--c-ink)">{{ r.author }}</div>
        <div class="dd-stars row items-center q-gutter-x-xs" :aria-label="`${r.rating} out of 5 stars`">
          <Icon v-for="n in 5" :key="n" icon="lucide:star" width="14" height="14" :class="n <= r.rating ? 'dd-star--on' : 'dd-star--off'" />
        </div>
      </div>
      <div v-if="r.comment" class="text-body2" style="color: var(--c-text)">{{ r.comment }}</div>
      <div v-if="r.time" class="text-caption dd-muted q-mt-xs">{{ r.time }}</div>
    </div>
  </div>
  <TabEmptyState
    v-else
    icon="lucide:star"
    title="No ratings"
    :message="isAccommodation ? 'No boarder has rated this accommodation yet.' : 'Nobody has rated this account yet.'"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TabEmptyState from './TabEmptyState.vue'
import { Icon } from '@iconify/vue'
import type { DrawerPreview } from './preview'

const props = defineProps<{ preview: DrawerPreview }>()

const isAccommodation = computed(() => props.preview.kind === 'accommodation')
const count = computed(() => props.preview.reviews?.length ?? 0)
const average = computed(() =>
  count.value ? (props.preview.reviews ?? []).reduce((s, r) => s + r.rating, 0) / count.value : 0,
)
const bars = computed(() =>
  [5, 4, 3, 2, 1].map((stars) => {
    const n = (props.preview.reviews ?? []).filter((r) => Math.round(r.rating) === stars).length
    return { stars, count: n, share: count.value ? (n / count.value) * 100 : 0 }
  }),
)
</script>

<style scoped>
.dd-muted {
  color: var(--c-muted);
}
.dd-reviews {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dd-review {
  padding: 12px 14px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface);
}
.dd-stars {
  line-height: 1;
}
.dd-star--on { color: var(--c-warning); }
.dd-star--off { color: var(--c-border-strong, var(--c-border)); }

.dd-rv-summary {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 20px;
  padding: 16px 18px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
}
.dd-rv-avg {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 20px;
  border-right: 1px solid var(--c-border);
}
.dd-rv-avg-num {
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}
.dd-rv-bars { display: flex; flex-direction: column; gap: 6px; }
.dd-rv-bar { display: flex; align-items: center; gap: 8px; color: var(--c-text); font-size: 11px; }
.dd-rv-bar-n { width: 8px; }
.dd-rv-bar-c { width: 14px; text-align: right; font-variant-numeric: tabular-nums; }
.dd-rv-track { flex: 1; height: 6px; overflow: hidden; border-radius: 3px; background: var(--c-surface-2); }
.dd-rv-fill { height: 100%; background: var(--c-warning); }
</style>
