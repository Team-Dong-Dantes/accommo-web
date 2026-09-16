export interface NotificationStyle {
  icon: string
  color: string
}

const STYLES: Record<string, NotificationStyle> = {
  verification: { icon: 'lucide:badge-check', color: 'teal-5' },
  ticket: { icon: 'lucide:ticket', color: 'red-5' },
  accommodation: { icon: 'lucide:house', color: 'indigo-5' },
  payment: { icon: 'lucide:coins', color: 'green-5' },
  lease: { icon: 'lucide:file-text', color: 'orange-5' },
  message: { icon: 'lucide:message-square', color: 'blue-5' },
  system: { icon: 'lucide:settings', color: 'grey-7' },
}

export function notificationStyle(type: string): NotificationStyle {
  return STYLES[type] ?? { icon: 'lucide:bell', color: 'grey-7' }
}
