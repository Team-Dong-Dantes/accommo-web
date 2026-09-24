  <template>
    <div :key="preview.name" class="dd-content" :class="{ 'dd-single': !twoPane }">

      <!-- Row 1 — the tab strip on the right, empty on the left. -->
      <div v-if="twoPane" class="dd-tabs-row">
        <div class="dd-tabs-spacer"></div>
        <div class="dd-head-tabs">
          <TabNav
            v-if="multiTab && !fullPaymentsMode"
            :model-value="currentTab"
            @update:model-value="$emit('update:tab', $event)"
            :tabs="tabs"
            class="dd-tabs-strip dd-rise"
            style="--i: 1"
          />
        </div>
      </div>

      <!-- Row 2 — the two panes. The left pane's top edge sits exactly at the
          top of the tab content area on the right. -->
      <div class="dd-panes-row">
        <div class="dd-left">
          <div class="dd-head-title dd-rise" style="--i: 0">
            <div class="row items-center q-gutter-x-sm">
              <div class="dd-ink dd-display text-h6 text-weight-bold">{{ preview.title || 'Preview' }}</div>
              <div v-if="preview.positionLabel" class="dd-muted text-caption">{{ preview.positionLabel }}</div>
            </div>
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

          <template v-if="accOverview">
            <div class="dd-cover dd-rise" style="--i: 1">
              <img
                v-if="accOverview.coverUrl && !coverBroken"
                :src="accOverview.coverUrl"
                alt=""
                class="dd-cover-img"
                @error="coverBroken = true"
              />
              <span v-else class="dd-cover-tag">No cover photo on file</span>
              <div class="dd-cover-fade"></div>
              <div class="dd-cover-head">
                <h2 class="dd-ink dd-display dd-cover-name">{{ preview.name }}</h2>
                <div v-if="accOverview.typeLine" class="dd-cover-type">{{ accOverview.typeLine }}</div>
                <div v-if="accOverview.address" class="dd-cover-addr">{{ accOverview.address }}</div>
              </div>
            </div>

            <div class="dd-accred" :class="{ 'dd-accred--pending': !accOverview.accredited }">
              <span class="dd-accred-state">
                <Icon :icon="accOverview.accredited ? 'lucide:award' : 'lucide:clock'" width="16" height="16" />
                {{ accOverview.accreditationLabel }}
              </span>
            </div>

            <div class="dd-occ dd-rise" style="--i: 2">
              <div class="dd-dial" :style="{ '--pct': accOverview.occupancyPct }">
                <div class="dd-dial-hole">
                  <div class="dd-dial-pct">{{ accOverview.occupancyPct }}%</div>
                  <div class="dd-dial-cap">Occupied</div>
                  <div class="dd-dial-beds">{{ accOverview.occupied }} of {{ accOverview.capacity }} beds</div>
                </div>
              </div>
              <div v-if="accOverview.female || accOverview.male" class="dd-split">
                <div class="dd-split-bar">
                  <div class="dd-split-f" :style="{ width: femaleShare }"></div>
                  <div class="dd-split-m" :style="{ width: maleShare }"></div>
                </div>
                <div class="dd-split-legend">
                  <span class="dd-split-lf"><i></i>{{ accOverview.female }} Female</span>
                  <span class="dd-split-lm">{{ accOverview.male }} Male<i></i></span>
                </div>
              </div>
            </div>
          </template>

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

          <div v-else-if="!accOverview" class="dd-identity q-pa-md dd-rise" style="--i: 1">
            <div class="row items-center q-gutter-x-md no-wrap">
              <q-avatar size="64px" :color="heroAvatarColor" text-color="white" class="text-weight-bold">
                <img v-if="preview.avatar && !heroAvatarBroken" :src="preview.avatar" :alt="preview.name" @error="heroAvatarBroken = true" />
                <template v-else>{{ preview.initials || '?' }}</template>
              </q-avatar>
              <div class="col dd-identity-text">
                <h2 class="dd-ink dd-display dd-identity-name">{{ preview.name }}</h2>
                <div class="dd-chips">
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

          <div v-if="!roomHero && preview.stats?.length" class="dd-rise" style="--i: 2">
            <div class="dd-stat-strip">
              <div v-for="(s, i) in preview.stats" :key="i" class="dd-stat-cell">
                <div class="dd-stat-label">{{ s.label }}</div>
                <div class="row items-center justify-center q-gutter-x-xs">
                  <div class="dd-stat-value">{{ s.value }}</div>
                  <BadgePill v-if="s.sub" :tone="s.subTone || 'success'" :label="s.sub" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="preview.placement" class="dd-rise" style="--i: 2">
            <div class="dd-stat-strip">
              <div v-for="(s, i) in placementStats" :key="i" class="dd-stat-cell">
                <div class="dd-stat-label">{{ s.label }}</div>
                <div class="row items-center justify-center q-gutter-x-xs">
                  <div class="dd-stat-value">{{ s.value }}</div>
                  <BadgePill v-if="s.sub" :tone="s.subTone || 'success'" :label="s.sub" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="preview.detailGroups?.length && !accOverview" class="dd-rise" style="--i: 3">
            <DetailSections :groups="preview.detailGroups" />
          </div>

          <div v-if="accOverview" class="dd-landlord dd-rise" style="--i: 3">
            <q-avatar size="42px" color="primary" text-color="white" class="text-weight-bold">
              <img
                v-if="accOverview.landlord.avatarUrl && !landlordAvatarBroken"
                :src="accOverview.landlord.avatarUrl"
                :alt="accOverview.landlord.name"
                @error="landlordAvatarBroken = true"
              />
              <template v-else>{{ accOverview.landlord.initials || '?' }}</template>
            </q-avatar>
            <div class="dd-landlord-text">
              <div class="dd-landlord-name">{{ accOverview.landlord.name }}</div>
              <div class="dd-landlord-sub">
                {{ accOverview.landlord.title }}<template v-if="accOverview.landlord.contact"> · {{ accOverview.landlord.contact }}</template>
              </div>
            </div>
          </div>
        </div>

        <div v-if="twoPane" class="dd-right">
          <div v-if="fullPaymentsMode" class="dd-payments">
            <div class="dd-right-head row items-center q-gutter-x-sm">
              <button type="button" class="dd-back-btn" @click="onViewHistory" aria-label="Back to boarding history">
                <Icon icon="lucide:arrow-left" width="20" height="20" />
              </button>
              <div class="dd-ink dd-display text-h6 text-weight-bold">Payment History</div>
            </div>
            <div class="dd-right-scroll q-pa-md dd-rise" style="--i: 1">
              <PaymentsTab
                :preview="preview"
                :filter-accommodation-id="paymentsFilter"
              />
            </div>
          </div>

          <template v-else>
            <div class="dd-tab-card dd-rise" style="--i: 4">
              <q-tab-panels v-model="currentTab" animated class="dd-panels">
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
        </div>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { computed, ref, watch } from 'vue'
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
      managementActions?: { label: string; action: string; danger?: boolean }[]
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
    paymentsFilter.value = accommodationId
    paymentsActive.value = true
    fullPaymentsMode.value = true
  }

  function onViewHistory() {
    paymentsActive.value = false
    paymentsFilter.value = null
    fullPaymentsMode.value = false
  }

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

  const accOverview = computed(() =>
    props.preview.kind === 'accommodation' ? props.preview.overview : undefined,
  )
  const coverBroken = ref(false)
  const landlordAvatarBroken = ref(false)
  watch(() => props.preview.overview?.coverUrl, () => { coverBroken.value = false })
  watch(() => props.preview.overview?.landlord.avatarUrl, () => { landlordAvatarBroken.value = false })

  const occupantTotal = computed(() => (accOverview.value?.female ?? 0) + (accOverview.value?.male ?? 0))
  const femaleShare = computed(() =>
    occupantTotal.value ? `${((accOverview.value?.female ?? 0) / occupantTotal.value) * 100}%` : '0%',
  )
  const maleShare = computed(() =>
    occupantTotal.value ? `${((accOverview.value?.male ?? 0) / occupantTotal.value) * 100}%` : '0%',
  )

  const heroAvatarBroken = ref(false)
  watch(() => props.preview.avatar, () => { heroAvatarBroken.value = false })
  const heroAvatarColor = computed(() => (props.preview.kind === 'accommodation' ? 'teal-6' : 'indigo-5'))
  const showPhotosTab = computed(() => props.preview.photos !== undefined && !props.loading)
  const showActivityTab = computed(() => props.preview.activity !== undefined)
  const showReviewsTab = computed(() => props.preview.reviews !== undefined && !props.loading)
  const multiTab = computed(
    () => [showHistoryTab.value, showDocsTab.value, showRoomsTab.value, showFacilitiesTab.value, showOccupantsTab.value, showPhotosTab.value, showActivityTab.value, showReviewsTab.value].filter(Boolean).length >= 2
  )
  const hasTabs = computed(() => !!(showHistoryTab.value || showDocsTab.value || showRoomsTab.value || showFacilitiesTab.value || showOccupantsTab.value || showPhotosTab.value || showActivityTab.value || showReviewsTab.value))

  const twoPane = computed(() => hasTabs.value)

  const visibleTabs = computed(() => {
    const tabs: string[] = []
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
        : visibleTabs.value[0] || '',
    set: (v: string) => {
      emit('update:tab', v)
    },
  })

  const tabs = computed(() => {
    const t: { name: string; label: string }[] = []
    if (showHistoryTab.value) t.push({ name: 'history', label: props.preview.card?.title || 'Boarding History' })
    if (showDocsTab.value) t.push({ name: 'documents', label: 'Requirements' })
    if (showRoomsTab.value) t.push({ name: 'rooms', label: 'Rooms' })
    if (showFacilitiesTab.value) t.push({ name: 'facilities', label: props.preview.kind === 'room' ? 'Private Facilities' : 'Shared Facilities' })
    if (showOccupantsTab.value) t.push({ name: 'occupants', label: 'Occupants' })
    if (showPhotosTab.value) t.push({ name: 'photos', label: 'Photos' })
    if (showActivityTab.value) t.push({ name: 'activity', label: 'Activity' })
    if (showReviewsTab.value) t.push({ name: 'reviews', label: 'Ratings' })
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
  .border-bottom { border-bottom: 1px solid var(--c-border); }
  .border-right { border-right: 1px solid var(--c-border); }
  .border-all { border: 1px solid var(--c-border); }
  .text-link { text-decoration: none; color: var(--c-primary); }
  .text-link:hover { text-decoration: underline; }
  .dd-ink { color: var(--c-ink); }
  .dd-muted { color: var(--c-muted); }
  .dd-display { font-family: var(--font-display); }

  /* Root: a column. Row 1 is the tab strip, row 2 is the two panes.
  * This is what physically puts the left pane below the tabs, instead of
  * sharing a row with them. */
  .dd-content {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  /* Single-pane fallback (no tabs at all): the .dd-tabs-row is not rendered,
    so the panes-row fills the whole content box. */
  .dd-content.dd-single {
    /* nothing extra — the flex column just has one child */
  }

  /* Row 1 — tabs row. Left half is a spacer that mirrors the left pane's width,
    so the tabs start at exactly the same x as the tab content below. */
  .dd-tabs-row {
    flex: 0 0 auto;
    display: flex;
    min-height: 0;
  }
  .dd-tabs-spacer {
    flex: 3;                    /* same as .dd-left */
    min-width: 0;
  }
  .dd-head-tabs {
    flex: 4;                    /* same as .dd-right */
    position: relative;
    z-index: 2;
    display: flex;
    align-items: flex-end;
    min-width: 0;
    padding: 0 0 0 calc(var(--sp-4) * 2);
    border-left: 1px solid var(--c-border);
  }

  /* Row 2 — the two panes, side by side, sharing the row beneath the tabs. */
  .dd-panes-row {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
  }

  /* The left pane. Its top edge now sits exactly at the top of the tab content
    area on the right, so its header is BELOW the tabs.
  *
  * The top border is what makes that boundary visible: without it, the empty
  * spacer above (same white surface) reads as part of this panel and the whole
  * left side looks like one continuous column from the dialog top down. */
  .dd-left {
    flex: 3;
    position: relative;
    z-index: 1;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    border-top: 1px solid var(--c-border);
  }
  .dd-content.dd-single .dd-left {
    border-top: none;
    border-right: none;
  }

  .dd-right {
    flex: 4;
    position: relative;
    z-index: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0;
    background: transparent;
    border-left: 1px solid var(--c-border);
  }

  .dd-head-title {
    position: relative;
    z-index: 2;
    background: var(--c-surface);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    box-sizing: border-box;
    padding: var(--sp-3) var(--sp-3) var(--sp-3) var(--sp-4);
    border-bottom: 1px solid var(--c-border);
  }
  .dd-head-title :deep(.text-h6) {
    font-size: 16px;
    line-height: 1.3;
    letter-spacing: 0;
  }

  .dd-payments {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    flex-direction: column;
    padding: var(--sp-4);
  }

  .dd-content :deep(:focus-visible) {
    outline: 2px solid var(--c-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .dd-right-head {
    flex: 0 0 auto;
    padding-bottom: var(--sp-3);
  }
  .dd-right-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius);
  }

  /* Stacked: left pane, then tabs, then tab content. */
  @media (max-width: 1023px) {
    .dd-content {
      overflow-y: auto;
    }
    .dd-tabs-row {
      flex-direction: column-reverse;   /* tabs go below the spacer */
    }
    .dd-tabs-spacer {
      display: none;
    }
    .dd-head-tabs {
      flex: 0 0 auto;
      padding-left: 0;
      border-left: none;
    }
    .dd-panes-row {
      flex-direction: column;
      flex: 0 0 auto;
    }
    .dd-left {
      flex: 0 0 auto;
      overflow-y: visible;
      border-top: none;
      border-bottom: 1px solid var(--c-border);
    }
    .dd-right {
      flex: 0 0 auto;
      border-left: none;
      min-height: 420px;
    }
  }

  .dd-stat-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
    gap: 8px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--c-border);
    background: var(--c-surface-2);
  }
  .dd-stat-cell {
    padding: 8px 6px;
    text-align: center;
    background: var(--c-surface);
    border-radius: var(--radius-sm);
    border: 1px solid var(--c-border);
  }
  .dd-stat-label {
    display: block;
    margin-bottom: 4px;
    color: var(--c-muted);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dd-stat-value {
    color: var(--c-ink);
    font-size: 19px;
    font-weight: 700;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  .dd-identity {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 16px 14px;
    background: var(--c-surface);
    border-bottom: 2px solid var(--c-primary-soft);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .dd-identity-text { min-width: 0; }
  .dd-identity-name {
    margin: 0 0 8px 0;
    color: var(--c-ink);
    font-size: 20px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.015em;
    overflow-wrap: anywhere;
  }
  .dd-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .dd-chips :deep(.pill) {
    white-space: nowrap;
    font-size: 12px;
  }

  .dd-cover {
    position: relative;
    flex: 0 0 auto;
    height: 286px;
    overflow: hidden;
    background: transparent;
  }
  .dd-cover-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .dd-cover-tag {
    position: absolute;
    top: 14px;
    left: 20px;
    z-index: 1;
    padding: 4px 10px;
    border-radius: 5px;
    background: color-mix(in srgb, #14241f 42%, transparent);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .dd-cover-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      color-mix(in srgb, var(--c-surface) 5%, transparent) 38%,
      color-mix(in srgb, var(--c-surface) 48%, transparent) 57%,
      color-mix(in srgb, var(--c-surface) 91%, transparent) 72%,
      var(--c-surface) 85%
    );
  }
  .dd-cover-head {
    position: absolute;
    right: 16px;
    bottom: 14px;
    left: 16px;
  }
  .dd-cover-name {
    margin: 0 0 5px;
    color: var(--c-ink);
    font-size: 22px;
    font-weight: 700;
    line-height: 1.14;
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
  }
  .dd-cover-type {
    color: var(--c-primary);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .dd-cover-addr {
    margin-top: 5px;
    color: var(--c-muted);
    font-size: 12.5px;
  }

  .dd-accred {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 16px;
    border-bottom: 1px solid var(--c-border);
    background: color-mix(in srgb, var(--c-success) 12%, var(--c-surface));
    color: var(--c-success);
  }
  .dd-accred--pending {
    background: color-mix(in srgb, var(--c-warning) 13%, var(--c-surface));
    color: var(--c-warning);
  }
  .dd-accred-state {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    font-weight: 700;
  }
  .dd-occ {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
    padding: 22px 16px;
    border-bottom: 1px solid var(--c-border);
    background: var(--c-surface);
  }
  .dd-dial {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 188px;
    height: 188px;
    border-radius: 999px;
    background: conic-gradient(
      var(--c-primary) calc(var(--pct, 0) * 1%),
      var(--c-border-strong, var(--c-border)) 0
    );
  }
  .dd-dial-hole {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 146px;
    height: 146px;
    border-radius: 999px;
    background: var(--c-surface);
  }
  .dd-dial-pct {
    color: var(--c-ink);
    font-family: var(--font-display);
    font-size: 40px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .dd-dial-cap {
    margin-top: 6px;
    color: var(--c-muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  .dd-dial-beds {
    margin-top: 3px;
    color: var(--c-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .dd-split { width: 100%; max-width: 320px; }
  .dd-split-bar {
    display: flex;
    height: 10px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--c-border-strong, var(--c-border));
  }
  .dd-split-f { background: #e91e63; }
  .dd-split-m { background: #42a5f5; }
  .dd-split-legend {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 9px;
    font-size: 12.5px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .dd-split-lf, .dd-split-lm {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
  .dd-split-lf { color: #ad1457; }
  .dd-split-lm { color: #1565c0; }
  .dd-split-legend i { width: 9px; height: 9px; border-radius: 3px; }
  .dd-split-lf i { background: #e91e63; }
  .dd-split-lm i { background: #42a5f5; }

  .dd-landlord {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 16px;
    border-top: 1px solid var(--c-border);
    background: var(--c-surface-2);
  }
  .dd-landlord-text { min-width: 0; }
  .dd-landlord-name { color: var(--c-ink); font-size: 14.5px; font-weight: 700; }
  .dd-landlord-sub { color: var(--c-muted); font-size: 12px; }

  .dd-left :deep(.ds-card) { border: none; border-radius: 0; background: transparent; padding: 0; }
  .dd-left :deep(.ds-group) { border: none; padding: 0; }
  .dd-left :deep(.ds-group + .ds-group) {
    border-top: 1px solid var(--c-border);
    padding-top: 10px;
    margin-top: 10px;
  }
  .dd-left :deep(.ds-head) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px 6px;
    border: none;
    background: transparent;
  }
  .dd-left :deep(.ds-head-icon) {
    flex: 0 0 auto;
    color: var(--c-primary);
    opacity: 0.8;
  }
  .dd-left :deep(.ds-head-title) {
    margin: 0;
    color: var(--c-ink);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: none;
  }
  .dd-left :deep(.ds-col) { padding: 0; }
  .dd-left :deep(.ds-row) {
    gap: 12px;
    min-height: 0;
    padding: 9px 14px;
    border: none;
    background: transparent;
    transition: background-color 0.15s ease;
  }
  .dd-left :deep(.ds-row:hover) {
    background: var(--c-surface-2);
    border-radius: 6px;
  }
  .dd-left :deep(.ds-row:last-child) { border-bottom: none; }
  .dd-left :deep(.ds-label) {
    color: var(--c-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .dd-left :deep(.ds-value) {
    color: var(--c-ink);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  }
  .dd-left :deep(.ds-avatar) { justify-content: flex-start; }
  .dd-left :deep(.ds-row--stacked) { gap: 1px; }
  .dd-left :deep(.ds-label) {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .dd-left :deep(.ds-avatar) { justify-content: flex-start; }

  .dd-tab-card {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 240px;
    overflow: hidden;
    border: 1px solid var(--c-border);
    border-left: none;
    border-bottom: none;
    border-radius: 0 var(--radius) 0 0;
    background: var(--c-surface);
  }
  .dd-tab-card .q-tab-panel { overflow-y: auto; }
  .dd-tabs-strip {
    position: relative;
    z-index: 2;
    width: 100%;
    padding: 0;
    overflow: visible;
  }
  .dd-tabs-strip :deep(.q-tabs__content) { overflow: visible; }
  .dd-tabs-strip :deep(.folder-tab:not(.q-tab--active)) { margin-bottom: 0; }
  .dd-tabs-strip :deep(.q-tab--active) { position: relative; z-index: 3; }
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
  @keyframes dd-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .dd-rise {
    animation: dd-fade-in 0.4s ease both;
    animation-delay: calc(var(--i, 0) * 0.06s);
  }
  @media (prefers-reduced-motion: reduce) {
    .dd-rise { animation: none; }
  }
  .dd-hero {
    position: relative;
    flex: 0 0 auto;
    height: 220px;
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

  .dd-head-tabs :deep(.folder-tab:not(.q-tab--active)) {
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
  .dd-head-tabs :deep(.folder-tab:not(.q-tab--active):hover) {
    background-image: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--c-surface) 100%, transparent),
      color-mix(in srgb, var(--c-surface-2) 88%, transparent)
    );
    border-color: var(--c-border-strong, var(--c-border));
  }
  :global([data-theme='dark']) .dd-head-tabs :deep(.folder-tab:not(.q-tab--active)) {
    box-shadow:
      inset 0 1px 0 color-mix(in srgb, #fff 12%, transparent),
      0 1px 2px color-mix(in srgb, #000 28%, transparent);
  }

  .dd-tabs-strip :deep(.folder-tab) {
    flex: 0 0 auto;
    padding: 0 13px;
    white-space: nowrap;
  }
  </style>