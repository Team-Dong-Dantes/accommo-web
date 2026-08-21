<template>
  <Teleport to="body" :disabled="anchored">
    <transition name="dd-fade" :css="!anchored">
      <div
        v-if="modelValue"
        :class="anchored ? ['dd-anchored-wrap', `dd-anchored-${position}`] : ['dd-backdrop', { 'dd-backdrop--static': !closeOnBackdrop }]"
        @click="onBackdropClick"
      >
        <transition name="dd-slide" :css="!anchored" @after-leave="$emit('closed')">
          <aside
            v-if="modelValue"
            class="dd-panel"
            :class="[anchored ? 'dd-panel--anchored' : '', { 'is-expanded': expanded }]"
            :style="{ width: expanded ? expandedWidth : width, maxWidth: '94vw' }"
            role="dialog"
            :aria-modal="!anchored"
            @click.stop
          >
            <!-- Data-driven reference layout (our system's data, on-brand) -->
            <q-card
              v-if="preview || loading"
              class="dd-surface text-body2 dd-preview"
              style="height: 100%; border-radius: var(--radius); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden; font-family: var(--font-body);"
            >
              <template v-if="loading">
                <div class="dd-header row items-center justify-between q-pa-md">
                  <q-skeleton type="text" width="160px" height="22px" />
                  <q-skeleton type="circle" size="36px" />
                </div>
                <q-separator style="background: var(--c-border)" />
                <div class="q-pa-md">
                  <div class="row items-center q-gutter-x-md">
                    <q-skeleton type="circle" size="72px" />
                    <div class="col">
                      <q-skeleton type="text" width="55%" height="24px" class="q-mb-xs" />
                      <div class="row q-gutter-x-sm q-mt-xs">
                        <q-skeleton type="rect" width="84px" height="22px" style="border-radius: 999px" />
                        <q-skeleton type="rect" width="72px" height="22px" style="border-radius: 999px" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="q-px-md q-pb-md">
                  <div class="row border-all rounded-borders q-pa-md text-center" style="border-radius: var(--radius-sm);">
                    <div v-for="n in 3" :key="n" class="col" :class="n < 3 ? 'border-right' : ''">
                      <q-skeleton type="text" width="60%" class="q-mx-auto q-mb-xs" />
                      <q-skeleton type="text" width="50%" class="q-mx-auto" />
                    </div>
                  </div>
                </div>
                <div class="q-px-md q-pb-md">
                  <div class="row q-col-gutter-x-xl">
                    <div class="col-6">
                      <div v-for="n in 4" :key="n" class="row justify-between q-py-sm border-bottom">
                        <q-skeleton type="text" width="40%" />
                        <q-skeleton type="text" width="35%" />
                      </div>
                    </div>
                    <div class="col-6">
                      <div v-for="n in 4" :key="n" class="row justify-between q-py-sm border-bottom">
                        <q-skeleton type="text" width="40%" />
                        <q-skeleton type="text" width="35%" />
                      </div>
                    </div>
                  </div>
                </div>
                <q-separator style="background: var(--c-border)" />
                <div class="q-px-md q-pb-md">
                  <!-- Tab strip -->
                  <div class="row q-gutter-x-sm q-mb-md">
                    <q-skeleton type="rect" width="120px" height="30px" style="border-radius: 8px;" />
                    <q-skeleton type="rect" width="96px" height="30px" style="border-radius: 8px;" />
                    <q-skeleton type="rect" width="84px" height="30px" style="border-radius: 8px;" />
                  </div>
                  <!-- Boarding-history / Active-Listing card timeline -->
                  <div class="dd-hc-list">
                    <div v-for="n in 2" :key="n" class="dd-hc-row">
                      <div class="dd-hc-rail">
                        <q-skeleton type="circle" size="40px" />
                      </div>
                      <div class="dd-hc-card border-all rounded-borders" style="border-radius: var(--radius-sm);">
                        <div class="row justify-between items-center">
                          <q-skeleton type="text" width="55%" height="16px" />
                          <q-skeleton type="rect" width="64px" height="20px" style="border-radius: 999px;" />
                        </div>
                        <div class="row justify-between items-end">
                          <q-skeleton type="text" width="40%" height="12px" />
                          <q-skeleton type="text" width="28%" height="12px" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="preview">
              <div :key="preview.name" class="dd-content">
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
                          @click="onManage(a.action)"
                        >
                          <q-item-section :class="a.danger ? 'text-negative' : ''">{{ a.label }}</q-item-section>
                        </q-item>
                        <q-separator v-if="managementActions.length" />
                        <q-item clickable v-close-popup @click="close">
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
                    :class="i < placementStats.length - 1 ? 'border-right' : ''"
                  >
                    <div class="dd-muted text-caption text-uppercase text-weight-bold q-mb-xs">{{ s.label }}</div>
                    <div class="dd-ink text-h6 text-weight-bold">{{ s.value }}</div>
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
                        <div class="text-weight-medium">{{ d.value }}</div>
                      </div>
                      <BadgePill v-else-if="d.tone" :tone="d.tone" :icon="d.icon ?? ''" :label="d.value || ''" />
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
                        <div class="text-weight-medium">{{ d.value }}</div>
                      </div>
                      <BadgePill v-else-if="d.tone" :tone="d.tone" :icon="d.icon ?? ''" :label="d.value || ''" />
                      <div v-else class="text-weight-medium">{{ d.value }}</div>
                    </div>
                  </div>
                </div>
              </div>




              <template v-if="showHistoryTab || showDocsTab || showActivityTab || showReviewsTab">
                <q-separator style="background: var(--c-border)" />
                <TabNav v-if="multiTab" :model-value="currentTab" @update:model-value="ddTab = $event" :tabs="ddTabs" class="dd-tabs-strip q-mt-md dd-rise" style="--i: 4" />

                <div class="dd-tab-card dd-rise" style="--i: 4">
                  <q-tab-panels v-model="currentTab" animated class="dd-panels">
                    <q-tab-panel name="history" class="q-pa-none">
                    <div v-if="preview.historyCards?.length" class="dd-hc-list">
                      <div
                        v-for="(hc, i) in preview.historyCards"
                        :key="i"
                        class="dd-hc-row"
                        :class="{ 'dd-hc-row--active': hc.active }"
                      >
                        <div class="dd-hc-rail">
                          <span
                            class="dd-hc-icon"
                            :style="hc.active ? { background: 'var(--c-success)', borderColor: 'var(--c-success)' } : {}"
                          >
                            <Icon :icon="hc.icon || 'mdi:home'" width="18" height="18" :style="{ color: hc.active ? '#fff' : 'var(--c-primary)' }" />
                          </span>
                          <template v-if="preview.historyCards.length > 1">
                            <div v-if="i < preview.historyCards.length - 1" class="dd-hc-line dd-hc-line--down"></div>
                            <div v-if="i > 0" class="dd-hc-line dd-hc-line--up"></div>
                          </template>
                        </div>
                        <div class="dd-hc-card dd-card border-all rounded-borders" style="border-radius: var(--radius-sm); flex: 1 1 auto; background: var(--c-surface);" :class="{ 'dd-card--linkless': !hc.propertyId }">
                          <div class="row justify-between items-center">
                            <div class="text-weight-bold" style="color: var(--c-text)">{{ hc.title }}</div>
                            <BadgePill :tone="hc.statusTone || 'primary'" :label="hc.status" />
                          </div>
                          <div class="row justify-between items-end">
                            <div class="text-caption" style="color: var(--c-muted)">
                              <template v-if="hc.roomType">{{ hc.roomType }}</template><template v-if="hc.roomType && hc.location"> · </template>{{ hc.location }}
                            </div>
                            <div v-if="hc.date" class="text-caption text-right" style="color: var(--c-muted)">{{ hc.date }}</div>
                          </div>
                          <div v-if="hc.propertyId" class="dd-card-overlay">
                            <button type="button" class="dd-hover-btn" @click.stop="goToHub('map', hc.propertyId)"><Icon icon="mdi:map-marker" width="15" height="15" />View on Map</button>
                            <button type="button" class="dd-hover-btn" @click.stop="goToHub('property', hc.propertyId)"><Icon icon="mdi:home-search-outline" width="15" height="15" />View on Property Hub</button>
                            <button type="button" class="dd-hover-btn" @click.stop="goToHub('room', hc.propertyId)"><Icon icon="mdi:door" width="15" height="15" />View on Room Hub</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else-if="preview.card">
                      <div v-if="preview.card.footerLink" class="row justify-between items-center q-mb-md">
                        <div class="dd-ink dd-display text-subtitle1 text-weight-bold">{{ preview.card.title }}</div>
                        <span
                          class="cursor-pointer text-weight-bold text-caption text-link"
                        >{{ preview.card.footerLink }}</span>
                      </div>
                      <div class="dd-card border-all rounded-borders" :class="{ 'dd-card--linkless': !preview.card?.propertyId }" style="border-radius: var(--radius-sm); position: relative;">
                        <div class="row justify-between items-center q-pa-md" :class="preview.card.cells?.length ? 'border-bottom' : ''">
                          <div>
                            <div class="text-body1">
                              <span class="text-weight-bold" style="color: var(--c-text)">{{ preview.card.head.title }}</span>
                            </div>
                            <div v-if="preview.card.head.location" class="text-caption q-mt-xs" style="color: var(--c-muted)">{{ preview.card.head.location }}</div>
                          </div>
                          <BadgePill
                            :tone="preview.card.head.statusTone || 'primary'"
                            :label="preview.card.head.status"
                          />
                        </div>
                        <div v-if="preview.card.cells?.length" class="row q-pa-sm">
                          <div
                            v-for="(c, i) in preview.card.cells"
                            :key="i"
                            class="col q-pa-sm"
                            :class="i < preview.card.cells.length - 1 ? 'border-right' : ''"
                          >
                            <div class="dd-muted text-caption q-mb-xs">{{ c.label }}</div>
                            <BadgePill v-if="c.tone" :tone="c.tone" :icon="c.icon ?? ''" :label="c.value || ''" />
                            <div v-else-if="c.avatar" class="row items-center q-gutter-x-xs">
                              <q-avatar size="24px" color="primary" text-color="white" class="text-caption text-weight-bold">
                                {{ c.avatar.initials }}
                              </q-avatar>
                              <div class="text-weight-medium text-body2">{{ c.avatar.name }}</div>
                            </div>
                            <div v-else class="text-weight-medium text-body2">{{ c.value }}</div>
                          </div>
                        </div>
                        <div v-if="preview.card?.propertyId" class="dd-card-overlay">
                          <button type="button" class="dd-hover-btn" @click.stop="goToHub('map', preview.card.propertyId)"><Icon icon="mdi:map-marker" width="15" height="15" />View on Map</button>
                          <button type="button" class="dd-hover-btn" @click.stop="goToHub('property', preview.card.propertyId)"><Icon icon="mdi:home-search-outline" width="15" height="15" />View on Property Hub</button>
                          <button type="button" class="dd-hover-btn" @click.stop="goToHub('room', preview.card.propertyId)"><Icon icon="mdi:door" width="15" height="15" />View on Room Hub</button>
                        </div>
                      </div>
                    </div>

                    <div v-else-if="preview.history?.length" class="dd-timeline">
                      <div
                        v-for="(it, i) in preview.history"
                        :key="i"
                        class="dd-tl-item intro-x"
                        :class="{ 'dd-tl-item--active': it.active }"
                      >
                        <div class="dd-tl-node">
                          <span
                            class="dd-tl-dot"
                            :style="it.active ? { background: 'var(--c-success)', borderColor: 'var(--c-success)' } : {}"
                          >
                            <Icon
                              :icon="it.icon || 'mdi:circle'"
                              width="18"
                              height="18"
                              :style="{ color: it.active ? '#fff' : 'var(--c-muted)' }"
                            />
                          </span>
                          <div v-if="i < preview.history.length - 1" class="dd-tl-line"></div>
                        </div>
                        <div class="dd-tl-body">
                          <div class="dd-tl-main">
                            <div class="dd-tl-title-row">
                              <span class="dd-tl-title">{{ it.title }}</span>
                              <span v-if="it.active" class="dd-tl-badge">Current</span>
                            </div>
                            <div v-if="it.desc" class="dd-tl-desc">{{ it.desc }}</div>
                          </div>
                          <div v-if="it.meta" class="dd-tl-time">{{ it.meta }}</div>
                        </div>
                      </div>
                    </div>

                  </q-tab-panel>

                    <q-tab-panel name="documents" class="q-pa-none">
                      <div v-if="preview.files?.length" class="dd-files">
                      <a v-for="(f, i) in preview.files" :key="i" :href="f.url" target="_blank" rel="noopener" class="dd-file">
                        <span class="dd-file-iconwrap">
                          <Icon icon="mdi:file-document-outline" width="22" height="22" />
                        </span>
                        <span class="col min-width-0">
                          <span class="dd-file-name">{{ f.name }}</span>
                          <span class="dd-file-meta">Tap to open</span>
                        </span>
                        <Icon icon="mdi:open-in-new" width="18" height="18" class="dd-file-open" />
                      </a>
                    </div>
                    <div v-else class="dd-empty">No documents uploaded for this account.</div>
                  </q-tab-panel>

                    <q-tab-panel name="activity" class="q-pa-none">
                      <div class="dd-activity">
                        <div
                          v-for="(a, i) in preview.activity"
                          :key="i"
                          class="dd-act-item intro-x"
                        >
                          <div class="dd-act-rail">
                            <span class="dd-act-icon" :style="activityIconStyle(a)">
                              <Icon :icon="a.icon || 'mdi:circle'" width="17" height="17" />
                            </span>
                            <span v-if="preview.activity && i < preview.activity.length - 1" class="dd-act-line"></span>
                          </div>
                          <div class="dd-act-body">
                            <div class="dd-act-text" v-html="a.text"></div>
                            <div v-if="a.time" class="dd-act-time">{{ a.time }}</div>
                          </div>
                        </div>
                      </div>
                    </q-tab-panel>

                    <q-tab-panel name="reviews" class="q-pa-none">
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
                    </q-tab-panel>
                  </q-tab-panels>
                  <div class="dd-tab-foot row items-center justify-end">
                    <span class="cursor-pointer text-weight-bold text-caption text-link">View All</span>
                  </div>
                </div>
                  </template>
              </div>
              </template>
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
                    <Icon icon="mdi:close" width="20" height="20" />
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
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import TabNav from '@/components/ui/TabNav.vue'
import type { StatusTone } from '@/utils/status.config'

export interface PreviewChip {
  text: string
  tone?: StatusTone
  icon?: string
}
export interface PreviewStat {
  label: string
  value: string | number
  sub?: string
  subTone?: StatusTone
}
export interface PreviewDetail {
  label: string
  value?: string
  link?: string
  tone?: StatusTone
  icon?: string
  avatar?: { initials: string }
}
export interface PreviewCardCell {
  label: string
  value?: string
  tone?: StatusTone
  icon?: string
  avatar?: { initials: string; name: string }
}
export interface PreviewCard {
  title: string
  footerLink?: string
  propertyId?: string
  head: { code?: string; title: string; status: string; statusTone?: StatusTone; location?: string }
  cells?: PreviewCardCell[]
}
export interface PreviewActivity {
  text: string
  time: string
  active?: boolean
  icon?: string
  tone?: StatusTone
}
export interface PreviewReview {
  author: string
  rating: number
  comment?: string
  time?: string
}
export interface PreviewHistoryCard {
  icon?: string
  title: string
  status: string
  statusTone?: StatusTone
  active?: boolean
  roomType?: string
  location?: string
  date?: string
  propertyId?: string
}
export interface PreviewFile {
  name: string
  url: string
}
export interface PreviewTimelineItem {
  title: string
  desc?: string
  meta?: string
  tone?: StatusTone
  icon?: string
  active?: boolean
}
export interface PreviewPlacement {
  status: string
  statusTone?: StatusTone
  property: string
  roomType?: string
  landlord?: string
  address?: string
  moveIn?: string
}
export interface DrawerPreview {
  title?: string
  positionLabel?: string
  viewDetailsLabel?: string
  name: string
  avatar: string
  subtitle?: string
  chips?: PreviewChip[]
  meta?: string
  metaIcon?: string
  stats?: PreviewStat[]
  details?: PreviewDetail[]
  placement?: PreviewPlacement
  history?: PreviewTimelineItem[]
  files?: PreviewFile[]
  card?: PreviewCard
  activity?: PreviewActivity[]
  reviews?: PreviewReview[]
  historyCards?: PreviewHistoryCard[]
}

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
    expandedWidth?: string
    expandable?: boolean
    expanded?: boolean
    loading?: boolean
    closeOnBackdrop?: boolean
    anchored?: boolean
    position?: 'left' | 'right'
    /** User-management actions shown in the 3-dots menu (e.g. Suspend, Ban). */
    managementActions?: { label: string; action: string; danger?: boolean }[]
  }>(),
  {
    width: '620px',
    expandedWidth: 'min(1240px, 96vw)',
    expandable: false,
    expanded: false,
    loading: false,
    closeOnBackdrop: true,
    anchored: false,
    position: 'right',
    managementActions: () => [],
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:expanded', value: boolean): void
  (e: 'view-details'): void
  (e: 'manage', action: string): void
  (e: 'closed'): void
}>()

