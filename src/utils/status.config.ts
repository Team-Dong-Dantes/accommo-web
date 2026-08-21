// Central status → design-token map.
// Single source of truth so every badge / status chip across the app uses the
// same semantic colors (driven by tokens.css) instead of hardcoded Quasar
// palette names (teal-1/teal-7, orange-1, red-1, …).

export type StatusTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface StatusDef {
  tone: StatusTone
  icon?: string
  label?: string
}

export const STATUS_MAP: Record<string, StatusDef> = {
  // Roles
  admin: { tone: 'primary', icon: 'mdi:shield-account' },
  landlord: { tone: 'primary', icon: 'mdi:domain' },
  student: { tone: 'neutral', icon: 'mdi:school' },
  agent: { tone: 'info', icon: 'mdi:headset' },

  // Account / verification status
  verified: { tone: 'success', icon: 'mdi:check-decagram' },
  active: { tone: 'success', icon: 'mdi:check-circle' },
  accredited: { tone: 'success', icon: 'mdi:certificate' },
  published: { tone: 'success', icon: 'mdi:publish' },
  unverified: { tone: 'neutral', icon: 'mdi:help-circle-outline' },
  unknown: { tone: 'neutral', icon: 'mdi:account-question' },

  pending: { tone: 'warning', icon: 'mdi:clock-outline' },
  reviewing: { tone: 'info', icon: 'mdi:eye' },
  scheduled: { tone: 'info', icon: 'mdi:calendar-clock' },
  draft: { tone: 'neutral', icon: 'mdi:file-document-outline' },
  archived: { tone: 'neutral', icon: 'mdi:archive-outline' },

  rejected: { tone: 'danger', icon: 'mdi:close-circle' },
  suspended: { tone: 'danger', icon: 'mdi:cancel' },
  banned: { tone: 'danger', icon: 'mdi:block-helper' },
  expired: { tone: 'danger', icon: 'mdi:alert-outline' },
  upcoming: { tone: 'warning', icon: 'mdi:calendar-clock' },

  open: { tone: 'warning', icon: 'mdi:folder-open-outline' },
  resolved: { tone: 'success', icon: 'mdi:check' },
  high: { tone: 'danger', icon: 'mdi:alert' },
  medium: { tone: 'warning', icon: 'mdi:equal' },
  low: { tone: 'info', icon: 'mdi:chevron-double-down' },

  all: { tone: 'neutral', icon: 'mdi:account-group' },
  students: { tone: 'info', icon: 'mdi:school' },
  landlords: { tone: 'primary', icon: 'mdi:domain' },
  public: { tone: 'neutral', icon: 'mdi:earth' }
}

export function getStatus(key?: string | null): StatusDef {
  if (!key) return { tone: 'neutral' }
  return STATUS_MAP[key.toLowerCase()] ?? { tone: 'neutral' }
}

export function getTone(key?: string | null): StatusTone {
  return getStatus(key).tone
}
