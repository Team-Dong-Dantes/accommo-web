<template>
  <div :key="preview.name" :class="['dd-content', { 'dd-room-hero': roomHero }]">

    <!-- FULL PAYMENTS MODE: same reference layout as the user preview, with a
         back button before the title to return to boarding history. -->
    <template v-if="fullPaymentsMode">
      <div class="dd-header row items-center justify-between q-pa-md dd-rise" style="--i: 0">
        <div class="row items-center q-gutter-x-sm">
          <button type="button" class="dd-back-btn" @click="onViewHistory" aria-label="Back to boarding history">
            <Icon icon="lucide:arrow-left" width="20" height="20" />
          </button>
          <div class="dd-ink dd-display text-h6 text-weight-bold">Payment History</div>
        </div>
      </div>

      <q-separator style="background: var(--c-border)" />

      <div class="q-pa-md dd-rise" style="--i: 1">
        <PaymentsTab
          :preview="preview"
          :filter-accommodation-id="paymentsFilter"
        />
      </div>
    </template>

    <!-- NORMAL MODE: original drawer with tabs, chips, stats, etc. -->
    <template v-else>
      <div class="dd-header row items-center justify-between q-pa-md dd-rise" style="--i: 0">
        <div class="row items-center q-gutter-x-sm">
          <div v-if="!roomHero" class="dd-ink dd-display text-h6 text-weight-bold">{{ preview.title || 'Preview' }}</div>
          <div v-if="preview.positionLabel" class="dd-muted text-caption">{{ preview.positionLabel }}</div>
        </div>
        <div class="row items-center q-gutter-x-sm">
          <q-btn flat round dense color="primary">
            <Icon icon="lucide:ellipsis-vertical" width="20" height="20" />
            <q-menu>
              <q-list style="min-width: 190px">
                <q-item
                  v-for="(a, i) in managementActions"
                  :key="i"
                  clickable
                  v-close-popup
                  @click="$emit('manage', a.action)"
                >
                  <q-item-section :class="a.danger ? 'text-negative' : ''">{{ a.label }}</q-item-section>
                </q-item>
                <q-separator v-if="managementActions.length" />
                <q-item clickable v-close-popup @click="$emit('close')">
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <q-separator v-if="!roomHero" style="background: var(--c-border)" />

      <!-- Rooms lead with their cover photo, ported from accommo-mobile's
           AccommodationDetail hero: name + status overlaid at the top of the
           photo, the tab strip pulled up over the photo's bottom edge. -->
      <div v-if="roomHero" class="dd-hero dd-rise" style="--i: 1">
        <img v-if="coverUrl" :src="coverUrl" alt="" class="dd-hero-img" />
        <div v-else class="dd-hero-empty column flex-center dd-muted">
          <Icon icon="lucide:image-off" width="28" height="28" />
          <div class="text-caption q-mt-xs">No photo</div>
        </div>
        <div class="dd-hero-scrim" />
        <div class="dd-hero-head row items-center q-gutter-x-sm">
          <div class="dd-hero-name dd-display">{{ preview.name }}</div>
          <BadgePill
            v-for="c in preview.chips"
            :key="c.text"
            :tone="c.tone || 'neutral'"
            :icon="c.icon ?? ''"
            :label="c.text"
          />
        </div>
      </div>

      <div v-if="!roomHero" class="q-pa-md dd-rise" style="--i: 1">
        <div class="row items-center q-gutter-x-md">
          <q-avatar size="72px">
            <img :src="preview.avatar" :alt="preview.name" />
          </q-avatar>
          <div class="col">
            <div class="dd-ink dd-display text-h5 text-weight-bold">{{ preview.name }}</div>
            <div class="row items-center q-gutter-x-sm q-mt-xs">
              <BadgePill
                v-for="c in preview.chips"
                :key="c.text"
                :tone="c.tone || 'neutral'"
                :icon="c.icon ?? ''"
                :label="c.text"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="!roomHero && preview.stats?.length" class="q-px-md q-pb-md dd-rise" style="--i: 2">
        <div class="row border-all rounded-borders q-pa-md text-center" style="border-radius: var(--radius-sm);">
          <div
            v-for="(s, i) in preview.stats"
            :key="i"
            class="col"
            :class="i < preview.stats.length - 1 ? 'border-right' : ''"
          >
            <div class="dd-muted text-caption text-uppercase text-weight-bold q-mb-xs">{{ s.label }}</div>
            <div v-if="s.sub" class="row items-center justify-center q-gutter-x-sm">
              <div class="dd-ink text-h6 text-weight-bold">{{ s.value }}</div>
              <BadgePill :tone="s.subTone || 'success'" :label="s.sub" />
            </div>
            <div v-else class="dd-ink text-h6 text-weight-bold">{{ s.value }}</div>
          </div>
        </div>
      </div>

      <div v-if="preview.placement" class="q-px-md q-pb-md dd-rise" style="--i: 2">
        <div class="row border-all rounded-borders q-pa-md text-center" style="border-radius: var(--radius-sm);">
          <div
            v-for="(s, i) in placementStats"
            :key="i"
            class="col"
          >
            <div class="dd-muted text-caption text-uppercase text-weight-bold q-mb-xs">{{ s.label }}</div>
            <div v-if="s.sub" class="row items-center justify-center q-gutter-x-sm">
              <div class="dd-ink text-h6 text-weight-bold">{{ s.value }}</div>
              <BadgePill :tone="s.subTone || 'success'" :label="s.sub" />
            </div>
            <div v-else class="dd-ink text-h6 text-weight-bold">{{ s.value }}</div>
          </div>
        </div>
      </div>

      <template v-if="hasTabs">
        <div v-if="multiTab" class="dd-tabs-wrap" :class="{ 'dd-tabs-over': roomHero }">
          <TabNav :model-value="currentTab" @update:model-value="$emit('update:tab', $event)" :tabs="tabs" class="dd-tabs-strip dd-rise" style="--i: 4" />
        </div>

        <div class="dd-tab-card dd-rise" style="--i: 4">
          <q-tab-panels v-model="currentTab" animated class="dd-panels">
            <q-tab-panel name="overview" class="dd-panel">
              <DetailSections v-if="preview.detailGroups?.length" :groups="preview.detailGroups" />
            </q-tab-panel>

            <q-tab-panel name="history" class="dd-panel">
              <HistoryTab
                v-if="!paymentsActive"
                :preview="preview"
                @go-hub="(k, id) => $emit('go-hub', k, id)"
                @view-payments="onViewPayments"
              />
              <PaymentsTab
                v-else
                :preview="preview"
                :filter-accommodation-id="paymentsFilter"
              />
            </q-tab-panel>

            <q-tab-panel name="documents" class="dd-panel">
              <FilesTab :preview="preview" />
            </q-tab-panel>

            <q-tab-panel name="rooms" class="dd-panel">
              <RoomsTab :preview="preview" @go-room="(rm) => $emit('go-room', rm)" />
            </q-tab-panel>

            <q-tab-panel name="facilities" class="dd-panel">
              <FacilitiesTab :preview="preview" />
            </q-tab-panel>

            <q-tab-panel name="occupants" class="dd-panel">
              <OccupantsTab :preview="preview" />
            </q-tab-panel>

            <q-tab-panel name="photos" class="dd-panel">
              <PhotosTab :preview="preview" />
            </q-tab-panel>

            <q-tab-panel name="activity" class="dd-panel">
              <ActivityTab :preview="preview" />
            </q-tab-panel>

            <q-tab-panel name="reviews" class="dd-panel">
              <ReviewsTab :preview="preview" />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DetailSections from '@/features/drawer/DetailSections.vue'
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import TabNav from '@/components/ui/TabNav.vue'
import HistoryTab from './HistoryTab.vue'
import FilesTab from './FilesTab.vue'
import RoomsTab from './RoomsTab.vue'
import FacilitiesTab from './FacilitiesTab.vue'
import OccupantsTab from './OccupantsTab.vue'
import PhotosTab from './PhotosTab.vue'
import ActivityTab from './ActivityTab.vue'
import ReviewsTab from './ReviewsTab.vue'
import PaymentsTab from './PaymentsTab.vue'
import type { DrawerPreview, HubKind, PreviewRoom, PreviewStat } from './preview'