const leftDetails = computed(() => {
  const d = props.preview?.details ?? []
  return d.slice(0, Math.ceil(d.length / 2))
})
const rightDetails = computed(() => {
  const d = props.preview?.details ?? []
  return d.slice(Math.ceil(d.length / 2))
})

const ddTab = ref<string>('history')

const showHistoryTab = computed(() => !!(props.preview?.card || props.preview?.history?.length || props.preview?.historyCards?.length))
const showDocsTab = computed(() => props.preview?.files !== undefined && !props.loading)
const showActivityTab = computed(() => !!(props.preview?.activity?.length))
const showReviewsTab = computed(() => props.preview?.reviews !== undefined && !props.loading)
const multiTab = computed(
  () => [showHistoryTab.value, showDocsTab.value, showActivityTab.value, showReviewsTab.value].filter(Boolean).length >= 2
)

const visibleTabs = computed(() => {
  const tabs: string[] = []
  if (showHistoryTab.value) tabs.push('history')
  if (showDocsTab.value) tabs.push('documents')
  if (showActivityTab.value) tabs.push('activity')
  if (showReviewsTab.value) tabs.push('reviews')
  return tabs
})
const currentTab = computed({
  get: () =>
    ddTab.value && visibleTabs.value.includes(ddTab.value)
      ? ddTab.value
      : visibleTabs.value[0] || 'history',
  set: (v: string) => {
    ddTab.value = v
  },
})

