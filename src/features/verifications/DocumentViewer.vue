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
      <div class="zoom-bar" v-if="files.length">
        <template v-if="currentIsImage">
          <q-btn flat dense color="grey-7" size="sm" @click="zoom = Math.max(ZOOM_MIN, zoom - 0.2)"><Icon icon="lucide:zoom-out" width="18" height="18" /></q-btn>
          <span class="text-caption text-muted" style="min-width: 42px; text-align: center">{{ Math.round(zoom * 100) }}%</span>
          <q-btn flat dense color="grey-7" size="sm" @click="zoom = Math.min(ZOOM_MAX, zoom + 0.2)"><Icon icon="lucide:zoom-in" width="18" height="18" /></q-btn>
          <q-separator vertical class="q-mx-xs" />
          <q-btn flat dense color="grey-7" size="sm" @click="rotation = (rotation - 90 + 360) % 360"><Icon icon="lucide:rotate-ccw" width="18" height="18" /></q-btn>
          <q-btn flat dense color="grey-7" size="sm" @click="rotation = (rotation + 90) % 360"><Icon icon="lucide:rotate-cw" width="18" height="18" /></q-btn>
          <q-separator vertical class="q-mx-xs" />
        </template>
        <span v-else class="text-caption text-muted q-mr-sm ellipsis">{{ currentName }}</span>
        <q-btn flat dense color="grey-7" size="sm" :href="currentUrl" download><Icon icon="lucide:download" width="18" height="18" /></q-btn>
        <q-btn flat dense color="grey-7" size="sm" :href="currentUrl" target="_blank" rel="noopener"><Icon icon="lucide:external-link" width="18" height="18" /></q-btn>
      </div>

      <div class="doc-canvas">
        <template v-if="files.length">
          <div
            v-if="currentIsImage && currentUrl"
            class="doc-scroll"
            :class="{ 'is-panning': panning }"
            @wheel.prevent="onWheel"
            @pointerdown="startPan"
            @pointermove="movePan"
            @pointerup="endPan"
            @pointercancel="endPan"
            @pointerleave="endPan"
          >
            <img
              :src="currentUrl"
              :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${rotation}deg)` }"
              draggable="false"
              class="doc-img"
              alt="Document preview"
              @load="imgLoading = false; imgError = false"
              @error="imgLoading = false; imgError = true"
            />
          </div>
          <!-- Non-image documents used to render in an <iframe>. That was
               blocked outright: the page's CSP declares no frame-src, so it
               falls back to default-src 'self' and a cross-origin frame is
               refused ("This content is blocked"). Even allowed, the signed URL
               is Cloudinary's /download endpoint, which serves the file as an
               attachment — the frame would have downloaded, not previewed. An
               explicit affordance is both honest and doesn't widen the CSP. -->
          <!-- Fetched as a blob above, so the browser previews it in place —
               PDFs in its own PDF viewer, anything else it can render natively.
               The panel below is only for what it cannot. -->
          <iframe
            v-else-if="blobUrl"
            :src="blobUrl"
            class="doc-frame"
            :title="currentName || 'Document preview'"
          ></iframe>

          <div v-else-if="blobLoading" class="doc-loading column flex-center">
            <q-spinner-dots color="primary" size="42px" />
          </div>

          <div v-else class="doc-external column flex-center text-center q-pa-lg">
            <Icon :icon="fileIcon(currentName)" width="52" height="52" color="var(--c-border-strong)" />
            <div class="text-ink text-weight-bold q-mt-sm">{{ currentName || 'Document' }}</div>
            <div class="text-muted text-caption q-mt-xs" style="max-width: 34ch">
              {{ externalMessage }}
            </div>
            <q-btn
              v-if="currentUrl"
              unelevated color="primary" no-caps class="q-mt-md text-weight-bold"
              :href="currentUrl" target="_blank" rel="noopener"
            >
              <Icon icon="lucide:external-link" width="17" height="17" class="q-mr-sm" />
              Open document
            </q-btn>
          </div>

          <div v-if="currentIsImage && imgLoading" class="doc-loading column flex-center">
            <q-spinner-dots color="primary" size="42px" />
          </div>
          <div v-if="currentIsImage && imgError" class="doc-fallback column flex-center text-center q-pa-lg">
            <Icon icon="lucide:image-off" width="48" height="48" color="var(--c-border-strong)" />
            <div class="text-muted q-mt-sm">Preview unavailable — use “Open in new tab” to view the file.</div>
          </div>
        </template>

        <div v-else class="column flex-center text-center q-pa-xl doc-empty">
          <Icon icon="lucide:file-x" width="56" height="56" color="var(--c-border-strong)" />
          <div class="text-ink text-weight-bold q-mt-sm">No documents to preview</div>
          <div class="text-muted text-caption q-mt-xs">{{ emptyCaption }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
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

const ZOOM_MIN = 0.4
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1

const zoom = ref(1)
const rotation = ref(0)

/**
 * Scrolling over the image zooms it. `.prevent` matters twice: it stops the
 * page behind the viewer from scrolling, and it makes Vue register the listener
 * non-passively, without which preventDefault is ignored.
 */
function onWheel(e: WheelEvent) {
  const next = zoom.value - Math.sign(e.deltaY) * ZOOM_STEP
  zoom.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 100) / 100))
}

/**
 * Drag to pan. `transform: scale()` leaves the layout box alone, so the
 * container has nothing to scroll however far the image is zoomed — the pan has
 * to be part of the same transform.
 */
const panX = ref(0)
const panY = ref(0)
const panning = ref(false)
let panFrom = { x: 0, y: 0, originX: 0, originY: 0 }

function resetPan() {
  panX.value = 0
  panY.value = 0
}

function startPan(e: PointerEvent) {
  panning.value = true
  panFrom = { x: e.clientX, y: e.clientY, originX: panX.value, originY: panY.value }
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}

function movePan(e: PointerEvent) {
  if (!panning.value) return
  panX.value = panFrom.originX + (e.clientX - panFrom.x)
  panY.value = panFrom.originY + (e.clientY - panFrom.y)
}

function endPan(e: PointerEvent) {
  if (!panning.value) return
  panning.value = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
}
const imgError = ref(false)
const imgLoading = ref(false)

/**
 * Non-image documents are fetched and re-served as a blob URL.
 *
 * Two things blocked them before. The signed URL is Cloudinary's /download
 * endpoint, which sends `Content-Disposition: attachment` — a frame pointed at
 * it downloads instead of previewing. And the page's CSP had no `frame-src`, so
 * a cross-origin frame was refused outright. Fetching the bytes ourselves solves
 * both: we choose the type, and `frame-src 'self' blob:` is a far narrower hole
 * than allowing a third-party origin to be framed.
 */
const blobUrl = ref('')
const blobLoading = ref(false)
const blobFailed = ref(false)

function releaseBlob() {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
  blobUrl.value = ''
}

async function loadBlob(url: string) {
  releaseBlob()
  blobFailed.value = false
  if (!url) {
    blobFailed.value = true
    return
  }
  blobLoading.value = true
  try {
    const res = await fetch(url, { credentials: 'omit' })
    if (!res.ok) throw new Error(String(res.status))
    blobUrl.value = URL.createObjectURL(await res.blob())
  } catch {
    // Cross-origin fetch refused, link expired, or the network failed — the
    // explicit "Open document" panel is the fallback.
    blobFailed.value = true
  } finally {
    blobLoading.value = false
  }
}

onBeforeUnmount(releaseBlob)

/** Kept out of the template: the copy carries an apostrophe. */
const externalMessage = computed(() => {
  // No signed link came back for this row, so there is nothing to open either.
  if (!currentUrl.value) {
    return 'No link could be issued for this file. It may have been removed, or the document service refused the request.'
  }
  return blobFailed.value
    ? 'This document could not be loaded for preview. Open it to review it — the link stays valid for a few minutes.'
    : 'This file type cannot be previewed here. Open it to review it — the link stays valid for a few minutes.'
})

const currentUrl = computed(() => props.files[props.index]?.url ?? '')
const currentName = computed(() => props.files[props.index]?.name ?? '')
/** Signed document URLs carry no extension, so the name is needed to classify. */
const currentIsImage = computed(() => isImage(currentUrl.value, currentName.value))

// Reset viewer state when the reviewed request changes (was the parent's
// request-id watcher) and whenever the visible file changes (was the
// parent's currentUrl watcher).
watch(
  () => props.requestKey,
  () => {
    zoom.value = 1
    rotation.value = 0
    resetPan()
    imgError.value = false
    imgLoading.value = currentIsImage.value && !!currentUrl.value
  },
  { immediate: true },
)
watch(
  currentUrl,
  (url) => {
    imgError.value = false
    resetPan()
    imgLoading.value = currentIsImage.value && !!url
    if (currentIsImage.value) {
      releaseBlob()
      blobFailed.value = false
    } else {
      void loadBlob(url)
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.doc-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: var(--c-surface);
}

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
  padding: 12px;
}
.doc-scroll { cursor: grab; }
.doc-scroll.is-panning { cursor: grabbing; }
.doc-scroll.is-panning .doc-img { transition: none; }
.doc-img {
  transform-origin: center center;
  transition: transform 0.15s ease;
  user-select: none;
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
.doc-external {
  flex: 1 1 auto;
  width: 100%;
  background: var(--c-surface);
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
