export interface NotificationStyle {
  icon: string
  color: string
}

const STYLES: Record<string, NotificationStyle> = {
  verification: { icon: 'mdi:verified', color: 'teal-5' },
  ticket: { icon: 'mdi:ticket-outline', color: 'red-5' },
  accommodation: { icon: 'mdi:home-outline', color: 'indigo-5' },
  payment: { icon: 'mdi:cash-multiple', color: 'green-5' },
  lease: { icon: 'mdi:file-document-outline', color: 'orange-5' },
  message: { icon: 'mdi:message-text-outline', color: 'blue-5' },
  system: { icon: 'mdi:cog-outline', color: 'grey-7' },
}

export function notificationStyle(type: string): NotificationStyle {
  return STYLES[type] ?? { icon: 'mdi:bell-outline', color: 'grey-7' }
}