const ddTabs = computed(() => {
  const tabs: { name: string; label: string }[] = []
  if (showHistoryTab.value) tabs.push({ name: 'history', label: props.preview?.card?.title || 'Boarding History' })
  if (showDocsTab.value) tabs.push({ name: 'documents', label: 'Documents' })
  if (showActivityTab.value) tabs.push({ name: 'activity', label: 'Activity' })
  if (showReviewsTab.value) tabs.push({ name: 'reviews', label: 'Reviews' })
  return tabs
})

const placementStats = computed(() => {
  const p = props.preview?.placement
  if (!p) return []
  const items: { label: string; value: string }[] = []
  const houses = props.preview?.history?.length ?? 0
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

function close() {
  emit('update:modelValue', false)
}
const router = useRouter()
type HubKind = 'map' | 'property' | 'room'
function goToHub(kind: HubKind, propertyId?: string) {
  if (!propertyId) return
  if (kind === 'map') router.push({ path: '/map-view', query: { property: propertyId } })
  else if (kind === 'property') router.push({ path: '/property-hub', query: { property: propertyId } })
  else router.push({ path: '/room-hub', query: { property: propertyId } })
  close()
}
function onManage(action: string) {
  emit('manage', action)
}
function toggleExpand() {
  emit('update:expanded', !props.expanded)
}
function onBackdropClick() {
  if (props.anchored) return
  if (props.closeOnBackdrop) close()
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close()
}
function onDocClick(e: MouseEvent) {
  if (!props.anchored || !props.modelValue || !props.closeOnBackdrop) return
  const target = e.target as HTMLElement | null
  if (target?.closest('.dd-panel') || target?.closest('.q-menu')) return
  close()
}

const activityToneColors: Record<StatusTone, string> = {
  primary: 'var(--c-primary)',
  success: 'var(--c-success)',
  warning: 'var(--c-warning)',
  danger: 'var(--c-danger)',
  info: 'var(--c-info, var(--c-primary))',
  neutral: 'var(--c-muted)',
}
function activityIconStyle(a: PreviewActivity) {
  const tone = (a.tone && a.tone !== 'neutral' ? a.tone : 'neutral') as StatusTone
  const base = tone === 'neutral' ? 'var(--c-muted)' : activityToneColors[tone]
  return {
    background: `color-mix(in srgb, ${base} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${base} 34%, transparent)`,
    color: base,
  }
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
.dd-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.dd-file:hover {
  border-color: var(--c-primary);
  background: var(--c-surface);
}
.dd-file-iconwrap {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  color: var(--c-primary);
}
.dd-file-name {
  display: block;
  font-weight: 700;
  font-size: 14px;
  color: var(--c-ink);
  line-height: 1.2;
}
.dd-file-meta {
  display: block;
  font-size: 12px;
  color: var(--c-muted);
  margin-top: 2px;
}
.dd-file-open {
  margin-left: auto;
  color: var(--c-muted);
  flex: 0 0 auto;
}
.dd-timeline {
  display: flex;
  flex-direction: column;
}
.dd-tl-head {
  display: flex;
  align-items: center;
}
.dd-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  font-family: var(--font-body);
}
.dd-chip-outline {
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-ink);
}
.dd-chip-status {
  background: color-mix(in srgb, var(--c-success) 14%, transparent);
  color: var(--c-success);
}
.dd-dashed-line {
  border-top: 1px dashed var(--c-border);
  height: 1px;
  margin: 0 12px;
}
.dd-tl-item {
  display: flex;
  align-items: stretch;
}
.dd-tl-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  width: 40px;
  margin-right: 14px;
}
.dd-tl-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px dashed var(--c-border);
  background: var(--c-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  position: relative;
  z-index: 2;
}
.dd-tl-item--active .dd-tl-dot {
  border: 1px solid var(--c-success);
  background: color-mix(in srgb, var(--c-success) 14%, transparent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--c-success) 16%, transparent);
}
.dd-tl-line {
  position: absolute;
  top: 40px;
  bottom: -16px;
  width: 1px;
  background: var(--c-border);
  z-index: 1;
}

