// In-memory page cache: the heavy admin pages keep their last result in
// module-level state, so returning to a page shows it at once while load()
// refreshes it in the background.
//
// Memory only — never localStorage/sessionStorage: OSAS PCs are shared and
// this is personal data. Everything is dropped on logout so the next admin
// signing in on the same tab never sees the previous one's data.

import { supabase } from '@/utils/supabase'

const resets = new Set<() => void>()

// Any way out of a session (logout, the router's suspension sign-out, expiry,
// another tab) arrives here as SIGNED_OUT. SIGNED_IN is re-sent for the same
// user on tab focus, so only a different user clears.
let cachedFor: string | null = null
supabase.auth.onAuthStateChange((event, session) => {
  const uid = session?.user?.id ?? null
  if (event === 'SIGNED_OUT' || (uid && cachedFor && uid !== cachedFor)) clearPageCaches()
  cachedFor = uid
})

/** Register how to empty one cache. Call once, at module scope. */
export function registerReset(reset: () => void): void {
  resets.add(reset)
}

export function clearPageCaches(): void {
  for (const reset of resets) reset()
}
