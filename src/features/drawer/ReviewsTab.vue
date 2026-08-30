<template>
  <div v-if="preview.reviews?.length" class="dd-reviews">
    <div v-for="(r, i) in preview.reviews" :key="i" class="dd-review">
      <div class="row items-center justify-between q-mb-xs">
        <div class="text-weight-bold text-body2" style="color: var(--c-ink)">{{ r.author }}</div>
        <div class="dd-stars row items-center q-gutter-x-xs">
          <Icon
            v-for="n in 5"
            :key="n"
            :icon="n <= r.rating ? 'mdi:star' : 'mdi:star-outline'"
            width="14"
            height="14"
            :style="{ color: 'var(--c-warning)' }"
          />
        </div>
      </div>
      <div v-if="r.comment" class="text-body2" style="color: var(--c-text)">{{ r.comment }}</div>
      <div v-if="r.time" class="text-caption dd-muted q-mt-xs">{{ r.time }}</div>
    </div>
  </div>
  <div v-else class="dd-empty">No reviews yet for this account.</div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { DrawerPreview } from './preview'

defineProps<{ preview: DrawerPreview }>()
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
.dd-empty {
  font-size: 13px;
  color: var(--c-muted);
  padding: 10px 12px;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
}
</style>
