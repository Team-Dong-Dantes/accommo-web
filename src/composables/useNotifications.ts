// Notification list + realtime, shared by the header bell and the notification
// centre.
//
// Both surfaces used to carry their own copy of this — row mapping, loading,
// mark-read, mark-all-read and the realtime subscription, near line for line.
// The copies had drifted: the bell swallowed a failed load and rendered its
// "Inbox clear" empty state, which is indistinguishable from actually having no
// notifications, while the page showed an error. One implementation, and the
// surfaces differ only in the arguments below.
//
// A factory, NOT a singleton (see ARCHITECTURE.md): each consumer gets its own
// state and its own realtime channel.

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  currentUserId,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from '@/api/notifications'
import { supabase } from '@/utils/supabase'
import { getTimeAgo, humanizeEnum } from '@/utils/format'
import { notificationStyle } from '@/utils/notificationStyle'
import { notificationTarget } from '@/utils/notificationTarget'

export interface NotificationItem {
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

export interface UseNotificationsOptions {
  /** How many rows to hold. The bell shows a recent slice; the centre shows the backlog. */
  limit: number
  /** Realtime channel name — must be unique per surface or the two unsubscribe each other. */
  channel: string
}

function mapRow(row: NotificationRow): NotificationItem {
  const style = notificationStyle(row.type ?? '')
  return {
    id: row.id,
    title: row.title || 'Notification',
    body: row.body || '',
    time: getTimeAgo(row.created_at),
    createdAt: row.created_at || '',
    icon: style.icon,
    color: style.color,
    // An untyped notification reads as "System" rather than the em dash
    // `humanizeEnum` falls back to, which would look like missing data here.
    typeLabel: row.type ? humanizeEnum(row.type) : 'System',
    unread: !row.read_at,
    linkUrl: row.link_url || '',
  }
}

export function useNotifications({ limit, channel }: UseNotificationsOptions) {
  const router = useRouter()

  const notifications = ref<NotificationItem[]>([])
  const loading = ref(true)
  const error = ref('')
  const marking = ref(false)

  const unreadNotifications = computed(() => notifications.value.filter((n) => n.unread))
  const readNotifications = computed(() => notifications.value.filter((n) => !n.unread))
  const unreadCount = computed(() => unreadNotifications.value.length)

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const userId = await currentUserId()
      if (!userId) return
      notifications.value = (await fetchNotifications(userId, limit)).map(mapRow)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Check your connection, then try again.'
    } finally {
      loading.value = false
    }
  }

  /**
   * Marking read is optimistic: the row is already greyed before the write
   * lands, because the user is navigating away from it in the same click.
   */
  async function markRead(notification: NotificationItem) {
    if (!notification.unread) return
    notification.unread = false
    try {
      await markNotificationRead(notification.id)
    } catch (e) {
      console.warn('Could not mark notification read:', e)
    }
  }

  async function markAllRead() {
    if (marking.value) return
    const userId = await currentUserId()
    if (!userId) return
    marking.value = true
    notifications.value.forEach((n) => (n.unread = false))
    try {
      await markAllNotificationsRead(userId)
    } catch (e) {
      console.warn('Could not mark all read:', e)
    } finally {
      marking.value = false
    }
  }

  async function open(notification: NotificationItem) {
    await markRead(notification)
    await router.push(notificationTarget(notification.linkUrl))
  }

  let subscription: ReturnType<typeof supabase.channel> | null = null

  onMounted(async () => {
    await load()
    const userId = await currentUserId()
    if (!userId) return
    subscription = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          notifications.value = [mapRow(payload.new as NotificationRow), ...notifications.value].slice(0, limit)
        },
      )
      .subscribe()
  })

  onUnmounted(() => {
    if (subscription) void supabase.removeChannel(subscription)
  })

  return {
    notifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    loading,
    error,
    marking,
    load,
    open,
    markAllRead,
  }
}
