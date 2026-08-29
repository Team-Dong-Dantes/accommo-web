<template>
  <div class="page q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h6 text-weight-bold" style="line-height: 1.1;">Notifications</div>
        <div class="text-muted" style="font-size: 13px;">Everything that needs your attention.</div>
      </div>
      <q-btn v-if="unreadCount > 0" flat color="primary" class="text-weight-bold"
        label="Mark all as read" @click="markAllRead" :disable="loading" />
    </div>

    <q-card flat class="list-card" v-if="notifications.length">
      <q-list separator>
        <q-item v-for="n in notifications" :key="n.id" clickable v-ripple
          :class="n.unread ? 'bg-primary-1' : ''" @click="open(n)"
          class="q-pa-md transition-bg">
          <q-item-section avatar>
            <q-avatar :color="n.color" text-color="white" size="42px" font-size="20px">
              <Icon :icon="n.icon" width="20" height="20" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold" style="font-size: 14px; line-height: 1.3;">{{ n.title }}</q-item-label>
            <q-item-label caption class="text-ink q-mt-xs" style="font-size: 12px; line-height: 1.4;">{{ n.body }}</q-item-label>
            <q-item-label caption class="text-muted q-mt-xs" style="font-size: 11px; font-weight: 600;">{{ n.time }}</q-item-label>
          </q-item-section>
          <q-item-section side class="justify-center">
            <div v-if="n.unread" class="unread-dot bg-red-5"></div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <div v-else class="empty q-pa-xl flex flex-center column">
      <Icon icon="mdi:bell-off-outline" width="48" height="48" class="q-mb-sm" />
      <div class="text-muted text-weight-bold">You're all caught up!</div>
      <div class="text-muted" style="font-size: 12px;">No notifications right now.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { getTimeAgo } from '@/utils/format'
import { notificationStyle } from '@/utils/notificationStyle'

const router = useRouter()
const loading = ref(false)
const notifications = ref<any[]>([])
const unreadCount = computed(() => notifications.value.filter((n) => n.unread).length)

function mapRow(r: any) {
  const s = notificationStyle(r.type)
  return {
    id: r.id,
    title: r.title || 'Notification',
    body: r.body || '',
    time: getTimeAgo(r.created_at),
    icon: s.icon,
    color: s.color,
    unread: !r.read_at,
    linkUrl: r.link_url || '',
  }
}

async function load() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return
  const { data } = await supabase
    .from('notifications')
    .select('id, title, body, type, link_url, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)
  if (data) notifications.value = (data as any[]).map(mapRow)
}

async function open(n: any) {
  if (n.unread) {
    n.unread = false
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id)
  }
  if (n.linkUrl) router.push(n.linkUrl)
}

async function markAllRead() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return
  loading.value = true
  notifications.value.forEach((n) => (n.unread = false))
  const now = new Date().toISOString()
  await supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null)
  loading.value = false
}

let channel: any = null
onMounted(async () => {
  await load()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return
  channel = supabase
    .channel('notif-page')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (p: any) => {
      notifications.value = [mapRow(p.new), ...notifications.value]
    })
    .subscribe()
})
onUnmounted(() => { if (channel) supabase.removeChannel(channel) })
</script>

<style scoped>
.page { max-width: 860px; margin: 0 auto; }
.list-card { border-radius: var(--card-radius, 16px); border: 1px solid var(--c-border); overflow: hidden; }
.transition-bg { transition: background-color 0.3s ease; }
.unread-dot { width: 9px; height: 9px; border-radius: 50%; box-shadow: 0 0 4px rgba(244, 67, 54, 0.4); }
.empty { border: 1px dashed var(--c-border); border-radius: var(--card-radius, 16px); color: var(--c-muted); }
</style>
