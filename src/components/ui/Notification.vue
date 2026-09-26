<template>
  <q-btn flat dense class="notif-trigger relative-position" :aria-label="notificationTriggerLabel">
    <Icon icon="lucide:bell" width="19" height="19" aria-hidden="true" />
    <q-badge v-if="unreadCount > 0" floating class="notif-count" rounded>{{ unreadCount > 9 ? '9+' : unreadCount }}</q-badge>

    <q-menu
      anchor="bottom right"
      self="top right"
      :offset="[0, 12]"
      class="notification-menu"
      style="width: min(390px, calc(100vw - 24px)); max-height: min(610px, calc(100vh - 24px));"
    >
      <section class="notification-popover" aria-labelledby="notification-popover-title">
        <header class="popover-head">
          <h2 id="notification-popover-title">Notifications</h2>
          <!-- The count doubles as the live region the old summary strip was. -->
          <span class="unread-pill" :class="{ 'is-clear': !unreadCount }" role="status" aria-live="polite">
            {{ unreadCount ? `${unreadCount} new` : 'All caught up' }}
          </span>
          <q-btn
            v-if="unreadCount > 0"
            flat
            dense
            no-caps
            class="mark-read-btn"
            label="Mark all read"
            @click="markAllRead"
          />
        </header>

        <div v-if="error" class="popover-error" role="alert">
          <Icon icon="lucide:circle-alert" width="18" height="18" aria-hidden="true" />
          <span>Couldn't load notifications.</span>
          <q-btn flat dense no-caps class="retry-btn" label="Retry" @click="load" />
        </div>

        <div v-else-if="notifications.length" class="popover-list" aria-label="Recent notifications">
          <section v-for="group in groups" :key="group.label" class="day-group">
            <h3 class="day-label">{{ group.label }}</h3>
            <q-list>
              <q-item
                v-for="notif in group.items"
                :key="notif.id"
                clickable
                v-ripple
                v-close-popup
                class="notification-row"
                :class="{ 'is-unread': notif.unread }"
                :aria-label="`${notif.unread ? 'Unread. ' : ''}${notif.typeLabel}: ${notif.title}`"
                @click="open(notif)"
              >
                <q-item-section avatar top class="notif-icon-cell">
                  <!-- Read items drop their colour, so what is new is what is lit. -->
                  <q-avatar
                    :color="notif.unread ? notif.color : undefined"
                    :text-color="notif.unread ? 'white' : undefined"
                    size="32px"
                    class="notif-avatar"
                  >
                    <Icon :icon="notif.icon" width="16" height="16" aria-hidden="true" />
                  </q-avatar>
                </q-item-section>
                <q-item-section class="notif-text">
                  <div class="notification-line">
                    <span class="notification-title" :title="notif.title">{{ notif.title }}</span>
                    <time :datetime="notif.createdAt">{{ notif.time }}</time>
                    <span v-if="notif.unread" class="unread-dot" aria-hidden="true" />
                  </div>
                  <div class="notification-message" :title="notif.body">{{ notif.body }}</div>
                </q-item-section>
              </q-item>
            </q-list>
          </section>
        </div>

        <div v-else class="popover-empty">
          <div class="empty-icon"><Icon icon="lucide:bell-ring" width="24" height="24" aria-hidden="true" /></div>
          <strong>Inbox clear</strong>
          <span>New operational activity will appear here.</span>
        </div>

        <footer class="popover-foot">
          <q-btn flat no-caps class="open-center-btn" @click="viewAll">
            Open notification center <Icon icon="lucide:arrow-right" width="16" height="16" class="q-ml-xs" aria-hidden="true" />
          </q-btn>
        </footer>
      </section>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { groupByDay, useNotifications } from '@/composables/useNotifications'

const router = useRouter()

const { notifications, unreadCount, error, load, open, markAllRead } = useNotifications({
  limit: 20,
  channel: 'notif-bell',
})

const notificationTriggerLabel = computed(() =>
  unreadCount.value
    ? `Open notifications. ${unreadCount.value} unread.`
    : 'Open notifications. No unread notifications.',
)
// The six most recent, under Today / Yesterday / Earlier.
const groups = computed(() => groupByDay(notifications.value.slice(0, 6)))

function viewAll() {
  void router.push('/notifications')
}
</script>

