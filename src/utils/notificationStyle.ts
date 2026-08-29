export interface NotificationStyle {
  icon: string
  color: string
}

const STYLES: Record<string, NotificationStyle> = {
  verification: { icon: 'mdi:verified', color: 'teal-5' },
  concern: { icon: 'mdi:shield-alert', color: 'red-5' },
  complaint: { icon: 'mdi:gavel', color: 'deep-orange-5' },
  property: { icon: 'mdi:home-outline', color: 'indigo-5' },
  payment: { icon: 'mdi:cash-multiple', color: 'green-5' },
  lease: { icon: 'mdi:file-document-outline', color: 'orange-5' },
  message: { icon: 'mdi:message-text-outline', color: 'blue-5' },
  system: { icon: 'mdi:cog-outline', color: 'grey-7' },
}

export function notificationStyle(type: string): NotificationStyle {
  return STYLES[type] ?? { icon: 'mdi:bell-outline', color: 'grey-7' }
}
