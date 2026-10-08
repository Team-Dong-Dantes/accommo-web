import { describe, expect, it } from 'vitest'
import { announcementStatus, utcMs } from './shared'

const NOW = Date.parse('2026-09-28T04:00:00Z') // noon in Manila

describe('announcementStatus', () => {
  it('reads offset-less DB timestamps as UTC', () => {
    expect(utcMs('2026-09-28T03:00:00')).toBe(Date.parse('2026-09-28T03:00:00Z'))
    expect(utcMs('2026-09-28T03:00:00+00:00')).toBe(Date.parse('2026-09-28T03:00:00Z'))
  })

  it('draft, scheduled, live, expired', () => {
    expect(announcementStatus({ published_at: null }, NOW)).toBe('draft')
    expect(announcementStatus({ published_at: '2026-09-28T05:00:00' }, NOW)).toBe('scheduled')
    expect(announcementStatus({ published_at: '2026-09-28T03:00:00' }, NOW)).toBe('live')
    expect(announcementStatus({ published_at: '2026-09-20T00:00:00', expires_at: '2026-09-27T00:00:00' }, NOW)).toBe('expired')
  })
})
