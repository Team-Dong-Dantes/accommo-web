<template>
  <Teleport to="body" :disabled="anchored">
    <transition name="dd" :css="true" @after-leave="$emit('closed')">
      <div
        v-if="modelValue"
        :class="anchored ? ['dd-anchored-wrap', `dd-anchored-${position}`] : ['dd-backdrop', { 'dd-backdrop--static': !closeOnBackdrop, 'dd-backdrop--full': size === 'full' }]"
        @click="onBackdropClick"
      >
        <aside
          class="dd-panel"
          :class="[anchored ? 'dd-panel--anchored' : '', size === 'full' ? 'dd-panel--full' : '']"
          :style="panelStyle"
          role="dialog"
          :aria-modal="!anchored"
          @click.stop
        >
            <!-- An accommodation is its own two-panel record, drawn to the design
                 mock; it brings its own surfaces, so it sits on the backdrop bare. -->
            <AccommodationRecord
              v-if="preview?.kind === 'accommodation'"
              :preview="preview"
              :loading="loading"
              :management-actions="managementActions"
              @close="close"
              @manage="onManage"
            />
            <!-- People and rooms use the same two-panel record frame. -->
            <UserRecord
              v-else-if="preview?.kind === 'user' && preview.userOverview"
              :preview="preview"
              :loading="loading"
              :management-actions="managementActions"
              @close="close"
              @manage="onManage"
              @go-hub="goToHub"
            />
            <RoomRecord
              v-else-if="preview?.kind === 'room' && preview.roomOverview"
              :preview="preview"
              :loading="loading"
              @close="close"
              @go-hub="goToHub"
            />

            <!-- Data-driven reference layout (our system's data, on-brand) -->
            <q-card
              v-else-if="preview || loading"
              class="dd-surface text-body2 dd-preview"
              style="height: 100%; border-radius: var(--radius); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden; font-family: var(--font-body);"
            >
              <PreviewSkeleton v-if="loading" :kind="preview?.kind" />
               <PreviewBody
                 v-else-if="preview"
                 :preview="preview"
                 :loading="loading"
                 :management-actions="managementActions"
                 v-model:tab="ddTab"
                 @close="close"
                 @manage="onManage"
                 @go-hub="goToHub"
                 @go-room="goToRoom"
               />
            </q-card>

            <!-- Generic slot mode (backward compatible, on-brand) -->
            <q-card
              v-else
              class="dd-surface text-body2 dd-card-preview"
              style="height: 100%; border-radius: var(--radius); box-shadow: var(--shadow-lg); overflow-y: auto; font-family: var(--font-body);"
            >
              <div class="dd-header row items-center justify-between q-pa-md">
                <div class="row items-center q-gutter-x-sm">
                  <div v-if="title" class="dd-ink dd-display text-h6 text-weight-bold">{{ title }}</div>
                  <div v-if="countLabel" class="dd-muted text-caption">{{ countLabel }}</div>
                </div>
                <div class="row items-center q-gutter-x-sm">
                  <q-btn flat round dense color="primary" @click="close">
                    <Icon icon="lucide:x" width="20" height="20" />
                  </q-btn>
                </div>
              </div>

              <q-separator style="background: var(--c-border)" />

              <div v-if="$slots.banner" class="q-pa-md">
                <slot name="banner" />
              </div>

              <q-separator v-if="$slots.banner" style="background: var(--c-border)" />

              <div class="dd-body">
                <template v-if="loading">
                  <div v-for="n in 4" :key="n" class="dd-skel-row q-mb-lg">
                    <q-skeleton type="text" width="40%" class="dd-skel-label" />
                    <q-skeleton type="rect" height="14px" class="dd-skel-value" />
                  </div>
                </template>
                <slot v-else />
              </div>

              <footer v-if="$slots.footer" class="dd-footer">
                <slot name="footer" />
              </footer>
            </q-card>
          </aside>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PreviewSkeleton from '@/features/drawer/PreviewSkeleton.vue'
import PreviewBody from '@/features/drawer/PreviewBody.vue'
import AccommodationRecord from '@/features/drawer/accommodation/AccommodationRecord.vue'
import UserRecord from '@/features/drawer/user/UserRecord.vue'
import RoomRecord from '@/features/drawer/room/RoomRecord.vue'
import type {
  DrawerPreview,
  HubKind,
  PreviewRoom,
} from '@/features/drawer/preview'

// Backward-compat re-exports: RoomHub/AccommodationHub/Users import the preview
// types from this component's module.
export type {
  DrawerPreview,
  PreviewChip,
  PreviewStat,
  PreviewDetail,
  PreviewDetailGroup,
  PreviewCardCell,
  PreviewCard,
  PreviewActivity,
  PreviewReview,
  PreviewHistoryCard,
  PreviewFile,
  PreviewRoom,
  PreviewOccupant,
  PreviewPhoto,
  PreviewTimelineItem,
  PreviewPlacement,
  PreviewLease,
  PreviewPayment,
  HubKind,
} from '@/features/drawer/preview'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** Data-driven preview (our system's data) rendered in the reference layout. */
    preview?: DrawerPreview
    title?: string
    subtitle?: string
    countLabel?: string
    viewDetailsLabel?: string
    width?: string
    /**
     * `panel` is the original right-hand drawer. `full` is the two-pane record
     * view: a centered dialog wide enough to show the record's fields and its
     * tabbed content side by side (see PreviewBody.vue).
     */
    size?: 'panel' | 'full'
    loading?: boolean
    closeOnBackdrop?: boolean
    anchored?: boolean
    position?: 'left' | 'right'
    /** User-management actions shown in the 3-dots menu (e.g. Suspend, Ban). */
    managementActions?: { label: string; action: string; danger?: boolean }[]
  }>(),
  {
    width: '620px',
    size: 'panel',
    loading: false,
    closeOnBackdrop: true,
    anchored: false,
    position: 'right',
    managementActions: () => [],
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'view-details'): void
  (e: 'manage', action: string): void
  (e: 'closed'): void
}>()

