// Shared string/date formatting helpers.
// Extracted so pages stop re-defining them inline (was duplicated in Verifications).

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length > 1) {
    const first = parts[0]?.[0] ?? ''
    const last = parts[parts.length - 1]?.[0] ?? ''
    return (first + last).toUpperCase()
  }
  if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase()
  return '?'
}

/**
 * Note the empty-input fallback: this returns 'Pending', not an em dash, and it
 * lowercases the tail. Both are load-bearing for the verification queue
 * (`useVerifications.ts`), which is why `cap` below exists separately rather
 * than this being made "more correct".
 */
export function capitalize(val: string): string {
  if (!val) return 'Pending'
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
}

/**
 * Plain sentence-casing that leaves the rest of the string alone, so an
 * acronym survives. Consolidated from byte-identical copies in
 * `features/users/userPreview.ts`, `pages/admin/PropertyHub.vue` and
 * `pages/admin/RoomHub.vue`.
 *
 * Distinct from `capitalize` above — see its note. Pick the one your surface
 * already used.
 */
export function cap(s: string | null | undefined): string {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function getTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown'
  const past = new Date(dateString).getTime()
  if (isNaN(past)) return 'Unknown'

  const diffInMins = Math.floor((new Date().getTime() - past) / 60000)
  if (diffInMins < 1) return 'just now'
  if (diffInMins < 60) return `${diffInMins} mins ago`
  if (diffInMins < 1440) {
    const h = Math.floor(diffInMins / 60)
    return `${h} ${h === 1 ? 'hr' : 'hrs'} ago`
  }
  const d = Math.floor(diffInMins / 1440)
  return `${d} ${d === 1 ? 'day' : 'days'} ago`
}

/**
 * A room's `room_status` as people read it. The stored value `maintenance`
 * reads as "Under maintenance", which says the room is out of use; the bare
 * word read like a category.
 */
export function roomStatusLabel(status: string | null | undefined): string {
  if (!status) return ''
  if (status.toLowerCase() === 'maintenance') return 'Under maintenance'
  return humanizeEnum(status)
}

/** Whole days since `date`, never negative; 0 when the date is missing or unreadable. */
export function ageInDays(date: string | null | undefined): number {
  if (!date) return 0
  const timestamp = new Date(date).getTime()
  if (Number.isNaN(timestamp)) return 0
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
}

// Compact variant used on the dashboard ("5 min ago" vs "5 mins ago").
// Consolidated from identical copies in useDashboardStats.ts and Dashboard.vue.
export function getTimeAgoShort(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown'
  const past = new Date(dateStr).getTime()
  if (isNaN(past)) return 'Unknown'
  const diff = Math.floor((Date.now() - past) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff} min ago`
  if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`
  return `${Math.floor(diff / 1440)} days ago`
}

// Wide variant: single-word names yield their first TWO letters ("Mark" → "MA")
// instead of one. Consolidated from identical copies in useAccommodations.ts and
// RoomHub.vue — kept separate from getInitials to preserve rendered output.
export function getInitialsWide(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0] ?? ''
  if (parts.length > 1) {
    const last = parts[parts.length - 1] ?? ''
    return (first.charAt(0) + last.charAt(0)).toUpperCase()
  }
  return first.slice(0, 2).toUpperCase()
}

/**
 * snake_case database value → human label ("boarding_house" → "Boarding House").
 *
 * Lives here rather than beside its first caller because three surfaces render
 * raw enum values: the audit log's action/entity columns, the accommodation
 * type in the hub and map, and anything else that reaches a `*_type` column.
 * `features/audit/logMapping.ts` re-exports it as `label` for its own callers.
 */
export function humanizeEnum(value: string | null | undefined): string {
  if (!value) return '—'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * The role as a label for nobody in particular — a filter option, a nav item, a
 * column header, a count. Never gendered, because it addresses no one.
 */
export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'admin': return 'Administrator'
    case 'student': return 'Student'
    case 'landlord': return 'Landlord/Landlady'
    case 'agent': return 'Agent'
    default: return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'
  }
}

/**
 * How to title one specific person who holds the landlord role, from their
 * recorded sex.
 *
 * The neutral fallback is load-bearing, not decorative: `users.sex` is nullable
 * and holds only 'F' or 'M' when set, so anyone who did not state it — or who
 * is neither — must still get a title rather than an empty string. Keep this in
 * one place so that fallback cannot drift between surfaces.
 *
 * Use `roleLabel()` instead wherever the label is not about a named person.
 */
export function landlordTitle(sex: string | null | undefined): string {
  switch ((sex ?? '').trim().toUpperCase()) {
    case 'M': return 'Landlord'
    case 'F': return 'Landlady'
    default: return 'Landlord/Landlady'
  }
}

