<template>
  <q-page class="notification-page">
    <main class="notification-center" aria-labelledby="notifications-title">
      <header class="center-head">
        <div class="center-title">
          <p class="section-kicker">Operational awareness</p>
          <h1 id="notifications-title">Notification center</h1>
          <p>Review activity requiring follow-up, then open the related record directly.</p>
        </div>
        <div class="center-actions">
          <span class="unread-stat" role="status" aria-live="polite"><b>{{ unreadCount }}</b> unread</span>
          <q-btn v-if="unreadCount" flat no-caps class="mark-all-btn" :loading="markingAll" @click="markAllRead">
            <Icon icon="lucide:check-check" width="17" height="17" class="q-mr-xs" aria-hidden="true" />Mark all read
          </q-btn>
        </div>
      </header>

      <section v-if="loading" class="notification-card notification-loading" aria-label="Loading notifications">
        <div v-for="item in 5" :key="item" class="notification-skeleton"><span /><div><i /><b /></div></div>
      </section>

      <section v-else-if="error" class="notification-card notification-error" role="alert">
        <Icon icon="lucide:circle-alert" width="22" height="22" aria-hidden="true" />
        <div><strong>Notifications could not be loaded.</strong><span>{{ error }}</span></div>
        <q-btn flat no-caps color="primary" label="Try again" @click="load" />
      </section>

      <template v-else-if="notifications.length">
        <section v-if="unreadNotifications.length" class="notification-card" aria-labelledby="attention-title">
          <header class="list-head">
            <div><span class="section-kicker">Priority queue</span><h2 id="attention-title">Needs attention</h2></div>
            <span>{{ unreadNotifications.length }} unread</span>
          </header>
          <q-list class="center-list">
            <q-item v-for="notification in unreadNotifications" :key="notification.id" clickable v-ripple class="center-row is-unread" @click="open(notification)">
              <q-item-section avatar top><q-avatar :color="notification.color" text-color="white" size="42px" font-size="20px"><Icon :icon="notification.icon" width="20" height="20" aria-hidden="true" /></q-avatar></q-item-section>
              <q-item-section>
                <div class="row-meta"><span>{{ notification.typeLabel }}</span><time :datetime="notification.createdAt">{{ notification.time }}</time></div>
                <q-item-label class="row-title">{{ notification.title }}</q-item-label>
                <q-item-label caption class="row-body">{{ notification.body }}</q-item-label>
              </q-item-section>
              <q-item-section side class="row-action"><span>Open</span><Icon icon="lucide:arrow-right" width="17" height="17" aria-hidden="true" /></q-item-section>
            </q-item>
          </q-list>
        </section>

        <section v-if="readNotifications.length" class="notification-card" :class="{ 'only-list': !unreadNotifications.length }" aria-labelledby="earlier-title">
          <header class="list-head">
            <div><span class="section-kicker">Activity log</span><h2 id="earlier-title">Earlier</h2></div>
            <span>{{ readNotifications.length }} read</span>
          </header>
          <q-list class="center-list">
            <q-item v-for="notification in readNotifications" :key="notification.id" clickable v-ripple class="center-row" @click="open(notification)">
              <q-item-section avatar top><q-avatar :color="notification.color" text-color="white" size="42px" font-size="20px"><Icon :icon="notification.icon" width="20" height="20" aria-hidden="true" /></q-avatar></q-item-section>
              <q-item-section>
                <div class="row-meta"><span>{{ notification.typeLabel }}</span><time :datetime="notification.createdAt">{{ notification.time }}</time></div>
                <q-item-label class="row-title">{{ notification.title }}</q-item-label>
                <q-item-label caption class="row-body">{{ notification.body }}</q-item-label>
              </q-item-section>
              <q-item-section side class="row-action"><span>Open</span><Icon icon="lucide:arrow-right" width="17" height="17" aria-hidden="true" /></q-item-section>
            </q-item>
          </q-list>
        </section>
      </template>

      <section v-else class="notification-card empty-state">
        <div class="empty-mark"><Icon icon="lucide:bell-ring" width="31" height="31" aria-hidden="true" /></div>
        <p class="section-kicker">No follow-up needed</p>
        <h2>Your notification center is clear.</h2>
        <p>New verification requests, support tickets, accommodations, payments, and lease activity will appear here.</p>
      </section>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { supabase } from '@/utils/supabase'
