<template>
  <div v-if="photos.length" class="ps">
    <button
      v-for="(p, i) in shown"
      :key="i"
      type="button"
      class="ps-thumb"
      :aria-label="`View photo ${i + 1} of ${photos.length}, ${title}`"
      @click="$emit('open', i)"
    >
      <img :src="p" alt="" loading="lazy" />
      <span v-if="i === shown.length - 1 && more > 0" class="ps-more">+{{ more }}</span>
    </button>
  </div>
  <div v-else class="ps-none"><Icon icon="lucide:image-off" width="14" height="14" />No photos yet</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{ photos: string[]; title: string }>()
defineEmits<{ (e: 'open', index: number): void }>()

const shown = computed(() => props.photos.slice(0, 4))
// The "+N" covers the fourth thumbnail, so that photo counts as unseen too.
const more = computed(() => (props.photos.length > 4 ? props.photos.length - 3 : 0))
</script>

<style scoped>
.ps { display: flex; gap: 6px; margin-bottom: 4px; }
.ps-thumb {
  position: relative;
  flex-shrink: 0;
  width: 72px;
  height: 52px;
  padding: 0;
  overflow: hidden;
  border: none;
  border-radius: 8px;
  background: var(--ar-soft);
  cursor: pointer;
}
.ps-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ps-thumb:focus-visible { outline: 2px solid var(--ar-accent); outline-offset: 2px; }
.ps-more {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 20, 19, 0.55);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.ps-none { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 4px; color: var(--ar-muted); font-size: 12px; }
</style>
