<template>
  <q-page class="notification-page">
    <!-- Inbox layout: type filters on the left, the bell popover's day-grouped
         list on the right at full width. The header bar already names the page
         and the Unread filter carries the count, so the only thing above the
         list is the bulk action, and only while there is something to mark. -->
    <main class="notification-center" aria-label="Notifications">
      <header v-if="unreadCount" class="center-head">
        <q-btn flat no-caps class="mark-all-btn" :loading="markingAll" @click="markAllRead">
          <Icon icon="lucide:check-check" width="17" height="17" class="q-mr-xs" aria-hidden="true" />Mark all read
        </q-btn>
      </header>

      <div class="center-body">
        <nav class="filter-card" aria-label="Filter notifications">
          <button
            v-for="(f, i) in filters"
            :key="f.key"
            type="button"
            class="filter-row"
            :class="{ active: filter === f.key, 'after-rule': i === 1 }"
            :aria-pressed="filter === f.key"
            @click="filter = f.key"
          >
            <Icon :icon="f.icon" width="17" height="17" aria-hidden="true" />
            <span class="filter-label">{{ f.label }}</span>
            <span class="filter-count">{{ f.count }}</span>
          </button>
        </nav>

        <section class="list-card" aria-live="polite">
          <div v-if="loading" class="notification-loading" aria-label="Loading notifications">
            <div v-for="item in 6" :key="item" class="notification-skeleton"><span /><div><i /><b /></div></div>
          </div>

          <div v-else-if="error" class="notification-error" role="alert">
            <Icon icon="lucide:circle-alert" width="22" height="22" aria-hidden="true" />
            <div><strong>Notifications could not be loaded.</strong><span>{{ error }}</span></div>
            <q-btn flat no-caps color="primary" label="Try again" @click="load" />
          </div>

          <template v-else-if="visible.length">
            <section v-for="group in groups" :key="group.label" class="day-group">
              <h2 class="day-label">{{ group.label }} <span>· {{ group.items.length }}</span></h2>
              <q-list>
                <q-item
                  v-for="notification in group.items"
                  :key="notification.id"
                  clickable
                  v-ripple
                  class="center-row"
                  :class="{ 'is-unread': notification.unread }"
                  :aria-label="`${notification.unread ? 'Unread. ' : ''}${notification.typeLabel}: ${notification.title}`"
                  @click="open(notification)"
                >
                  <q-item-section avatar top class="row-icon-cell">
                    <q-avatar
                      :color="notification.unread ? notification.color : undefined"
                      :text-color="notification.unread ? 'white' : undefined"
                      size="36px"
                      class="row-avatar"
                    >
                      <Icon :icon="notification.icon" width="18" height="18" aria-hidden="true" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section class="row-text">
                    <div class="row-line">
                      <span class="row-title" :title="notification.title">{{ notification.title }}</span>
                      <span class="row-type">{{ notification.typeLabel }}</span>
                      <time :datetime="notification.createdAt">{{ notification.time }}</time>
                      <span v-if="notification.unread" class="unread-dot" aria-hidden="true" />
                    </div>
                    <div class="row-body" :title="notification.body">{{ notification.body || 'No additional details were provided.' }}</div>
                  </q-item-section>
                  <q-item-section side class="row-go">
                    <Icon icon="lucide:chevron-right" width="18" height="18" aria-hidden="true" />
                  </q-item-section>
                </q-item>
              </q-list>
            </section>
          </template>

          <div v-else class="empty-state">
            <div class="empty-mark"><Icon icon="lucide:bell-ring" width="28" height="28" aria-hidden="true" /></div>
            <h2>{{ notifications.length ? 'Nothing here' : 'Your notification center is clear' }}</h2>
            <p v-if="notifications.length">No {{ filter === 'unread' ? 'unread' : activeLabel.toLowerCase() }} notifications right now.</p>
            <p v-else>New verification requests, support tickets, accommodations, payments, and lease activity will appear here.</p>
          </div>
        </section>
      </div>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { groupByDay, useNotifications } from '@/composables/useNotifications'