/* Boarding-history card timeline (cards, not plain text) ------------ */
.dd-hc-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dd-hc-row {
  display: flex;
  align-items: stretch;
}
.dd-hc-rail {
  position: relative;
  flex: 0 0 40px;
  width: 40px;
  margin-right: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.dd-hc-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  position: relative;
  z-index: 2;
}
.dd-hc-row--active .dd-hc-icon {
  border-color: var(--c-success);
}
.dd-hc-line {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: var(--c-border);
  z-index: 1;
}
.dd-hc-line--down {
  top: 50%;
  bottom: -16px;
}
.dd-hc-line--up {
  top: 0;
  bottom: 50%;
}
.dd-hc-card {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Hover overlay: property quick-links (Map / Property Hub / Room Hub) ----- */
.dd-card {
  position: relative;
}
.dd-card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--c-surface) 82%, transparent);
  backdrop-filter: blur(2px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}
.dd-card:not(.dd-card--linkless):hover .dd-card-overlay {
  opacity: 1;
  pointer-events: auto;
}
.dd-hover-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-text);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.dd-hover-btn:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
  background: var(--c-surface-2);
}
.dd-tl-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex: 1 1 auto;
  padding-bottom: 22px;
}
.dd-tl-main {
  min-width: 0;
}
.dd-tl-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 15px;
  color: var(--c-ink);
  line-height: 1.25;
}
.dd-tl-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dd-tl-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--c-success) 16%, transparent);
  color: var(--c-success);
  border: 1px solid color-mix(in srgb, var(--c-success) 32%, transparent);
  flex: 0 0 auto;
}
.dd-tl-desc {
  font-size: 12.5px;
  color: var(--c-muted);
  margin-top: 3px;
  line-height: 1.4;
}
.dd-tl-time {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--c-muted);
  text-align: right;
  white-space: nowrap;
  padding-top: 2px;
}
/* Activity feed (distinct from the boarding-history timeline) -------- */
.dd-activity {
  display: flex;
  flex-direction: column;
}
.dd-act-item {
  display: flex;
  gap: 12px;
  position: relative;
}
.dd-act-rail {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2px;
}
.dd-act-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  z-index: 2;
}
.dd-act-line {
  position: absolute;
  top: 42px;
  bottom: -12px;
  width: 1px;
  background: var(--c-border);
  z-index: 1;
}
.dd-act-body {
  flex: 1 1 auto;
  min-width: 0;
  padding: 4px 0 16px;
}
.dd-act-text {
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--c-ink);
}
.dd-act-text :deep(strong) {
  font-weight: 700;
  color: var(--c-ink);
}
.dd-act-time {
  font-size: 11.5px;
  color: var(--c-muted);
  margin-top: 3px;
}
.dd-activity .intro-x {
  animation: dd-tl-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.dd-activity .intro-x:nth-child(3) { animation-delay: 0.04s; }
.dd-activity .intro-x:nth-child(4) { animation-delay: 0.08s; }
.dd-activity .intro-x:nth-child(5) { animation-delay: 0.12s; }
.dd-activity .intro-x:nth-child(6) { animation-delay: 0.16s; }
.dd-activity .intro-x:nth-child(7) { animation-delay: 0.20s; }
.dd-activity .intro-x:nth-child(8) { animation-delay: 0.24s; }

.dd-timeline .intro-x {
  animation: dd-tl-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.dd-timeline .intro-x:nth-child(2) { animation-delay: 0.04s; }
.dd-timeline .intro-x:nth-child(3) { animation-delay: 0.08s; }
.dd-timeline .intro-x:nth-child(4) { animation-delay: 0.12s; }
.dd-timeline .intro-x:nth-child(5) { animation-delay: 0.16s; }
.dd-timeline .intro-x:nth-child(6) { animation-delay: 0.20s; }
@keyframes dd-tl-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.dd-empty {
  font-size: 13px;
  color: var(--c-muted);
  padding: 10px 12px;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
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
.dd-surface {
  background: var(--c-surface);
  color: var(--c-text);
  border: 1px solid var(--c-border);
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
.dd-panels {
  flex: 1 1 auto;
  min-height: 0;
  background: transparent;
}
.dd-panels :deep(.q-tab-panel) {
  padding: 16px 0 0 0;
  overflow-y: auto;
}
@media (prefers-reduced-motion: reduce) {
  .dd-rise {
    animation: none;
  }
  .dd-timeline .intro-x {
    animation: none;
  }
  .dd-preview :deep(.q-skeleton) {
    animation: none;
  }
}
.dd-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
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
.dd-tab-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  margin-top: 4px;
  border-top: 1px solid var(--c-border);
  min-height: 20px;
}
.dd-tabs-strip {
  position: relative;
  z-index: 2;
  padding: 0 16px;
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
.bg-surface {
  background: var(--c-surface);
}
.relative-position {
  position: relative;
}
.vertical-line {
  position: absolute;
  top: 24px;
  bottom: -32px;
  left: 11px;
  width: 2px;
  background-color: var(--c-border);
  z-index: 0;
}
.icon-z-index {
  position: relative;
  z-index: 1;
}

/* Shell ---------------------------------------------------------------- */
.dd-backdrop {
  position: fixed;
  inset: 0;
  z-index: 6000;
  background: rgba(16, 32, 28, 0.42);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-start;
  padding: var(--sp-4);
  box-sizing: border-box;
}
.dd-backdrop--static {
  background: transparent;
  backdrop-filter: none;
  pointer-events: none;
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
.dd-fade-enter-active,
.dd-fade-leave-active {
  transition: opacity 0.22s ease;
}
.dd-fade-enter-from,
.dd-fade-leave-to {
  opacity: 0;
}
.dd-slide-enter-active,
.dd-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.dd-slide-enter-from,
.dd-slide-leave-to {
  transform: translateX(-100%);
}
</style>
