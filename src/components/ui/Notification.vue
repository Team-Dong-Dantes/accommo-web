<template>
  <q-btn flat dense class="notif-capsule relative-position" style="border-radius: 999px;">
    <Icon icon="mdi:bell" width="18" height="18" />

    <q-badge v-if="unreadCount > 0" color="red" floating rounded style="top: 0px; right: 0px; font-weight: bold;">
      {{ unreadCount }}
    </q-badge>

    <q-menu anchor="bottom right" self="top right" :offset="[0, 12]"
      style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 340px; max-height: 80vh;">
      <div class="row items-center justify-between q-pa-md border-bottom bg-surface sticky-top z-top">
        <div class="text-weight-bold text-subtitle1" style="line-height: 1;">Notifications</div>
        <q-btn v-if="unreadCount > 0" flat dense size="11px" color="primary" label="Mark all as read"
          @click="markAllRead" class="text-weight-bold" />
      </div>

      <q-list class="q-py-xs">
        <q-item v-for="notif in notifications" :key="notif.id" clickable v-ripple
          :class="notif.unread ? 'bg-primary-1' : ''" @click="markRead(notif)" class="q-pa-md transition-bg">
          <q-item-section avatar>
            <q-avatar :color="notif.color" text-color="white" size="40px" font-size="20px">
              <Icon :icon="notif.icon" width="20" height="20" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-bold" style="font-size: 13px; line-height: 1.3;">{{ notif.title
              }}</q-item-label>
            <q-item-label caption class="text-ink q-mt-xs" style="font-size: 11px; line-height: 1.4;">{{
              notif.message }}</q-item-label>
            <q-item-label caption class="text-muted q-mt-xs" style="font-size: 10px; font-weight: 600;">{{ notif.time
              }}</q-item-label>
          </q-item-section>

          <q-item-section side v-if="notif.unread" class="justify-center">
            <div class="unread-dot bg-red-5"></div>
          </q-item-section>
        </q-item>

        <q-item v-if="notifications.length === 0" class="q-pa-lg flex flex-center">
          <div class="text-muted text-center">
            <Icon icon="mdi:bell-off-outline" width="40" height="40" class="q-mb-sm" />
            <div style="font-size: 12px; font-weight: 600;">You're all caught up!</div>
          </div>
        </q-item>
      </q-list>

      <div class="q-pa-sm text-center border-top bg-surface sticky-bottom">
  <q-btn flat dense color="primary" label="View All Notifications" class="full-width text-weight-bold"
    style="font-size: 12px;" @click="viewAll" />
      </div>
    </q-menu>

  </q-btn>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { getTimeAgo } from '@/utils/format'
import { notificationStyle } from '@/utils/notificationStyle'

const router = useRouter()

interface Notif {
  id: string
  title: string
  message: string
  time: string
  icon: string
  color: string
  unread: boolean
  linkUrl: string
}

const notifications = ref<Notif[]>([])
const unreadCount = computed(() => notifications.value.filter((n) => n.unread).length)

function mapRow(r: any): Notif {
  const s = notificationStyle(r.type)
  return {
    id: r.id,
    title: r.title || 'Notification',
    message: r.body || '',
    time: getTimeAgo(r.created_at),
    icon: s.icon,
    color: s.color,
    unread: !r.read_at,
    linkUrl: r.link_url || '',
  }
}

let channel: any = null

async function load() {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, type, link_url, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) notifications.value = (data as any[]).map(mapRow)
  } catch (e: any) {
    console.warn('Could not load notifications (apply verification_workflow migration?):', e?.message)
  }
}

async function markRead(notif: Notif) {
  if (!notif.unread) return
  notif.unread = false
  try {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notif.id)
  } catch (e: any) {
    console.warn('Could not mark notification read:', e?.message)
  }
}

async function markAllRead() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return
  notifications.value.forEach((n) => (n.unread = false))
  try {
    const now = new Date().toISOString()
    await supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null)
  } catch (e: any) {
    console.warn('Could not mark all read:', e?.message)
  }
}

function viewAll() {
  router.push('/notifications')
}

onMounted(async () => {
  await load()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return
  channel = supabase
    .channel('notif-bell')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
      (payload: any) => {
        notifications.value = [mapRow(payload.new), ...notifications.value].slice(0, 20)
      },
    )
    .subscribe()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid var(--c-border);
}

.border-top {
  border-top: 1px solid var(--c-border);
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(244, 67, 54, 0.4);
}

.sticky-top {
  position: sticky;
  top: 0;
}

.sticky-bottom {
  position: sticky;
  bottom: 0;
}

.transition-bg {
  transition: background-color 0.3s ease;
}

.notif-capsule {
  border-radius: 999px !important;
  background: var(--c-surface-2) !important;
  border: 1px solid var(--c-border) !important;
  padding: 7px 11px !important;
  color: var(--c-muted) !important;
}

.notif-capsule:hover {
  background: var(--c-border) !important;
}
</style>