const {
  notifications,
  unreadCount,
  loading,
  error,
  marking: markingAll,
  load,
  open,
  markAllRead,
} = useNotifications({ limit: 100, channel: 'notif-page' })

/** 'all', 'unread', or a type label ("Verification", "Payment", …). */
const filter = ref('all')

// Type filters come from what is actually in the list, not a fixed set, so a
// new notification type shows up here without anyone touching this page. The
// icon is the first item's — every item of a type shares one (notificationStyle).
const filters = computed(() => {
  const types = new Map<string, { icon: string; count: number }>()
  for (const n of notifications.value) {
    const t = types.get(n.typeLabel)
    if (t) t.count++
    else types.set(n.typeLabel, { icon: n.icon, count: 1 })
  }
  return [
    { key: 'all', label: 'All', icon: 'lucide:inbox', count: notifications.value.length },
    { key: 'unread', label: 'Unread', icon: 'lucide:bell-dot', count: unreadCount.value },
    ...[...types.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([label, t]) => ({ key: label, label, icon: t.icon, count: t.count })),
  ]
})

const activeLabel = computed(() => filters.value.find((f) => f.key === filter.value)?.label ?? 'All')

const visible = computed(() => {
  if (filter.value === 'all') return notifications.value
  if (filter.value === 'unread') return notifications.value.filter((n) => n.unread)
  return notifications.value.filter((n) => n.typeLabel === filter.value)
})

const groups = computed(() => groupByDay(visible.value))
</script>

<style scoped>
.notification-page { min-height: 100%; padding: var(--sp-4) clamp(var(--sp-4), 2vw, var(--sp-6)) var(--sp-6); background: var(--c-bg); }
.notification-center { width: min(100%, 1120px); margin: 0 auto; }

.center-head { display: flex; align-items: center; justify-content: flex-end; gap: var(--sp-4); min-height: 40px; margin-bottom: var(--sp-4); }
.mark-all-btn { min-height: 38px; padding: 0 var(--sp-3); border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-surface); color: var(--c-primary); font-size: 12px; font-weight: 700; }
.mark-all-btn:hover { border-color: var(--c-primary); background: var(--c-primary-soft); }

.center-body { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: var(--sp-4); align-items: start; }

/* ---- Filters ---- */
/* Sticks below the floating header (MainLayout: 6px margin + 66px bar = 72px)
   with a 12px gap, so the filters stay in reach down a 100-item list. */
.filter-card { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 2px; padding: var(--sp-2); border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface); box-shadow: var(--shadow-sm); }
.filter-row { display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 10px; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--c-muted); cursor: pointer; font: inherit; text-align: left; transition: background var(--t-fast), color var(--t-fast); }
.filter-row:hover:not(.active) { background: var(--c-surface-2); color: var(--c-ink); }
.filter-row.active { background: var(--c-primary-soft); color: var(--c-primary); }
.filter-row:focus-visible { outline: 2px solid var(--c-primary); outline-offset: -2px; }
/* A rule under Unread splits the two views from the type filters. */
.filter-row.after-rule { position: relative; margin-bottom: 9px; }
.filter-row.after-rule::after { content: ''; position: absolute; right: 4px; bottom: -6px; left: 4px; height: 1px; background: var(--c-border); }
.filter-label { flex: 1; min-width: 0; overflow: hidden; font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.filter-count { color: inherit; font-family: var(--font-mono); font-size: 11px; font-weight: 700; opacity: .8; }

/* ---- List ---- */
.list-card { overflow: hidden; padding-bottom: var(--sp-2); border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface); box-shadow: var(--shadow-sm); }
.day-label { margin: 0; padding: var(--sp-4) var(--sp-5) var(--sp-2); color: var(--c-muted); font-family: var(--font-body); font-size: 10.5px; font-weight: 800; letter-spacing: .08em; line-height: 1.2; text-transform: uppercase; }
.day-label span { font-weight: 600; letter-spacing: 0; }

.center-row { min-height: 64px; margin: 1px var(--sp-2); padding: var(--sp-2) var(--sp-3); border-radius: var(--radius-sm); transition: background var(--t-fast); }
.center-row:hover { background: var(--c-surface-2); }
/* Same highlight as the bell popover: a faint teal wash and an accent edge,
   kept light so a long unread run does not turn the whole card teal. */
