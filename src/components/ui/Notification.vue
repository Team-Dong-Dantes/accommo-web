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
          <div>
            <h2 id="notification-popover-title">Notifications</h2>
          </div>
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

        <div class="popover-summary" role="status" aria-live="polite">
          <Icon :icon="unreadCount ? 'lucide:bell-dot' : 'lucide:circle-check'" width="17" height="17" aria-hidden="true" />
          <span>{{ inboxSummary }}</span>
        </div>

        <div v-if="error" class="popover-error" role="alert">
          <Icon icon="lucide:circle-alert" width="18" height="18" aria-hidden="true" />
          <span>Couldn't load notifications.</span>
          <q-btn flat dense no-caps class="retry-btn" label="Retry" @click="load" />
        </div>

        <q-list v-else-if="notifications.length" class="popover-list" aria-label="Recent notifications">
          <q-item
            v-for="notif in notifications.slice(0, 6)"
            :key="notif.id"
            clickable
            v-ripple
            v-close-popup
            class="notification-row"
            :class="{ 'is-unread': notif.unread }"
            @click="open(notif)"
          >
            <q-item-section avatar top>
              <q-avatar :color="notif.color" text-color="white" size="34px" font-size="17px">
                <Icon :icon="notif.icon" width="17" height="17" aria-hidden="true" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <div class="notification-meta">
                <span class="notification-type">{{ notif.typeLabel }}</span>
                <time :datetime="notif.createdAt">{{ notif.time }}</time>
              </div>
              <q-item-label class="notification-title">{{ notif.title }}</q-item-label>
              <q-item-label caption class="notification-message">{{ notif.body }}</q-item-label>
            </q-item-section>
            <q-item-section side top class="notification-side">
              <span v-if="notif.unread" class="unread-dot" aria-label="Unread" />
              <Icon icon="lucide:chevron-right" width="17" height="17" aria-hidden="true" />
            </q-item-section>
          </q-item>
        </q-list>

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
import { useNotifications } from '@/composables/useNotifications'

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
const inboxSummary = computed(() =>
  unreadCount.value
    ? `${unreadCount.value} item${unreadCount.value === 1 ? '' : 's'} need${unreadCount.value === 1 ? 's' : ''} your attention`
    : 'You are up to date',
)

function viewAll() {
  void router.push('/notifications')
}
</script>

<style scoped>
.notif-trigger { min-width: 42px; min-height: 42px; border: 1px solid var(--c-border); border-radius: 999px !important; background: var(--c-surface-2) !important; color: var(--c-muted) !important; transition: color var(--t-fast), border-color var(--t-fast), background var(--t-fast), transform var(--t-fast); }
.notif-trigger:hover { border-color: var(--c-primary); background: var(--c-primary-soft) !important; color: var(--c-primary) !important; }
.notif-trigger:focus-visible { outline: 3px solid var(--c-primary); outline-offset: 2px; }
.notif-count { display: inline-flex; box-sizing: border-box; top: 1px !important; right: 3px !important; width: 16px; min-width: 16px; height: 16px; align-items: center; justify-content: center; padding: 0; border: 0; border-radius: 50%; background: var(--c-danger); box-shadow: 0 1px 3px color-mix(in srgb, var(--c-danger) 35%, transparent); color: #fff; font-family: var(--font-body); font-size: 9px; font-weight: 800; letter-spacing: 0; line-height: 1; }
:deep(.notification-menu) { border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface); box-shadow: var(--shadow-lg); overflow: hidden; }
.notification-popover { display: flex; flex-direction: column; max-height: inherit; }
.popover-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--sp-3); padding: var(--sp-5) var(--sp-5) var(--sp-3); }
.popover-head h2 { margin: 0; font-family: var(--font-display); font-size: 1.125rem; line-height: 1.15; color: var(--c-ink); }
.mark-read-btn { min-height: 34px; margin-top: -4px; padding: 0 var(--sp-2); border-radius: var(--radius-sm); color: var(--c-primary); font-size: 11px; font-weight: 700; }
.mark-read-btn:hover { background: var(--c-primary-soft); }
.mark-read-btn:focus-visible, .open-center-btn:focus-visible, .notification-row:focus-visible { outline: 3px solid var(--c-primary); outline-offset: -3px; }
.popover-summary { display: flex; align-items: center; gap: 7px; margin: 0 var(--sp-5) var(--sp-2); padding: 9px var(--sp-3); border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-surface-2); color: var(--c-muted); font-size: 11px; font-weight: 600; }
.popover-summary .iconify { color: var(--c-primary); }
.popover-list { overflow-y: auto; padding: var(--sp-2) 0; }
.popover-error { display: flex; align-items: center; gap: 7px; margin: 0 var(--sp-5) var(--sp-3); padding: 9px var(--sp-3); border: 1px solid var(--c-danger); border-radius: var(--radius-sm); background: var(--c-danger-soft); color: var(--c-danger); font-size: 11px; font-weight: 600; }
.popover-error > span { flex: 1; }
.retry-btn { padding: 0 var(--sp-2); border-radius: var(--radius-sm); color: var(--c-danger); font-size: 11px; font-weight: 700; }
.retry-btn:focus-visible { outline: 3px solid var(--c-danger); outline-offset: -3px; }
.notification-row { position: relative; min-height: 76px; padding: var(--sp-3) var(--sp-4); border-left: 3px solid transparent; transition: background var(--t-fast), border-color var(--t-fast); }
.notification-row:hover { background: var(--c-surface-2); }
.notification-row.is-unread { border-left-color: var(--c-primary); background: color-mix(in srgb, var(--c-primary-soft) 52%, var(--c-surface)); }
.notification-meta { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2); margin-bottom: 3px; }
.notification-type { overflow: hidden; color: var(--c-primary); font-size: 9px; font-weight: 800; letter-spacing: .08em; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
.notification-meta time { flex-shrink: 0; color: var(--c-muted); font-size: 10px; font-weight: 600; }
.notification-title { overflow: hidden; color: var(--c-ink); font-size: 12px; font-weight: 700; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.notification-message { display: -webkit-box; overflow: hidden; margin-top: 3px; color: var(--c-text) !important; font-size: 11px; line-height: 1.38; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.notification-side { min-width: 16px; padding-left: var(--sp-1); color: var(--c-muted); }
.unread-dot { width: 7px; height: 7px; margin: 3px 1px 10px 0; border-radius: 50%; background: var(--c-danger); box-shadow: 0 0 0 3px var(--c-danger-soft); }
.popover-empty { display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); padding: var(--sp-8) var(--sp-5); color: var(--c-muted); font-size: 11px; text-align: center; }
.popover-empty strong { color: var(--c-ink); font-family: var(--font-display); font-size: 14px; }
.empty-icon { display: grid; width: 46px; height: 46px; place-items: center; border-radius: 50%; background: var(--c-success-soft); color: var(--c-success); }
.popover-foot { padding: var(--sp-2); border-top: 1px solid var(--c-border); background: var(--c-surface); }
.open-center-btn { width: 100%; min-height: 40px; border-radius: var(--radius-sm); color: var(--c-primary); font-size: 12px; font-weight: 700; }
.open-center-btn:hover { background: var(--c-primary-soft); }
@media (prefers-reduced-motion: reduce) { .notif-trigger, .notification-row { transition: none; } }
</style>