const ddTab = ref<string>('history')

/**
 * The two-pane view needs room for a fixed-width detail column plus a tab panel
 * beside it; `min(1400px, 96vw)` is the point where both stay comfortable. The
 * height is capped rather than full-bleed so the dialog still reads as a layer
 * over the table it was opened from.
 */
const panelStyle = computed(() =>
  props.size === 'full'
    ? { width: 'min(1400px, 96vw)', height: 'min(88vh, 900px)', maxWidth: '96vw' }
    : { width: props.width, maxWidth: '94vw' },
)

function close() {
  emit('update:modelValue', false)
}
const router = useRouter()
function goToHub(kind: HubKind, accommodationId?: string) {
  if (!accommodationId) return
  if (kind === 'map') router.push({ path: '/map-view', query: { accommodation: accommodationId } })
  else if (kind === 'accommodation') router.push({ path: '/accommodation-hub', query: { accommodation: accommodationId } })
  else router.push({ path: '/room-hub', query: { accommodation: accommodationId } })
  close()
}
function onManage(action: string) {
  emit('manage', action)
}
function goToRoom(room: PreviewRoom) {
  const query: Record<string, string> = {}
  if (room.id) query.room = room.id
  if (room.accommodationId) query.accommodation = room.accommodationId
  router.push({ path: '/room-hub', query })
  close()
}
function onBackdropClick() {
  if (props.anchored || modalIsOpen()) return
  if (props.closeOnBackdrop) close()
}
/**
 * A QDialog opened from inside the drawer — the document viewer — teleports to
 * <body>, so every click in it lands outside `.dd-panel` and used to close the
 * drawer, which unmounted the dialog with it. While one is open it owns both the
 * outside click and Escape.
 */
function modalIsOpen(): boolean {
  return document.querySelector('.q-dialog') !== null
}