.center-row.is-unread { background: color-mix(in srgb, var(--c-primary-soft) 45%, transparent); box-shadow: inset 3px 0 0 var(--c-primary); }
.center-row.is-unread:hover { background: var(--c-primary-soft); }
.center-row:focus-visible { outline: 2px solid var(--c-primary); outline-offset: -2px; }

.row-icon-cell { min-width: 0; padding-right: var(--sp-3); }
.row-avatar { background: var(--c-surface-2); color: var(--c-muted); }
/* Quasar's `.column` sections also wrap, which sizes them to the widest line
   and defeats the ellipsis — see the same note in Notification.vue. */
.row-text { min-width: 0; flex-wrap: nowrap; }
.row-line { display: flex; align-items: baseline; gap: var(--sp-2); }
.row-title { flex: 0 1 auto; min-width: 0; overflow: hidden; color: var(--c-ink); font-size: 13.5px; font-weight: 600; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.is-unread .row-title { font-weight: 800; }
.row-type { flex-shrink: 0; margin-right: auto; padding: 1px 7px; border-radius: 999px; background: var(--c-surface-2); color: var(--c-muted); font-size: 10px; font-weight: 700; }
.row-line time { flex-shrink: 0; color: var(--c-muted); font-size: 11px; font-weight: 600; }
.unread-dot { flex-shrink: 0; align-self: center; width: 7px; height: 7px; border-radius: 50%; background: var(--c-primary); }
.row-body { overflow: hidden; margin-top: 3px; color: var(--c-muted); font-size: 12px; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
.row-go { padding-left: var(--sp-3); color: var(--c-muted); opacity: 0; transition: opacity var(--t-fast); }
.center-row:hover .row-go, .center-row:focus-visible .row-go { opacity: 1; color: var(--c-primary); }

/* ---- States ---- */
.notification-loading { padding: var(--sp-2) var(--sp-5); }
.notification-skeleton { display: flex; align-items: center; gap: var(--sp-3); min-height: 64px; }
.notification-skeleton > span, .notification-skeleton i, .notification-skeleton b { display: block; overflow: hidden; border-radius: 999px; background: linear-gradient(90deg, var(--c-surface-2), var(--c-border), var(--c-surface-2)); background-size: 200% 100%; animation: shimmer 1.3s ease infinite; }
.notification-skeleton > span { width: 36px; height: 36px; }
.notification-skeleton > div { display: flex; flex: 1; flex-direction: column; gap: 8px; }
.notification-skeleton i { width: 34%; height: 10px; }
.notification-skeleton b { width: min(76%, 460px); height: 12px; }
.notification-error { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-5); color: var(--c-danger); }
.notification-error > div { display: flex; flex: 1; flex-direction: column; gap: 2px; }
.notification-error strong { font-size: 13px; }
.notification-error span { color: var(--c-muted); font-size: 12px; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: clamp(var(--sp-8), 6vw, 64px) var(--sp-5); text-align: center; }
.empty-mark { display: grid; width: 56px; height: 56px; margin-bottom: var(--sp-3); place-items: center; border-radius: 50%; background: var(--c-success-soft); color: var(--c-success); }
.empty-state h2 { margin: 0; color: var(--c-ink); font-family: var(--font-display); font-size: 1.15rem; }
.empty-state p { max-width: 420px; margin: var(--sp-2) 0 0; color: var(--c-muted); font-size: 13px; line-height: 1.5; }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (max-width: 760px) {
  .center-body { grid-template-columns: minmax(0, 1fr); }
  .filter-card { position: static; flex-direction: row; overflow-x: auto; }
  .filter-row { flex-shrink: 0; }
  .filter-row.after-rule { margin-bottom: 0; }
  .filter-row.after-rule::after { display: none; }
  .row-type { display: none; }
}
@media (prefers-reduced-motion: reduce) { .center-row, .row-go { transition: none; } .notification-skeleton > span, .notification-skeleton i, .notification-skeleton b { animation: none; } }
</style>