const props = withDefaults(
  defineProps<{
    preview: DrawerPreview
    loading?: boolean
    /** User-management actions shown in the 3-dots menu (e.g. Suspend, Ban). */
    managementActions?: { label: string; action: string; danger?: boolean }[]
    /** Current tab (v-model:tab). */
    tab: string
  }>(),
  {
    loading: false,
    managementActions: () => [],
  },
)

const emit = defineEmits<{
  (e: 'update:tab', value: string): void
  (e: 'close'): void
  (e: 'manage', action: string): void
  (e: 'go-hub', kind: HubKind, accommodationId?: string): void
  (e: 'go-room', room: PreviewRoom): void
}>()

const paymentsActive = ref(false)
const paymentsFilter = ref<string | null>(null)
const fullPaymentsMode = ref(false)

function onViewPayments(accommodationId: string) {
  // Payment History always replaces the whole user preview with the
  // payment-focused view (no tab-only fallback), so every "Payment History"
  // button behaves identically regardless of user kind / boarding-history size.
  paymentsFilter.value = accommodationId
  paymentsActive.value = true
  fullPaymentsMode.value = true
}

function onViewHistory() {
  paymentsActive.value = false
  paymentsFilter.value = null
  fullPaymentsMode.value = false
}

const showOverviewTab = computed(() => !!props.preview.detailGroups?.length)
const showHistoryTab = computed(
  () =>
    props.preview.card !== undefined ||
    props.preview.history !== undefined ||
    props.preview.historyCards !== undefined,
)
const showDocsTab = computed(() => props.preview.files !== undefined && !props.loading)
const showRoomsTab = computed(() => props.preview.rooms !== undefined && !props.loading)
const showFacilitiesTab = computed(() => props.preview.facilities !== undefined && !props.loading)
const showOccupantsTab = computed(() => props.preview.occupants !== undefined && !props.loading)
const roomHero = computed(() => props.preview.kind === 'room')
const coverUrl = computed(() => props.preview.photos?.[0]?.url || '')
const showPhotosTab = computed(() => props.preview.photos !== undefined && !props.loading)
const showActivityTab = computed(() => props.preview.activity !== undefined)
const showReviewsTab = computed(() => props.preview.reviews !== undefined && !props.loading)
const multiTab = computed(
  () => [showOverviewTab.value, showHistoryTab.value, showDocsTab.value, showRoomsTab.value, showFacilitiesTab.value, showOccupantsTab.value, showPhotosTab.value, showActivityTab.value, showReviewsTab.value].filter(Boolean).length >= 2
)
const hasTabs = computed(() => !!(showOverviewTab.value || showHistoryTab.value || showDocsTab.value || showRoomsTab.value || showFacilitiesTab.value || showOccupantsTab.value || showPhotosTab.value || showActivityTab.value || showReviewsTab.value))

