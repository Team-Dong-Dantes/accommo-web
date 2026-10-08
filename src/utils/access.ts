// What an invited admin may do — mirrors public.admin_access and the
// can_view()/can_edit() checks in the database, which are the real gate.
// The system admin passes every check; Audit Logs and Administrators are
// theirs alone and never grantable.

export type Area =
  | 'accounts' | 'verification' | 'accreditation' | 'accommodations'
  | 'support' | 'announcements' | 'reports' | 'activity'
export type Level = 'none' | 'view' | 'edit'
export type AccessLevels = Record<Area, Level>

export const AREAS: { key: Area; label: string; hint: string; view: string; edit: string }[] = [
  { key: 'accounts', label: 'Accounts', hint: 'Users list, profiles, notes, sign-in actions', view: 'View only', edit: 'View & edit' },
  { key: 'verification', label: 'Verification', hint: 'Approve or reject students and landlords/landladies', view: 'View only', edit: 'View & edit' },
  { key: 'accreditation', label: 'Accreditation', hint: 'Accreditation decisions and permits', view: 'View only', edit: 'View & edit' },
  { key: 'accommodations', label: 'Accommodations', hint: 'Hubs and map — hide, suspend, restore', view: 'View only', edit: 'View & edit' },
  { key: 'support', label: 'Support tickets', hint: 'Reply, assign, resolve', view: 'View only', edit: 'View & edit' },
  { key: 'announcements', label: 'Announcements', hint: 'OSAS announcements', view: 'View only', edit: 'View & edit' },
  { key: 'reports', label: 'Reports', hint: 'View exports · edit changes who signs', view: 'Export', edit: 'Export & signatories' },
  { key: 'activity', label: 'Activity history', hint: 'View shows changes · edit adds the device', view: 'Changes only', edit: 'Changes & device' },
]

/** The access grid's sections, in the sidebar's order. */
export const AREA_GROUPS: { label: string; areas: Area[] }[] = [
  { label: 'Account management', areas: ['accounts', 'verification'] },
  { label: 'Accommodations', areas: ['accreditation', 'accommodations'] },
  { label: 'Operations', areas: ['support', 'announcements'] },
  { label: 'Records', areas: ['reports', 'activity'] },
]

const all = (level: Level): AccessLevels =>
  Object.fromEntries(AREAS.map((a) => [a.key, level])) as AccessLevels

export const NO_ACCESS: AccessLevels = all('none')

export const PRESETS: { key: string; label: string; summary: string; icon: string; levels: AccessLevels }[] = [
  { key: 'full', label: 'Full admin', summary: 'Everything but Audit Logs', icon: 'lucide:shield-check', levels: all('edit') },
  { key: 'verification', label: 'Verification officer', summary: 'Approves people', icon: 'lucide:user-check', levels: { ...all('none'), accounts: 'view', verification: 'edit', activity: 'view' } },
  { key: 'accreditation', label: 'Accreditation officer', summary: 'Permits and listings', icon: 'lucide:building-2', levels: { ...all('none'), accreditation: 'edit', accommodations: 'edit', activity: 'view' } },
  { key: 'support', label: 'Support desk', summary: 'Answers tickets', icon: 'lucide:headset', levels: { ...all('none'), accounts: 'view', accommodations: 'view', support: 'edit', activity: 'view' } },
  { key: 'viewer', label: 'Viewer', summary: 'Sees all, changes nothing', icon: 'lucide:eye', levels: all('view') },
]

export function presetLabel(key: string | null | undefined): string {
  return PRESETS.find((p) => p.key === key)?.label ?? 'Custom'
}

/** The preset these levels match exactly, or 'custom'. */
export function presetOf(levels: AccessLevels): string {
  return PRESETS.find((p) => AREAS.every((a) => p.levels[a.key] === levels[a.key]))?.key ?? 'custom'
}

/** Fills missing or unknown areas with 'none', as the database does. */
export function normalizeLevels(raw: unknown): AccessLevels {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return Object.fromEntries(AREAS.map((a) => {
    const v = src[a.key]
    return [a.key, v === 'view' || v === 'edit' ? v : 'none']
  })) as AccessLevels
}

/** Pages and the areas that open them (any one is enough). */
export const PATH_AREAS: Record<string, Area[]> = {
  '/users': ['accounts'],
  '/verifications': ['verification', 'accreditation'],
  '/map-view': ['accommodations', 'accreditation'],
  '/accommodation-hub': ['accommodations', 'accreditation'],
  '/room-hub': ['accommodations'],
  '/support-tickets': ['support'],
  '/announcements': ['announcements'],
}

/** System-admin-only pages. */
export const SUPERADMIN_PATHS = new Set(['/audit-logs'])

/** "Access until" a date means through the end of that day, local time. */
export function endOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59`).toISOString()
}

/** A stored expiry as a yyyy-mm-dd date input value (local), or null. */
export function toDateInput(iso: string | null): string | null {
  return iso ? new Date(iso).toLocaleDateString('en-CA') : null
}
