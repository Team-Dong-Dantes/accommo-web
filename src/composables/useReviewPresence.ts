import { ref, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { useAuthStore } from '@/stores/auth'

export interface ReviewHolder {
  userId: string
  name: string
}

const CHANNEL = 'verification-review'

/**
 * Who has a verification request open right now.
 *
 * `status = 'reviewing'` is a claim the database cannot check: a crashed or
 * killed browser never runs the release path, and the row stays claimed with
 * nobody in it. Every open review window announces itself here instead, so a
 * lock can be tested against who is actually connected rather than taken on
 * faith. A closed socket drops its presence within seconds.
 *
 * Presence alone is not the whole rule — see `reviewing_at` in
 * `useVerifications` — because a client that has just joined, or one whose
 * Realtime is unavailable, would otherwise read an empty channel as "nobody is
 * reviewing anything". `ready` exists for exactly that: it is false until the
 * first sync lands, and callers must not judge a lock before then.
 */
export function useReviewPresence() {
  const holders = ref(new Map<string, ReviewHolder>())
  const ready = ref(false)
  const auth = useAuthStore()

  let channel: ReturnType<typeof supabase.channel> | null = null
  let tracked: string | null = null

  function payload(requestId: string) {
    return {
      requestId,
      userId: auth.user?.id ?? '',
      name: auth.user?.full_name || 'Another reviewer',
    }
  }

  function readState() {
    const state = (channel?.presenceState() ?? {}) as Record<
      string,
      { requestId?: string; userId?: string; name?: string }[]
    >
    const next = new Map<string, ReviewHolder>()
    for (const entries of Object.values(state)) {
      for (const entry of entries) {
        if (!entry?.requestId) continue
        next.set(entry.requestId, { userId: entry.userId ?? '', name: entry.name || 'Another reviewer' })
      }
    }
    holders.value = next
    ready.value = true
  }

  if (typeof supabase.channel !== 'function') {
    // Realtime disabled or stubbed. Presence is then permanently empty, and the
    // `reviewing_at` age is left to judge a lock on its own — so say ready
    // rather than blocking the sweep forever.
    ready.value = true
  } else {
    channel = supabase.channel(CHANNEL, {
      config: { presence: { key: auth.user?.id || 'anonymous' } },
    })
    channel
      .on('presence', { event: 'sync' }, readState)
      .on('presence', { event: 'join' }, readState)
      .on('presence', { event: 'leave' }, readState)
      .subscribe((status: string) => {
        // A reconnect re-subscribes with an empty presence, so whatever this tab
        // still has open is re-announced rather than silently vanishing.
        if (status === 'SUBSCRIBED' && tracked) void channel?.track(payload(tracked))
      })
  }

  /** Announce that this admin has `requestId` open. */
  function track(requestId: string) {
    tracked = requestId
    void channel?.track(payload(requestId))
  }

  function untrack() {
    tracked = null
    void channel?.untrack()
  }

  function holderOf(requestId: string): ReviewHolder | null {
    return holders.value.get(requestId) ?? null
  }

  onUnmounted(() => {
    untrack()
    if (channel) supabase.removeChannel(channel)
    channel = null
  })

  return { holders, ready, track, untrack, holderOf }
}
