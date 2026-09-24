import type { StatusTone } from '@/utils/status.config'

/**
 * Compliance state of a document, read from its expiry date alone.
 *
 * Lifted out of PropertyHub.vue, where it lived as a local function serving
 * only the Compliance tab. The detail drawers need the same answer for the same
 * rows, and two copies of a date comparison is two chances for the badge on the
 * table to disagree with the badge in the drawer.
 *
 *   'missing'  -> no document at all
 *   'expired'  -> past its expiry date
 *   'expiring' -> valid, but lapses within 30 days
 *   'valid'    -> present, and not lapsing soon
 */
export type PermitState = 'missing' | 'expired' | 'expiring' | 'valid'

const EXPIRING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

/**
 * A document with no recorded expiry counts as valid rather than expired — the
 * date is unknown, not overdue, and `verification_documents` rows written
 * before the expiry column existed all look like this.
 */
export function permitStateOf(expiresAt: string | null | undefined): PermitState {
  if (!expiresAt) return 'valid'

  const expiry = new Date(expiresAt).getTime()
  if (isNaN(expiry)) return 'valid'

  const now = Date.now()
  if (expiry < now) return 'expired'
  if (expiry < now + EXPIRING_WINDOW_MS) return 'expiring'
  return 'valid'
}

/**
 * The permits a boarding house must keep on file to stay accredited, as the
 * keywords their document types are matched against. The Compliance tab gives
 * each its own column; the renewal report checks each one.
 */
export const REQUIRED_PERMITS: { key: string; label: string }[] = [
  { key: 'fire', label: 'Fire Safety' },
  { key: 'business', label: 'Business' },
  { key: 'sanitary', label: 'Sanitary' },
  { key: 'building', label: 'Building' },
]

/**
 * The accommodation's document for one required permit keyword. Matching is
 * case-insensitive and bidirectional so labels like "fire certificate" or
 * "business permit" both count against fire / business.
 */
export function findPermit<T extends { type?: string | null }>(permits: T[] | null | undefined, key: string): T | undefined {
  const kw = key.toLowerCase()
  return (permits ?? []).find((pm) => {
    const t = String(pm.type || '').toLowerCase()
    return t.includes(kw) || kw.includes(t)
  })
}

/** Compliance state of one required permit: missing, or its expiry's state. */
export function requiredPermitState(permits: { type?: string | null; expiresAt?: string | null }[] | null | undefined, key: string): PermitState {
  const pm = findPermit(permits, key)
  return pm ? permitStateOf(pm.expiresAt) : 'missing'
}

/** Label, tone and icon per state, so every surface renders one the same way. */
export const PERMIT_STATE: Record<PermitState, { tone: StatusTone; icon: string; label: string }> = {
  missing: { tone: 'neutral', icon: 'lucide:circle-x', label: 'Not Submitted' },
  expired: { tone: 'danger', icon: 'lucide:circle-x', label: 'Expired' },
  expiring: { tone: 'warning', icon: 'lucide:clock-alert', label: 'Expiring' },
  valid: { tone: 'success', icon: 'lucide:circle-check', label: 'Valid' },
}

/**
 * "Expires 14 Mar 2027", or a plain statement that no date is on file. The
 * drawer prints this under the document name, so it has to read as a sentence
 * rather than a bare date whose meaning depends on its column header.
 */
export function expiryLabel(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'No expiry recorded'

  const date = new Date(expiresAt)
  if (isNaN(date.getTime())) return 'No expiry recorded'

  const formatted = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${date.getTime() < Date.now() ? 'Expired' : 'Expires'} ${formatted}`
}
