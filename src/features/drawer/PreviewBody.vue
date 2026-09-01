<template>
  <div :key="preview.name" class="dd-content">

    <!-- FULL PAYMENTS MODE: same reference layout as the user preview, with a
         back button before the title to return to boarding history. -->
    <template v-if="fullPaymentsMode">
      <div class="dd-header row items-center justify-between q-pa-md dd-rise" style="--i: 0">
        <div class="row items-center q-gutter-x-sm">
          <button type="button" class="dd-back-btn" @click="onViewHistory" aria-label="Back to boarding history">
            <Icon icon="mdi:arrow-left" width="20" height="20" />
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
          <div class="dd-ink dd-display text-h6 text-weight-bold">{{ preview.title || 'Preview' }}</div>
          <div v-if="preview.positionLabel" class="dd-muted text-caption">{{ preview.positionLabel }}</div>
        </div>
        <div class="row items-center q-gutter-x-sm">
          <q-btn flat round dense color="primary">
            <Icon icon="mdi:dots-vertical" width="20" height="20" />
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

      <q-separator style="background: var(--c-border)" />

      <div class="q-pa-md dd-rise" style="--i: 1">
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

      <div v-if="preview.stats?.length" class="q-px-md q-pb-md dd-rise" style="--i: 2">
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

      <div v-if="preview.details?.length" class="q-px-md q-pb-md dd-rise" style="--i: 3">
        <div class="dd-ink dd-display text-subtitle1 text-weight-bold q-mb-md">Details</div>
        <div class="row q-col-gutter-x-xl">
          <div class="col-6">
            <div
              v-for="(d, i) in leftDetails"
              :key="'l' + i"
              class="row justify-between q-py-sm border-bottom items-center"
            >
              <div class="dd-muted">{{ d.label }}</div>
              <a v-if="d.link" :href="d.link" class="text-link block">{{ d.value }}</a>
              <div v-else-if="d.avatar" class="row items-center q-gutter-x-sm">
                <q-avatar size="24px" color="primary" text-color="white" class="text-caption text-weight-bold">{{ d.avatar.initials }}</q-avatar>
                <div class="text-weight-medium">{{ d.avatar.name }}</div>
              </div>
              <div v-else class="text-weight-medium">{{ d.value }}</div>
            </div>
          </div>
          <div class="col-6">
            <div
              v-for="(d, i) in rightDetails"
              :key="'r' + i"
              class="row justify-between q-py-sm border-bottom items-center"
            >
              <div class="dd-muted">{{ d.label }}</div>
              <a v-if="d.link" :href="d.link" class="text-link block">{{ d.value }}</a>
              <div v-else-if="d.avatar" class="row items-center q-gutter-x-sm">
                <q-avatar size="24px" color="primary" text-color="white" class="text-caption text-weight-bold">{{ d.avatar.initials }}</q-avatar>
                <div class="text-weight-medium">{{ d.avatar.name }}</div>
              </div>
              <div v-else class="text-weight-medium">{{ d.value }}</div>
            </div>
          </div>
        </div>
      </div>

      <template v-if="hasTabs">
        <q-separator style="background: var(--c-border)" />
        <TabNav v-if="multiTab" :model-value="currentTab" @update:model-value="$emit('update:tab', $event)" :tabs="tabs" class="dd-tabs-strip q-mt-md dd-rise" style="--i: 4" />

        <div class="dd-tab-card dd-rise" style="--i: 4">
          <q-tab-panels v-model="currentTab" animated class="dd-panels">
            <q-tab-panel name="history" class="q-pa-none">
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

            <q-tab-panel name="documents" class="q-pa-none">
              <FilesTab :preview="preview" />
            </q-tab-panel>

            <q-tab-panel name="rooms" class="q-pa-none">
              <RoomsTab :preview="preview" @go-room="(rm) => $emit('go-room', rm)" />
            </q-tab-panel>

            <q-tab-panel name="occupants" class="q-pa-none">
              <OccupantsTab :preview="preview" />
            </q-tab-panel>

            <q-tab-panel name="photos" class="q-pa-none">
              <PhotosTab :preview="preview" />
            </q-tab-panel>

            <q-tab-panel name="activity" class="q-pa-none">
              <ActivityTab :preview="preview" />
            </q-tab-panel>

            <q-tab-panel name="reviews" class="q-pa-none">
              <ReviewsTab :preview="preview" />
            </q-tab-panel>
          </q-tab-panels>
          <div class="dd-tab-foot row items-center justify-end">
            <span class="cursor-pointer text-weight-bold text-caption text-link">View All</span>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import TabNav from '@/components/ui/TabNav.vue'
import HistoryTab from './HistoryTab.vue'
import FilesTab from './FilesTab.vue'
import RoomsTab from './RoomsTab.vue'
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

const leftDetails = computed(() => {
  const d = props.preview.details ?? []
  return d.slice(0, Math.ceil(d.length / 2))
})
const rightDetails = computed(() => {
  const d = props.preview.details ?? []
  return d.slice(Math.ceil(d.length / 2))
})

const showHistoryTab = computed(() => !!(props.preview.card || props.preview.history?.length || props.preview.historyCards?.length))
const showDocsTab = computed(() => props.preview.files !== undefined && !props.loading)
const showRoomsTab = computed(() => props.preview.rooms !== undefined && !props.loading)
const showOccupantsTab = computed(() => props.preview.occupants !== undefined && !props.loading)
const showPhotosTab = computed(() => props.preview.photos !== undefined && !props.loading)
const showActivityTab = computed(() => !!(props.preview.activity?.length))
const showReviewsTab = computed(() => props.preview.reviews !== undefined && !props.loading)
const multiTab = computed(
  () => [showHistoryTab.value, showDocsTab.value, showRoomsTab.value, showOccupantsTab.value, showPhotosTab.value, showActivityTab.value, showReviewsTab.value].filter(Boolean).length >= 2
)
const hasTabs = computed(() => !!(showHistoryTab.value || showDocsTab.value || showRoomsTab.value || showOccupantsTab.value || showPhotosTab.value || showActivityTab.value || showReviewsTab.value))

const visibleTabs = computed(() => {
  const tabs: string[] = []
  if (showHistoryTab.value) tabs.push('history')
  if (showDocsTab.value) tabs.push('documents')
  if (showRoomsTab.value) tabs.push('rooms')
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
      : visibleTabs.value[0] || 'history',
  set: (v: string) => {
    emit('update:tab', v)
  },
})

const tabs = computed(() => {
  const t: { name: string; label: string }[] = []
  if (showHistoryTab.value) t.push({ name: 'history', label: props.preview.card?.title || 'Boarding History' })
  if (showDocsTab.value) t.push({ name: 'documents', label: 'Documents' })
  if (showRoomsTab.value) t.push({ name: 'rooms', label: 'Rooms' })
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
  padding: var(--sp-4);
}
.dd-tab-card .q-tab-panel {
  overflow-y: auto;
}
.dd-tab-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: var(--sp-3);
  margin-top: var(--sp-3);
  border-top: 1px solid var(--c-border);
  min-height: 20px;
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
  padding: var(--sp-4) 0 0 0;
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
</style>