import { getTimeAgo } from '@/utils/format'
import { notificationStyle } from '@/utils/notificationStyle'
import { notificationTarget } from '@/utils/notificationTarget'

interface NotificationItem {
  id: string
  title: string
  body: string
  time: string
  createdAt: string
  icon: string
  color: string
  typeLabel: string
  unread: boolean
  linkUrl: string
}

const router = useRouter()
const loading = ref(true)
const markingAll = ref(false)
const error = ref('')
const notifications = ref<NotificationItem[]>([])
const unreadNotifications = computed(() => notifications.value.filter((notification) => notification.unread))
const readNotifications = computed(() => notifications.value.filter((notification) => !notification.unread))
const unreadCount = computed(() => unreadNotifications.value.length)

function typeLabel(type: string) {
  return type ? type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'System'
}

function mapRow(row: any): NotificationItem {
  const style = notificationStyle(row.type)
  return {
    id: row.id,
    title: row.title || 'Notification',
    body: row.body || 'No additional details were provided.',
    time: getTimeAgo(row.created_at),
    createdAt: row.created_at || '',
    icon: style.icon,
    color: style.color,
    typeLabel: typeLabel(row.type),
    unread: !row.read_at,
    linkUrl: row.link_url || '',
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    const { data, error: queryError } = await supabase
      .from('notifications')
      .select('id, title, body, type, link_url, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (queryError) throw queryError
    notifications.value = (data ?? []).map(mapRow)
  } catch (caught: any) {
    error.value = caught?.message || 'Check your connection, then try again.'
  } finally {
    loading.value = false
  }
}

async function open(notification: NotificationItem) {
  if (notification.unread) {
    notification.unread = false
    try {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notification.id)
    } catch (caught: any) {
      console.warn('Could not mark notification read:', caught?.message)
    }
  }
  await router.push(notificationTarget(notification.linkUrl))
}

async function markAllRead() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user || markingAll.value) return
  markingAll.value = true
  notifications.value.forEach((notification) => (notification.unread = false))
  try {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null)
  } catch (caught: any) {
    console.warn('Could not mark all read:', caught?.message)
  } finally {
    markingAll.value = false
  }
}

let channel: any = null
onMounted(async () => {
  await load()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return
  channel = supabase
    .channel('notif-page')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
      (payload: any) => { notifications.value = [mapRow(payload.new), ...notifications.value] },
    )
    .subscribe()
})
onUnmounted(() => { if (channel) supabase.removeChannel(channel) })
</script>

