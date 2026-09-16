<template>
  <div v-if="preview.photos?.length" class="dd-photos">
    <a
      v-for="(p, i) in preview.photos"
      :key="i"
      :href="p.url"
      target="_blank"
      rel="noopener"
      class="dd-photo"
    >
      <img :src="p.url" :alt="`Room photo ${i + 1}`" loading="lazy" />
    </a>
  </div>
  <TabEmptyState v-else icon="lucide:image" title="No photos" message="No photos have been uploaded for this room yet." />
</template>

<script setup lang="ts">
import TabEmptyState from './TabEmptyState.vue'
import type { DrawerPreview } from './preview'

defineProps<{ preview: DrawerPreview }>()
</script>

<style scoped>
.dd-photos {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.dd-photo {
  display: block;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  aspect-ratio: 4 / 3;
  transition: border-color 0.15s ease;
}
.dd-photo:hover {
  border-color: var(--c-primary);
}
.dd-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
