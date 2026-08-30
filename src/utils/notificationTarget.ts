// Notification links are persisted. Normalize retired routes so old records
// keep opening their exact target after the support inbox was consolidated.
export function notificationTarget(linkUrl: string): string {
  if (!linkUrl) return '/notifications'

  try {
    const base = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
    const target = new URL(linkUrl, base)
    if (target.origin !== base) return '/notifications'

    const focus = target.searchParams.get('focus') || ''
    if (target.pathname === '/support-tickets' && focus.startsWith('ticket:')) {
      return `${target.pathname}${target.search}${target.hash}`
    }
    if (target.pathname === '/concerns' && focus.startsWith('ticket:')) {
      return `/support-tickets?focus=${encodeURIComponent(focus)}`
    }
    if (target.pathname === '/concerns' && focus.startsWith('complaint:')) {
      return `/support-tickets?focus=ticket:${encodeURIComponent(focus.slice('complaint:'.length))}`
    }
    if (target.pathname === '/property-hub') {
      const accommodationId = target.searchParams.get('accommodation') || target.searchParams.get('property')
      if (accommodationId) return `/verifications?focus=verification:${encodeURIComponent(accommodationId)}`
    }

    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return '/notifications'
  }
}
