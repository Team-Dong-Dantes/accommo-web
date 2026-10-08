// Shared announcement helpers — used by the page (row mapping), the
// drawers and the composer (form fill + save).

import type { StatusTone } from '@/utils/status.config'
import { utcMs } from '@/utils/format'

// Re-exported so this module stays the single import surface for the
// announcements feature; the implementation lives in utils/format.ts, where
// shared date helpers belong (ARCHITECTURE.md rule 4).
// announcements.published_at / expires_at are `timestamp without time zone`
// holding UTC; utcMs / utcIso read them correctly.
export { fmtDate, utcMs, utcIso } from '@/utils/format'

export function dateInput(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  // to YYYY-MM-DD in local time
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

/** ISO/UTC timestamp → value for an `<input type="datetime-local">`. */
export function dateTimeInput(ts: string | null | undefined): string | null {
  const ms = utcMs(ts)
  if (ms == null) return null
  const local = new Date(ms - new Date(ms).getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function dateToIso(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr.length > 10 ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

export type AnnouncementStatus = 'draft' | 'scheduled' | 'live' | 'expired'

export function announcementStatus(row: { published_at?: string | null; expires_at?: string | null }, now = Date.now()): AnnouncementStatus {
  const pub = utcMs(row.published_at)
  if (pub == null) return 'draft'
  if (pub > now) return 'scheduled'
  const exp = utcMs(row.expires_at)
  if (exp != null && exp < now) return 'expired'
  return 'live'
}

export const STATUS_META: Record<AnnouncementStatus, { label: string; tone: StatusTone; icon: string }> = {
  draft: { label: 'Draft', tone: 'warning', icon: 'lucide:file-pen' },
  scheduled: { label: 'Scheduled', tone: 'info', icon: 'lucide:calendar-clock' },
  live: { label: 'Live', tone: 'success', icon: 'lucide:circle-check' },
  expired: { label: 'Expired', tone: 'neutral', icon: 'lucide:clock-alert' },
}

export const AUDIENCE_META: Record<string, { label: string; tone: StatusTone }> = {
  all: { label: 'All users', tone: 'neutral' },
  students: { label: 'Students', tone: 'info' },
  landlords: { label: 'Landlords/Landladies', tone: 'primary' },
}

export function audienceMeta(audience: string | null | undefined) {
  return AUDIENCE_META[audience ?? 'all'] ?? { label: audience ?? '', tone: 'neutral' as StatusTone }
}

/** "62%" — or an em dash when nothing was sent. */
export function pct(part: number, whole: number): string {
  return whole ? Math.round((part / whole) * 100) + '%' : '—'
}
