<template>
  <div v-if="preview.photos?.length" class="dd-photos">
    <button
      v-for="(p, i) in preview.photos"
      :key="i"
      type="button"
      class="dd-photo"
      :aria-label="`View room photo ${i + 1}`"
      @click="openAt = i"
    >
      <img :src="p.url" :alt="`Room photo ${i + 1}`" loading="lazy" />
    </button>
    <!-- A QDialog rather than a bare overlay: the drawer already treats clicks
         inside one as its own, so the viewer does not close the drawer. -->
    <q-dialog :model-value="openAt !== null" maximized @update:model-value="openAt = null">
      <PhotoLightbox
        v-if="openAt !== null"
        v-model:index="openAt"
        title="Room photos"
        :photos="preview.photos.map((p) => p.url)"
        style="border-radius: 0"
        @close="openAt = null"
      />
    </q-dialog>
  </div>
  <TabEmptyState v-else icon="lucide:image" title="No photos" message="No photos have been uploaded for this room yet." />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TabEmptyState from './TabEmptyState.vue'
import PhotoLightbox from './accommodation/PhotoLightbox.vue'
import type { DrawerPreview } from './preview'

defineProps<{ preview: DrawerPreview }>()

/** Index of the photo open in the viewer; null while it is closed. */
const openAt = ref<number | null>(null)
</script>

<style scoped>
.dd-photos {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.dd-photo {
  display: block;
  width: 100%;
  padding: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  aspect-ratio: 4 / 3;
  cursor: zoom-in;
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