function onKeydown(e: KeyboardEvent) {
  if (modalIsOpen()) return
  if (e.key === 'Escape' && props.modelValue) close()
}
// When an anchored drawer is opened by an outside click (e.g. a table row),
// that same click bubbles to document and would instantly trigger onDocClick's
// "close on outside click" — making the drawer appear to do nothing. Suppress
// the close for the remainder of the opening click.
const suppressClose = ref(false)
watch(
  () => props.modelValue,
  (val, old) => {
    if (val && !old) {
      suppressClose.value = true
      setTimeout(() => {
        suppressClose.value = false
      }, 0)
    }
  },
  { flush: 'sync' },
)
function onDocClick(e: MouseEvent) {
  if (!props.anchored || !props.modelValue || !props.closeOnBackdrop) return
  if (suppressClose.value || modalIsOpen()) return
  const target = e.target as HTMLElement | null
  if (target?.closest('.dd-panel') || target?.closest('.q-menu') || target?.closest('.q-dialog')) return
  close()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped>
.dd-ink {
  color: var(--c-ink);
}
.dd-muted {
  color: var(--c-muted);
}
.dd-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--c-surface);
}
.dd-display {
  font-family: var(--font-display);
}
.dd-surface {
  background: var(--c-surface);
  color: var(--c-text);
  border: 1px solid var(--c-border);
}
/* The record drawer runs its cover photo to its own edges, so a border would
   read as a strip of surface down the left of the picture. The shadow already
   separates it from the backdrop. */
.dd-preview {
  border: none;
}

/* Skeleton + entrance animations ------------------------------------- */
.dd-preview :deep(.q-skeleton) {
  background: linear-gradient(
    90deg,
    var(--c-surface-2) 25%,
    color-mix(in srgb, var(--c-border) 65%, var(--c-surface-2)) 37%,
    var(--c-surface-2) 63%
  );
  background-size: 400% 100%;
  animation: dd-shimmer 1.4s ease infinite;
}
@keyframes dd-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dd-preview :deep(.q-skeleton) {
    animation: none;
  }
}

/* Shell ---------------------------------------------------------------- */
.dd-backdrop {
  position: fixed;
  inset: 0;
  z-index: 6000;
  background: rgba(16, 32, 28, 0.42);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-end;
  padding: var(--sp-4);
  box-sizing: border-box;
}
.dd-backdrop--static {
  background: transparent;
  backdrop-filter: none;
  pointer-events: none;
}
/* The two-pane record view is centered rather than flush to the right edge —
   it is a dialog about one record, not a side panel on the table. */
.dd-backdrop--full {
  justify-content: center;
  align-items: center;
}
.dd-panel {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}
.dd-card-preview {
  display: flex;
  flex-direction: column;
}
.dd-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--sp-4);
}
.dd-footer {
  flex: 0 0 auto;
  padding: var(--sp-4);
  border-top: 1px solid var(--c-border);
  background: var(--c-surface-2);
}
.dd-skel-label {
  margin-bottom: 8px;
}
.dd-skel-value {
  border-radius: var(--radius-sm);
}
.dd-anchored-wrap {
  position: fixed;
  top: var(--sp-4);
  bottom: var(--sp-4);
  width: 620px;
  display: flex;
  pointer-events: none;
  z-index: 6000;
}
.dd-anchored-left {
  left: var(--sp-4);
}
.dd-anchored-right {
  right: var(--sp-4);
}
.dd-panel--anchored {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  width: 100% !important;
  max-width: none !important;
  height: 100%;
}
.dd-panel--anchored .dd-card-preview,
.dd-panel--anchored .dd-preview {
  height: 100%;
  border-radius: var(--radius);
}
.dd-enter-active,
.dd-leave-active {
  transition: opacity 0.42s ease;
}
.dd-enter-active .dd-panel,
.dd-leave-active .dd-panel {
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}
.dd-enter-from,
.dd-leave-to {
  opacity: 0;
}
.dd-enter-from .dd-panel,
.dd-leave-to .dd-panel {
  transform: translateX(100%);
}
/* A centered dialog sliding in from the right edge reads as the wrong gesture —
   nothing about the record lives over there. It scales up in place instead. */
.dd-enter-from .dd-panel--full,
.dd-leave-to .dd-panel--full {
  transform: scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .dd-enter-active .dd-panel,
  .dd-leave-active .dd-panel {
    transition: none;
  }
}
</style>