/**
 * The app's one calendar-date format: "Sep 22, 2026".
 *
 * Consolidated from three identical copies (announcements, audit logs and the
 * user drawer), each of which had picked its own locale. The locale is pinned
 * to `en-PH` rather than left to the browser so that an admin on a non-English
 * system sees the same string as everyone else — with an English locale the
 * output is unchanged.
 */
/**
 * Several columns (audit_logs.created_at, announcements.published_at, …) are
 * `timestamp without time zone` holding UTC. Read back they carry no offset,
 * and `new Date()` would take them as local time — 8 hours early in Manila.
 * Pin offset-less values to UTC; values that carry an offset pass through.
 */
export function utcMs(ts: string | null | undefined): number | null {
  if (!ts) return null
  const t = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts + 'Z').getTime()
  return isNaN(t) ? null : t
}

/** The same instant as an ISO string with its offset, for the formatters below. */
export function utcIso(ts: string | null | undefined): string | null {
  const ms = utcMs(ts)
  return ms == null ? null : new Date(ms).toISOString()
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Street, barangay and city as one line, skipping any part the line already
 * contains.
 *
 * Landlords and landladies type the barangay into the street field as well — 12 of the 13
 * accommodations on file do — so a plain join renders "Purok 5, Silauan Sur,
 * Silauan Sur, Echague". The city is not duplicated today, but the same guard
 * covers it. Matching is case-insensitive and substring-based, because the two
 * fields are free text and will not agree on capitalisation.
 */
export function composeAddress(
  p: { address?: string | null; barangay?: string | null; city?: string | null } | null | undefined,
): string {
  if (!p) return '—'
  const parts: string[] = []
  for (const part of [p.address, p.barangay, p.city]) {
    const value = (part ?? '').trim()
    if (!value) continue
    if (parts.some((existing) => existing.toLowerCase().includes(value.toLowerCase()))) continue
    parts.push(value)
  }
  return parts.join(', ') || '—'
}

/** ISO timestamp → YYYY-MM-DD, so a spreadsheet sorts the column. */
export function csvDate(v: string | null | undefined): string {
  return v ? String(v).slice(0, 10) : ''
}

/** Generated avatar for a record that has no uploaded image. */
export function avatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=160&background=0F766E&color=fff&bold=true`
}

// Shared ticket-thread date helpers.
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

// Shared ticket activity timeline helpers.
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * Escapes a value for interpolation into a string that will be rendered with
 * `v-html`.
 *
 * The drawer's activity feed (features/users/userPreview.ts → ActivityFeed.vue)
 * composes short HTML fragments so a name can be bolded, and the values going
 * into them are user-written: `full_name` is whatever someone typed at
 * registration, accommodation names are whatever a landlord/landlady typed. Unescaped,
 * a student calling themselves `<img src=x onerror=…>` ran script in an OSAS
 * admin's session.
 *
 * Use this on every value spliced into markup. The markup itself is ours and
 * stays literal — that is the whole reason the feed uses `v-html` rather than
 * a text interpolation.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function dayLabel(day: string, now = new Date()): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(day)
  if (Number.isNaN(msgDate.getTime())) return 'Unknown date'

  const messageDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate())
  const diff = Math.round((today.getTime() - messageDay.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return msgDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** A student ID as the mobile register screen composes it: entry year, hyphen, 4–6 digit student number. */
export function isStudentId(raw: string | null | undefined): boolean {
  return /^\d{2}-\d{4,6}$/.test((raw ?? '').trim())
}

/** A Philippine mobile number in groups ("+639763126760" → "+63 976 312 6760"); anything else as typed. */
export function formatPhone(raw: string): string {
  const d = raw.replace(/[^\d]/g, '')
  const local =
    d.startsWith('63') && d.length === 12 ? d.slice(2)
      : d.startsWith('0') && d.length === 11 ? d.slice(1)
        // The ten digits after the mobile form's fixed "+63" prefix.
        : d.startsWith('9') && d.length === 10 ? d
          : null
  return local ? `+63 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : raw
}

/**
 * Why a new password would be refused, or null. Mirrors the project's auth rule
 * (8+ characters with a lowercase and an uppercase letter, a digit and a
 * symbol) so the reason shows here instead of Supabase's generic "weak password".
 */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/.test(pw)) {
    return 'Use an uppercase and a lowercase letter, a number and a symbol.'
  }
  return null
}

// ponytail: coarse user-agent sniffing — enough to tell a phone from a laptop.
/** "Chrome on Android" from a user-agent string. */
export function deviceName(ua: string | null | undefined): string {
  if (!ua) return 'Unknown device'
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Deno\//.test(ua) ? 'Server function' : 'Browser'
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : null
  return os ? `${browser} on ${os}` : browser
}
