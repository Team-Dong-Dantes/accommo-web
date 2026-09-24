// Central status → design-token map.
// Single source of truth so every badge / status chip across the app uses the
// same semantic colors (driven by tokens.css) instead of hardcoded Quasar
// palette names (teal-1/teal-7, orange-1, red-1, …).

export type StatusTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

// Tone → CSS custom property. Single source of truth so inline :style
// bindings (timeline dots, icon chips, pop-items) use the same tokens
// as BadgePill / status chips instead of per-file hex maps.
export function toneVar(tone: StatusTone | string | undefined): string {
  switch (tone) {
    case 'primary': return 'var(--c-primary)'
    case 'success': return 'var(--c-success)'
    case 'warning': return 'var(--c-warning)'
    case 'danger': return 'var(--c-danger)'
    case 'info': return 'var(--c-info)'
    default: return 'var(--c-muted)'
  }
}

export interface StatusDef {
  tone: StatusTone
  icon?: string
  label?: string
}

export const STATUS_MAP: Record<string, StatusDef> = {
  // Roles
  admin: { tone: 'primary', icon: 'lucide:shield-user' },
  landlord: { tone: 'primary', icon: 'lucide:building-2' },
  student: { tone: 'neutral', icon: 'lucide:graduation-cap' },
  agent: { tone: 'info', icon: 'lucide:headset' },

  // Account / verification status
  verified: { tone: 'success', icon: 'lucide:badge-check' },
  active: { tone: 'success', icon: 'lucide:circle-check' },
  accredited: { tone: 'success', icon: 'lucide:award' },
  published: { tone: 'success', icon: 'lucide:upload' },
  unverified: { tone: 'neutral', icon: 'lucide:circle-help' },
  unknown: { tone: 'neutral', icon: 'lucide:user-search' },

  pending: { tone: 'warning', icon: 'lucide:clock' },
  // A refusal the landlord/landlady can fix, so it is a warning rather than a failure.
  needs_revision: { tone: 'warning', icon: 'lucide:file-pen' },
  // The landlord/landlady took their own property off the market; nothing is wrong with it.
  delisted: { tone: 'neutral', icon: 'lucide:eye-off' },
  reviewing: { tone: 'info', icon: 'lucide:eye' },
  scheduled: { tone: 'info', icon: 'lucide:calendar-clock' },
  draft: { tone: 'neutral', icon: 'lucide:file-text' },
  archived: { tone: 'neutral', icon: 'lucide:archive' },

  rejected: { tone: 'danger', icon: 'lucide:circle-x' },
  suspended: { tone: 'danger', icon: 'lucide:ban' },
  banned: { tone: 'danger', icon: 'lucide:ban' },
  expired: { tone: 'danger', icon: 'lucide:triangle-alert' },
  upcoming: { tone: 'warning', icon: 'lucide:calendar-clock' },

  open: { tone: 'warning', icon: 'lucide:folder-open' },
  in_progress: { tone: 'info', icon: 'lucide:hourglass' },
  resolved: { tone: 'success', icon: 'lucide:check' },
  urgent: { tone: 'danger', icon: 'lucide:octagon-alert' },
  high: { tone: 'danger', icon: 'lucide:triangle-alert' },
  medium: { tone: 'warning', icon: 'lucide:equal' },
  low: { tone: 'info', icon: 'lucide:chevrons-down' },

  all: { tone: 'neutral', icon: 'lucide:users' },
  students: { tone: 'info', icon: 'lucide:graduation-cap' },
  landlords: { tone: 'primary', icon: 'lucide:building-2' },
  public: { tone: 'neutral', icon: 'lucide:globe' },

  // Room occupancy — the full `room_status` enum. The Property Hub and the Room
  // Hub each carried their own `roomTone()` before this, and they disagreed:
  // only one of them knew about `maintenance`, so a room under maintenance was
  // red on one screen and grey on the other.
  available: { tone: 'success', icon: 'lucide:door-open' },
  occupied: { tone: 'warning', icon: 'lucide:bed-double' },
  maintenance: { tone: 'danger', icon: 'lucide:wrench' },

  // Lease state shown on the Room Hub's occupant chips, which are filtered to
  // active + leave_requested. `active` is already mapped above.
  leave_requested: { tone: 'warning', icon: 'lucide:door-open' }
}

export function getStatus(key?: string | null): StatusDef {
  if (!key) return { tone: 'neutral' }
  return STATUS_MAP[key.toLowerCase()] ?? { tone: 'neutral' }
}

export function getTone(key?: string | null): StatusTone {
  return getStatus(key).tone
}