const visibleTabs = computed(() => {
  const tabs: string[] = []
  if (showOverviewTab.value) tabs.push('overview')
  if (showHistoryTab.value) tabs.push('history')
  if (showDocsTab.value) tabs.push('documents')
  if (showRoomsTab.value) tabs.push('rooms')
  if (showFacilitiesTab.value) tabs.push('facilities')
  if (showOccupantsTab.value) tabs.push('occupants')
  if (showPhotosTab.value) tabs.push('photos')
  if (showActivityTab.value) tabs.push('activity')
  if (showReviewsTab.value) tabs.push('reviews')
  return tabs
})
const currentTab = computed({
  get: () =>
    props.tab && visibleTabs.value.includes(props.tab)
      ? props.tab
      : visibleTabs.value[0] || 'overview',
  set: (v: string) => {
    emit('update:tab', v)
  },
})

const tabs = computed(() => {
  const t: { name: string; label: string }[] = []
  if (showOverviewTab.value) t.push({ name: 'overview', label: 'Overview' })
  if (showHistoryTab.value) t.push({ name: 'history', label: props.preview.card?.title || 'Boarding History' })
  if (showDocsTab.value) t.push({ name: 'documents', label: 'Documents' })
  if (showRoomsTab.value) t.push({ name: 'rooms', label: 'Rooms' })
  if (showFacilitiesTab.value) t.push({ name: 'facilities', label: props.preview.kind === 'room' ? 'Private Facilities' : 'Shared Facilities' })
  if (showOccupantsTab.value) t.push({ name: 'occupants', label: 'Occupants' })
  if (showPhotosTab.value) t.push({ name: 'photos', label: 'Photos' })
  if (showActivityTab.value) t.push({ name: 'activity', label: 'Activity' })
  if (showReviewsTab.value) t.push({ name: 'reviews', label: 'Reviews' })
  return t
})

