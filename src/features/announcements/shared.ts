// Shared announcement/policy helpers — used by both the page (row mapping)
// and the composer (form fill + save).

// Re-exported so this module stays the single import surface for the
// announcements feature; the implementation lives in utils/format.ts, where
// shared date helpers belong (ARCHITECTURE.md rule 4).
export { fmtDate } from '@/utils/format'

export function dateInput(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  // to YYYY-MM-DD in local time
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

export function dateToIso(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

export function announcementStatus(row: any): 'draft' | 'published' | 'expired' {
  if (row.published_at == null) return 'draft'
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return 'expired'
  return 'published'
}