<style scoped>
.notification-page { min-height: 100%; padding: clamp(var(--sp-4), 3vw, var(--sp-8)); background: var(--c-bg); }
.notification-center { width: min(100%, 980px); margin: 0 auto; }
.center-head { display: flex; align-items: end; justify-content: space-between; gap: var(--sp-5); margin-bottom: var(--sp-6); }
.section-kicker { margin: 0; color: var(--c-muted); font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.center-title h1 { margin: 3px 0 0; color: var(--c-ink); font-family: var(--font-display); font-size: clamp(1.7rem, 1.35rem + 1.1vw, 2.25rem); letter-spacing: -.045em; line-height: 1.08; }
.center-title > p:last-child { max-width: 540px; margin: var(--sp-2) 0 0; color: var(--c-muted); font-size: 13px; line-height: 1.5; }
.center-actions { display: flex; align-items: center; gap: var(--sp-3); flex-shrink: 0; }
.unread-stat { display: inline-flex; align-items: baseline; gap: 5px; color: var(--c-muted); font-size: 12px; font-weight: 600; white-space: nowrap; }
.unread-stat b { color: var(--c-primary); font-family: var(--font-display); font-size: 1.45rem; line-height: 1; }
.mark-all-btn { min-height: 40px; padding: 0 var(--sp-3); border: 1px solid var(--c-border); border-radius: var(--radius-sm); color: var(--c-primary); font-size: 12px; font-weight: 700; }
.mark-all-btn:hover { border-color: var(--c-primary); background: var(--c-primary-soft); }
.mark-all-btn:focus-visible, .center-row:focus-visible { outline: 3px solid var(--c-primary); outline-offset: -3px; }
.notification-card { overflow: hidden; margin-top: var(--sp-4); border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface); box-shadow: var(--shadow-sm); }
.notification-card:first-of-type { margin-top: 0; }
.list-head { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); padding: var(--sp-4) var(--sp-5); border-bottom: 1px solid var(--c-border); background: var(--c-surface-2); }
.list-head h2 { margin: 3px 0 0; color: var(--c-ink); font-family: var(--font-display); font-size: 1rem; line-height: 1.1; }
.list-head > span { padding: 4px 8px; border-radius: 999px; background: var(--c-surface); color: var(--c-muted); font-family: var(--font-mono); font-size: 10px; font-weight: 700; white-space: nowrap; }
.center-row { position: relative; min-height: 92px; padding: var(--sp-4) var(--sp-5); border-left: 4px solid transparent; transition: background var(--t-fast), border-color var(--t-fast); }
.center-row + .center-row { border-top: 1px solid var(--c-border); }
.center-row:hover { background: var(--c-surface-2); }
.center-row.is-unread { border-left-color: var(--c-primary); background: color-mix(in srgb, var(--c-primary-soft) 48%, var(--c-surface)); }
.row-meta { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); margin-bottom: var(--sp-1); }
.row-meta > span { color: var(--c-primary); font-size: 10px; font-weight: 800; letter-spacing: .075em; text-transform: uppercase; }
.row-meta time { flex-shrink: 0; color: var(--c-muted); font-size: 11px; font-weight: 600; }
.row-title { overflow: hidden; color: var(--c-ink); font-size: 14px; font-weight: 700; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
.row-body { display: -webkit-box; overflow: hidden; max-width: 690px; margin-top: 4px; color: var(--c-text) !important; font-size: 12px; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.row-action { display: flex; flex-direction: row; align-items: center; gap: 3px; padding-left: var(--sp-4); color: var(--c-primary); font-size: 11px; font-weight: 700; }
.notification-loading { padding: var(--sp-2) var(--sp-5); }
.notification-skeleton { display: flex; align-items: center; gap: var(--sp-3); min-height: 80px; border-bottom: 1px solid var(--c-border); }
.notification-skeleton:last-child { border-bottom: 0; }
.notification-skeleton > span, .notification-skeleton i, .notification-skeleton b { display: block; overflow: hidden; border-radius: 999px; background: linear-gradient(90deg, var(--c-surface-2), var(--c-border), var(--c-surface-2)); background-size: 200% 100%; animation: shimmer 1.3s ease infinite; }
.notification-skeleton > span { width: 42px; height: 42px; }
.notification-skeleton > div { display: flex; flex: 1; flex-direction: column; gap: 8px; }
.notification-skeleton i { width: 34%; height: 10px; }
.notification-skeleton b { width: min(76%, 460px); height: 13px; }
.notification-error { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-5); color: var(--c-danger); }
.notification-error > div { display: flex; flex: 1; flex-direction: column; gap: 2px; }
.notification-error strong { font-size: 13px; }
.notification-error span { color: var(--c-muted); font-size: 12px; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: clamp(var(--sp-8), 7vw, 72px) var(--sp-5); text-align: center; }
.empty-mark { display: grid; width: 60px; height: 60px; margin-bottom: var(--sp-4); place-items: center; border-radius: 50%; background: var(--c-success-soft); color: var(--c-success); }
.empty-state h2 { margin: var(--sp-2) 0 0; color: var(--c-ink); font-family: var(--font-display); font-size: 1.25rem; }
.empty-state > p:last-child { max-width: 420px; margin: var(--sp-2) 0 0; color: var(--c-muted); font-size: 13px; line-height: 1.5; }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (max-width: 600px) { .center-head { align-items: flex-start; flex-direction: column; } .center-actions { width: 100%; justify-content: space-between; } .center-row { padding: var(--sp-3) var(--sp-3); } .row-action span { display: none; } .row-action { padding-left: var(--sp-2); } .row-body { -webkit-line-clamp: 3; } }
@media (prefers-reduced-motion: reduce) { .center-row { transition: none; } .notification-skeleton > span, .notification-skeleton i, .notification-skeleton b { animation: none; } }
</style>
