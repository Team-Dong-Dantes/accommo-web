<template>
  <div class="rv-doc">
    <div class="file-tabs" v-if="files.length > 1">
      <button
        v-for="(f, i) in files"
        :key="i"
        type="button"
        class="file-tab"
        :class="{ 'file-tab--active': i === index }"
        @click="$emit('update:index', i)"
      >
        <Icon :icon="fileIcon(f.name)" width="14" height="14" />
        <span class="ellipsis">{{ f.name }}</span>
      </button>
    </div>

    <div class="doc-view">
      <div class="zoom-bar" v-if="files.length && isImage(currentUrl)">
        <q-btn flat dense color="grey-7" size="sm" @click="zoom = Math.max(0.4, zoom - 0.2)"><Icon icon="mdi:magnify-minus" width="18" height="18" /></q-btn>
        <span class="text-caption text-muted" style="min-width: 42px; text-align: center">{{ Math.round(zoom * 100) }}%</span>
        <q-btn flat dense color="grey-7" size="sm" @click="zoom = Math.min(3, zoom + 0.2)"><Icon icon="mdi:magnify-plus" width="18" height="18" /></q-btn>
        <q-separator vertical class="q-mx-xs" />
        <q-btn flat dense color="grey-7" size="sm" @click="rotation = (rotation - 90 + 360) % 360"><Icon icon="mdi:rotate-left" width="18" height="18" /></q-btn>
        <q-btn flat dense color="grey-7" size="sm" @click="rotation = (rotation + 90) % 360"><Icon icon="mdi:rotate-right" width="18" height="18" /></q-btn>
        <q-separator vertical class="q-mx-xs" />
        <q-btn flat dense color="grey-7" size="sm" :href="currentUrl" download><Icon icon="mdi:download" width="18" height="18" /></q-btn>
        <q-btn flat dense color="grey-7" size="sm" :href="currentUrl" target="_blank" rel="noopener"><Icon icon="mdi:open-in-new" width="18" height="18" /></q-btn>
      </div>

      <div class="doc-canvas">
        <template v-if="files.length">
          <div v-if="isImage(currentUrl)" class="doc-scroll">
            <img
              :src="currentUrl"
              :style="{ transform: `scale(${zoom}) rotate(${rotation}deg)` }"
              class="doc-img"
              alt="Document preview"
              @load="imgLoading = false; imgError = false"
              @error="imgLoading = false; imgError = true"
            />
          </div>
          <iframe v-else :src="currentUrl" class="doc-iframe" title="Document preview"></iframe>

          <div v-if="isImage(currentUrl) && imgLoading" class="doc-loading column flex-center">
            <q-spinner-dots color="primary" size="42px" />
          </div>
          <div v-if="isImage(currentUrl) && imgError" class="doc-fallback column flex-center text-center q-pa-lg">
            <Icon icon="mdi:image-off-outline" width="48" height="48" color="var(--c-border-strong)" />
            <div class="text-muted q-mt-sm">Preview unavailable — use “Open in new tab” to view the file.</div>
          </div>
        </template>

        <div v-else class="column flex-center text-center q-pa-xl doc-empty">
          <Icon icon="mdi:file-document-remove-outline" width="56" height="56" color="var(--c-border-strong)" />
          <div class="text-ink text-weight-bold q-mt-sm">No documents to preview</div>
          <div class="text-muted text-caption q-mt-xs">{{ emptyCaption }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { isImage, fileIcon } from './fileUtils'

export interface ViewerFile {
  name: string
  url: string
}

const props = withDefaults(
  defineProps<{
    files: ViewerFile[]
    /** Active file index (v-model:index) — shared with the parent's doc list. */
    index: number
    /** Changes when the reviewed request changes — resets zoom/rotation/error. */
    requestKey?: string | null
    /** Caption under "No documents to preview". */
    emptyCaption?: string
  }>(),
  {
    requestKey: null,
    emptyCaption: '',
  },
)

defineEmits<{ (e: 'update:index', value: number): void }>()

const zoom = ref(1)
const rotation = ref(0)
const imgError = ref(false)
const imgLoading = ref(false)

const currentUrl = computed(() => props.files[props.index]?.url ?? '')

// Reset viewer state when the reviewed request changes (was the parent's
// request-id watcher) and whenever the visible file changes (was the
// parent's currentUrl watcher).
watch(
  () => props.requestKey,
  () => {
    zoom.value = 1
    rotation.value = 0
    imgError.value = false
    imgLoading.value = isImage(currentUrl.value)
  },
  { immediate: true },
)
watch(currentUrl, (u) => {
  imgLoading.value = isImage(u)
})
</script>

<style scoped>
/* Document viewer */
.rv-doc { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.file-tabs {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  overflow-x: auto;
  flex: 0 0 auto;
}
.file-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 200px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-text);
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.file-tab:hover { border-color: var(--c-primary); }
.file-tab--active {
  border-color: var(--c-primary);
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  color: var(--c-primary);
}
.doc-view {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}
.zoom-bar {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c-surface) 88%, transparent);
  border: 1px solid var(--c-border);
  backdrop-filter: blur(4px);
}
.doc-canvas {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  background:
    repeating-conic-gradient(var(--c-surface-2) 0% 25%, var(--c-bg) 0% 50%)
     50% / 22px 22px;
  overflow: hidden;
  display: flex;
}
.doc-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.doc-img {
  transform-origin: center center;
  transition: transform 0.15s ease;
  max-width: none;
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
.doc-iframe {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}
.doc-empty { position: absolute; inset: 0; }
.doc-fallback,
.doc-loading { position: absolute; }
.doc-loading {
  inset: 0;
  background: color-mix(in srgb, var(--c-surface) 65%, transparent);
}
.doc-fallback { inset: 0; }

.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
