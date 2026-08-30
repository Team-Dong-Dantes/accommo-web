import { describe, expect, it } from 'vitest'
import { notificationTarget } from './notificationTarget'

describe('notificationTarget', () => {
  it('opens the exact target of a current notification link', () => {
    expect(notificationTarget('/verifications?focus=verification:user-123'))
      .toBe('/verifications?focus=verification:user-123')
    expect(notificationTarget('/room-hub?room=room-123')).toBe('/room-hub?room=room-123')
    expect(notificationTarget('/support-tickets?focus=ticket:ticket-123'))
      .toBe('/support-tickets?focus=ticket:ticket-123')
    expect(notificationTarget('/accommodation-hub?accommodation=accommodation-123'))
      .toBe('/accommodation-hub?accommodation=accommodation-123')
    expect(notificationTarget('/property-hub?property=accommodation-123'))
      .toBe('/verifications?focus=verification:accommodation-123')
  })

  it('migrates legacy support routes to the ticket window', () => {
    expect(notificationTarget('/concerns?focus=ticket:ticket-123'))
      .toBe('/support-tickets?focus=ticket%3Aticket-123')
    expect(notificationTarget('/concerns?focus=complaint:ticket-123'))
      .toBe('/support-tickets?focus=ticket:ticket-123')
  })

  it('uses the notification list for missing or external destinations', () => {
    expect(notificationTarget('')).toBe('/notifications')
    expect(notificationTarget('https://example.com/admin')).toBe('/notifications')
  })
})
