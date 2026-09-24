<template>
  <div v-if="reviews.length" class="rv">
    <div class="rv-summary">
      <div class="rv-avg">
        <span class="rv-avg-num">{{ average.toFixed(1) }}</span>
        <div class="rv-stars">
          <Icon v-for="n in 5" :key="n" icon="lucide:star" width="13" height="13" :class="n <= Math.round(average) ? 'rv-on' : 'rv-off'" />
        </div>
        <span class="rv-count">{{ reviews.length }} rating{{ reviews.length === 1 ? '' : 's' }}</span>
      </div>
      <div class="rv-bars">
        <div v-for="b in bars" :key="b.stars" class="rv-bar">
          <span class="rv-bar-n">{{ b.stars }}</span>
          <div class="rv-track"><div class="rv-fill" :style="{ width: `${b.share}%` }"></div></div>
          <span class="rv-bar-c">{{ b.count }}</span>
        </div>
      </div>
    </div>

    <div v-for="(r, i) in reviews" :key="i" class="rv-card">
      <div class="rv-head">
        <span class="rv-av">{{ getInitialsWide(r.author) }}</span>
        <div class="rv-who">
          <div class="rv-name">{{ r.author }}</div>
          <div class="rv-sub">Former boarder<template v-if="r.room"> · {{ r.room }}</template></div>
        </div>
        <div class="rv-meta">
          <div class="rv-stars" :aria-label="`${r.rating} out of 5 stars`">
            <Icon v-for="n in 5" :key="n" icon="lucide:star" width="11" height="11" :class="n <= r.rating ? 'rv-on' : 'rv-off'" />
          </div>
          <span v-if="r.time" class="rv-date">{{ r.time }}</span>
        </div>
      </div>
      <p v-if="r.comment" class="rv-text">{{ r.comment }}</p>
    </div>
  </div>
  <TabEmptyState v-else icon="lucide:star" title="No ratings" message="No boarder has rated this accommodation yet." />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import TabEmptyState from '../TabEmptyState.vue'
import { getInitialsWide } from '@/utils/format'
import type { DrawerPreview } from '../preview'

const props = defineProps<{ preview: DrawerPreview }>()

const reviews = computed(() => props.preview.reviews ?? [])
const average = computed(() =>
  reviews.value.length ? reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length : 0,
)
const bars = computed(() =>
  [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.value.filter((r) => Math.round(r.rating) === stars).length
    return { stars, count, share: reviews.value.length ? (count / reviews.value.length) * 100 : 0 }
  }),
)
</script>

<style scoped>
.rv { display: flex; flex-direction: column; gap: 14px; }
.rv-summary {
  display: grid;
  grid-template-columns: 150px 1fr;
  align-items: center;
  gap: 20px;
  padding: 16px 18px;
  border: 1px solid var(--ar-border);
  border-radius: 10px;
}
.rv-avg { display: flex; flex-direction: column; gap: 6px; padding-right: 20px; border-right: 1px solid var(--ar-border); }
.rv-avg-num { color: var(--ar-ink); font-family: var(--font-display); font-size: 38px; font-weight: 700; line-height: 1; }
.rv-stars { display: flex; gap: 2px; }
.rv-on { color: #fb8c00; }
.rv-on :deep(path) { fill: currentColor; }
.rv-off { color: var(--ar-border); }
.rv-count { color: var(--ar-muted); font-size: 11.5px; }
.rv-bars { display: flex; flex-direction: column; gap: 6px; }
.rv-bar { display: flex; align-items: center; gap: 8px; color: var(--ar-text); font-size: 11px; }
.rv-bar-n { width: 8px; }
.rv-bar-c { width: 12px; text-align: right; }
.rv-track { flex: 1; height: 6px; overflow: hidden; border-radius: 3px; background: var(--ar-soft); }
.rv-fill { height: 100%; background: #fb8c00; }

.rv-card { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border: 1px solid var(--ar-border); border-radius: 10px; }
.rv-head { display: flex; align-items: center; gap: 10px; }
.rv-av {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ar-accent-soft);
  color: var(--ar-accent);
  font-size: 11px;
  font-weight: 700;
}
.rv-who { flex: 1; min-width: 0; }
.rv-name { color: var(--ar-ink); font-size: 13px; font-weight: 600; }
.rv-sub { margin-top: 1px; color: var(--ar-muted); font-size: 11px; }
.rv-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.rv-date { color: var(--ar-muted); font-size: 11px; }
.rv-text { margin: 0; color: var(--ar-text); font-size: 13px; line-height: 1.55; }
</style>