<style scoped>
.notif-trigger { min-width: 42px; min-height: 42px; border: 1px solid var(--c-border); border-radius: 999px !important; background: var(--c-surface-2) !important; color: var(--c-muted) !important; transition: color var(--t-fast), border-color var(--t-fast), background var(--t-fast), transform var(--t-fast); }
.notif-trigger:hover { border-color: var(--c-primary); background: var(--c-primary-soft) !important; color: var(--c-primary) !important; }
.notif-trigger:focus-visible { outline: 3px solid var(--c-primary); outline-offset: 2px; }
.notif-count { display: inline-flex; box-sizing: border-box; top: 1px !important; right: 3px !important; width: 16px; min-width: 16px; height: 16px; align-items: center; justify-content: center; padding: 0; border: 0; border-radius: 50%; background: var(--c-danger); box-shadow: 0 1px 3px color-mix(in srgb, var(--c-danger) 35%, transparent); color: #fff; font-family: var(--font-body); font-size: 9px; font-weight: 800; letter-spacing: 0; line-height: 1; }
/* :global, not :deep — QMenu teleports its content to <body>, outside this
   component's root, so the :deep() form never matched and the popover fell
   back to Quasar's own menu frame. */
:global(.notification-menu) { border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface); box-shadow: var(--shadow-lg); overflow: hidden; }
.notification-popover { display: flex; flex-direction: column; max-height: inherit; }
.popover-head { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-4) var(--sp-4) var(--sp-3); border-bottom: 1px solid var(--c-border); }
.popover-head h2 { margin: 0; font-family: var(--font-display); font-size: 1.125rem; line-height: 1.15; color: var(--c-ink); }
.mark-read-btn { min-height: 30px; margin-left: auto; padding: 0 var(--sp-2); border-radius: var(--radius-sm); color: var(--c-primary); font-size: 11px; font-weight: 700; }
.mark-read-btn:hover { background: var(--c-primary-soft); }
.mark-read-btn:focus-visible, .open-center-btn:focus-visible, .notification-row:focus-visible { outline: 3px solid var(--c-primary); outline-offset: -3px; }
.popover-list { overflow-y: auto; padding-bottom: var(--sp-2); }
.unread-pill { padding: 2px 8px; border-radius: 999px; background: var(--c-primary-soft); color: var(--c-primary); font-size: 10.5px; font-weight: 700; }
.unread-pill.is-clear { background: var(--c-surface-2); color: var(--c-muted); }
.day-label { margin: 0; padding: var(--sp-3) var(--sp-4) var(--sp-1); color: var(--c-muted); font-family: var(--font-body); font-size: 10px; font-weight: 800; letter-spacing: .08em; line-height: 1.2; text-transform: uppercase; }
/* Quasar's avatar column is 56px wide, far more than a 32px icon needs, and a
   flex item won't shrink below its text without min-width: 0 — without it the
   time was pushed off the right edge by a long body line. */
.notif-icon-cell { min-width: 0; padding-right: var(--sp-3); }
/* Quasar gives item sections `.column`, which also sets flex-wrap: wrap — a
   wrapping column sizes to its widest line, so the one-line ellipsis never
   engaged and a long sign-in message pushed the row out to ~875px. */
.notif-text { min-width: 0; flex-wrap: nowrap; }
.notif-avatar { background: var(--c-surface-2); color: var(--c-muted); }
.notification-line { display: flex; align-items: baseline; gap: var(--sp-2); }
.notification-line .notification-title { flex: 1; min-width: 0; }
/* Unread: the lit icon, the heavier title, this dot, and a faint teal wash
   with an accent edge. The wash is kept light on purpose — a full
   primary-soft fill, with several new items, turned the whole popover teal. */
.is-unread .notification-title { font-weight: 800; }
.unread-dot { flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: var(--c-primary); align-self: center; }
.notification-line time { flex-shrink: 0; color: var(--c-muted); font-size: 10.5px; font-weight: 600; }
.popover-error { display: flex; align-items: center; gap: 7px; margin: 0 var(--sp-5) var(--sp-3); padding: 9px var(--sp-3); border: 1px solid var(--c-danger); border-radius: var(--radius-sm); background: var(--c-danger-soft); color: var(--c-danger); font-size: 11px; font-weight: 600; }
.popover-error > span { flex: 1; }
.retry-btn { padding: 0 var(--sp-2); border-radius: var(--radius-sm); color: var(--c-danger); font-size: 11px; font-weight: 700; }
.retry-btn:focus-visible { outline: 3px solid var(--c-danger); outline-offset: -3px; }
.notification-row { min-height: 60px; margin: 1px var(--sp-2); padding: var(--sp-2) var(--sp-2); border-radius: var(--radius-sm); transition: background var(--t-fast); }
.notification-row:hover { background: var(--c-surface-2); }
.notification-row.is-unread { background: color-mix(in srgb, var(--c-primary-soft) 45%, transparent); box-shadow: inset 3px 0 0 var(--c-primary); }
.notification-row.is-unread:hover { background: var(--c-primary-soft); }
.notification-title { overflow: hidden; color: var(--c-ink); font-size: 12.5px; font-weight: 600; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.notification-message { overflow: hidden; margin-top: 2px; color: var(--c-muted); font-size: 11.5px; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
.popover-empty { display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); padding: var(--sp-8) var(--sp-5); color: var(--c-muted); font-size: 11px; text-align: center; }
.popover-empty strong { color: var(--c-ink); font-family: var(--font-display); font-size: 14px; }
.empty-icon { display: grid; width: 46px; height: 46px; place-items: center; border-radius: 50%; background: var(--c-success-soft); color: var(--c-success); }
.popover-foot { padding: var(--sp-2); border-top: 1px solid var(--c-border); background: var(--c-surface); }
.open-center-btn { width: 100%; min-height: 40px; border-radius: var(--radius-sm); color: var(--c-primary); font-size: 12px; font-weight: 700; }
.open-center-btn:hover { background: var(--c-primary-soft); }
@media (prefers-reduced-motion: reduce) { .notif-trigger, .notification-row { transition: none; } }
</style>