const placementStats = computed<PreviewStat[]>(() => {
  const p = props.preview.placement
  if (!p) return []
  const items: PreviewStat[] = []
  const houses = props.preview.history?.length ?? 0
  items.push({ label: 'Boarding Houses', value: String(houses) })
  items.push({ label: 'Status', value: p.status || '—' })
  if (p.moveIn) {
    const dt = new Date(p.moveIn)
    if (!isNaN(dt.getTime())) {
      const now = new Date()
      const months = (now.getFullYear() - dt.getFullYear()) * 12 + (now.getMonth() - dt.getMonth())
      items.push({ label: 'Tenure', value: months <= 0 ? 'New' : `${months} mo` })
    }
  }
  return items
})
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid var(--c-border);
}
.border-right {
  border-right: 1px solid var(--c-border);
}
.border-all {
  border: 1px solid var(--c-border);
}
.text-link {
  text-decoration: none;
  color: var(--c-primary);
}
.text-link:hover {
  text-decoration: underline;
}
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
.dd-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
/* Tab content is wrapped in its own card (folder-tab → card connection).
   The active folder-tab merges its surface over this card's top border. */
.dd-tab-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 240px;
  overflow: hidden;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-surface);
}
.dd-tab-card .q-tab-panel {
  overflow-y: auto;
}
.dd-tabs-strip {
  position: relative;
  z-index: 2;
  padding: 0 var(--sp-4);
  overflow: visible;
}
.dd-tabs-strip :deep(.q-tabs__content) {
  overflow: visible;
}
.dd-tabs-strip :deep(.folder-tab:not(.q-tab--active)) {
  margin-bottom: 0;
}
.dd-tabs-strip :deep(.q-tab--active) {
  position: relative;
  z-index: 3;
}
.dd-tabs-strip :deep(.q-tab--active)::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--c-surface);
}
.dd-panels {
  flex: 1 1 auto;
  min-height: 0;
  background: transparent;
}
.dd-panels :deep(.q-tab-panel) {
  display: flex;
  flex-direction: column;
  padding: var(--sp-4);
  overflow-y: auto;
}
/* Back button in the payment-history header (renders like a preview control). */
.dd-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  color: var(--c-text);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.dd-back-btn:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
  background: var(--c-surface);
}
@keyframes dd-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.dd-rise {
  animation: dd-fade-in 0.4s ease both;
  animation-delay: calc(var(--i, 0) * 0.06s);
}
@media (prefers-reduced-motion: reduce) {
  .dd-rise {
    animation: none;
  }
}
/* Room hero + tab strip, ported from accommo-mobile's AccommodationDetail:
   fixed-height cover photo, title overlaid on a top scrim, and a tab strip
   pulled up over the photo's bottom edge so tabs and panel read as one block
   rising out of it. */
/* Like mobile's AccommodationDetail, the room photo IS the top of the panel:
   the header stops taking its own white strip and floats over the photo with
   just its menu button, so the picture runs from the very top edge down behind
   the tab strip. */
.dd-room-hero {
  position: relative;
}
.dd-room-hero .dd-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3;
  background: transparent;
  padding: 10px 12px;
}
.dd-room-hero .dd-header :deep(.q-btn) {
  color: #fff;
  background: rgba(23, 32, 42, 0.55);
}
.dd-hero {
  position: relative;
  /* flex:0 0 auto — the drawer body is a flex column, so without it the photo
     gets squeezed by the panel below instead of keeping its height. */
  flex: 0 0 auto;
  height: 300px;
  overflow: hidden;
  background: var(--c-surface-2);
}
.dd-hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dd-hero-empty {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, var(--c-border), var(--c-surface) 85%);
}
.dd-hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 45%);
}
.dd-hero-head {
  position: absolute;
  left: var(--sp-4);
  right: 54px;
  top: 14px;
  z-index: 1;
}
.dd-hero-name {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}
/* The strip is wrapped in an element this component owns, so the overlap and
   the over-photo tab styling below never depend on the scope id reaching
   TabNav's own root — it does not, which is why earlier attempts at this had
   no effect at all. */
.dd-tabs-wrap {
  position: relative;
  z-index: 2;
  margin-top: 16px;
}
/* The tabs themselves are the plain shared folder tabs, exactly as the user
   preview has them — only their position changes here, riding the bottom edge
   of the photo riding a little way up the bottom of the photo. */
.dd-tabs-over {
  margin-top: -64px;
}
/* Only the fill changes: an unselected tab over the photo is frosted glass, so
   the picture reads through it. Shape, size and the active tab stay exactly as
   the user preview's folder tabs. */
.dd-tabs-over :deep(.folder-tab:not(.q-tab--active)) {
  color: rgba(255, 255, 255, 0.92);
  background-color: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}
.dd-tabs-over :deep(.folder-tab:not(.q-tab--active):hover) {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.24);
}

/* Off the photo there is nothing behind the strip but a flat panel, so
   backdrop-filter has nothing to act on — blurring a flat colour returns the
   same flat colour. The glass has to be built out of the fill instead: a
   translucent tint, a bright hairline edge, and a highlight along the top so
   the tab catches light like a pane. The blur stays for the rare case where
   content does scroll under it.

   Plain `--c-muted` on the opaque `--c-surface-2` is what was not reading. */
.dd-tabs-wrap:not(.dd-tabs-over) :deep(.folder-tab:not(.q-tab--active)) {
  color: var(--c-ink);
  background-image: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--c-surface) 92%, transparent),
    color-mix(in srgb, var(--c-surface-2) 70%, transparent)
  );
  background-color: transparent;
  border-color: color-mix(in srgb, var(--c-border-strong, var(--c-border)) 85%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #fff 55%, transparent),
    0 1px 2px color-mix(in srgb, #000 6%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
}
.dd-tabs-wrap:not(.dd-tabs-over) :deep(.folder-tab:not(.q-tab--active):hover) {
  background-image: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--c-surface) 100%, transparent),
    color-mix(in srgb, var(--c-surface-2) 88%, transparent)
  );
  border-color: var(--c-border-strong, var(--c-border));
}
/* A 55%-white top highlight reads as a lit edge on a pale surface and as a
   scratch on a dark one, so dark mode gets a much fainter one. */
:global([data-theme='dark']) .dd-tabs-wrap:not(.dd-tabs-over) :deep(.folder-tab:not(.q-tab--active)) {
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #fff 12%, transparent),
    0 1px 2px color-mix(in srgb, #000 28%, transparent);
}

/* Quasar shrinks tab labels to fit before it will do anything else, and five
   tabs at the shared 22px padding overrun a 540px drawer — "Shared Facilities"
   came out clipped to a few characters. Tighter gutters here buy back ~90px,
   which is enough, and keep it local to the drawer: the page-level strips in
   Accommodation Hub and Account Management have the full window to spread into
   and should stay as they are.

   Scrolling the strip is not an option — `.q-tabs__content` above is
   deliberately `overflow: visible` so the active tab's ::after can draw the
   seam that merges it into the card below. */
.dd-tabs-strip :deep(.folder-tab) {
  flex: 0 0 auto;
  padding: 0 13px;
  white-space: nowrap;
}
</style>
