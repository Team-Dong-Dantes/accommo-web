import { describe, expect, it } from 'vitest'
import type { Ticket } from '@/composables/useTickets'
import { groupReports, isOverdue, sortGroups, ticketRef, waitAge, waitingSince } from './ticketTriage'

const H = 3600 * 1000
const iso = (hAgo: number, now = Date.parse('2026-09-26T12:00:00Z')) => new Date(now - hAgo * H).toISOString()

function t(p: Partial<Ticket> & { id: string }): Ticket {
  return {
    ref: '', subject: 'x', description: '', category: 'other', priority: 'medium', status: 'open',
    assignee: null, assigneeId: null, reporterName: p.id, reporterEmail: '', reporterPhone: '', reporterRole: 'student',
    accommodationName: null, accommodationId: null, room: '—', landlordName: null, initials: '', avatarColor: 'teal-6', avatarUrl: '',
    reportedAt: iso(10), updatedAt: iso(10), photoUrls: [], messages: [], lastPreview: '', lastRequesterText: '', lastReplyAt: null,
    waitingSince: iso(10), unread: 0, ...p,
  }
}

describe('ticketRef', () => {
  it('pads the ticket number', () => expect(ticketRef(42, 'abcd')).toBe('TKT-0042'))
  it('falls back to the uuid prefix without one', () => expect(ticketRef(null, '3f9a-1c')).toBe('TKT-3F9A'))
})

describe('waitingSince', () => {
  const student = (h: number) => ({ authorRole: 'student' as const, isInternal: false, createdAt: iso(h) })
  const reply = (h: number) => ({ authorRole: 'agent' as const, isInternal: false, createdAt: iso(h) })
  const note = (h: number) => ({ authorRole: 'agent' as const, isInternal: true, createdAt: iso(h) })

  it('is the report time when nobody has replied', () => expect(waitingSince([], iso(50), 'open')).toBe(iso(50)))
  it('is null once support has the last word', () => expect(waitingSince([student(9), reply(5)], iso(10), 'open')).toBeNull())
  it('restarts at the first requester message after a reply', () =>
    expect(waitingSince([reply(9), student(6), student(3)], iso(10), 'in_progress')).toBe(iso(6)))
  it('does not count an internal note as a reply', () => expect(waitingSince([note(5)], iso(10), 'open')).toBe(iso(10)))
  it('is null for a resolved ticket', () => expect(waitingSince([], iso(99), 'resolved')).toBeNull())
})

describe('isOverdue', () => {
  const now = Date.parse('2026-09-26T12:00:00Z')
  it('turns at 48 hours', () => {
    expect(isOverdue(iso(47.9), now)).toBe(false)
    expect(isOverdue(iso(48), now)).toBe(true)
  })
  it('is never overdue when not waiting', () => expect(isOverdue(null, now)).toBe(false))
})

describe('groupReports', () => {
  it('merges one incident: same place, status and subject, within three days', () => {
    const g = groupReports([
      t({ id: 'a', accommodationId: 'h1', subject: 'No water', reportedAt: iso(30) }),
      t({ id: 'b', accommodationId: 'h1', subject: '  no  WATER ', reportedAt: iso(20) }),
    ])
    expect(g).toHaveLength(1)
    expect(g[0]!.reports.map((r) => r.id)).toEqual(['a', 'b'])
  })
  it('keeps different places, statuses, far-apart dates and placeless tickets apart', () => {
    const g = groupReports([
      t({ id: 'a', accommodationId: 'h1', subject: 'No water', reportedAt: iso(200) }),
      t({ id: 'b', accommodationId: 'h2', subject: 'No water', reportedAt: iso(199) }),
      t({ id: 'c', accommodationId: 'h1', subject: 'No water', status: 'resolved', reportedAt: iso(198) }),
      t({ id: 'd', accommodationId: 'h1', subject: 'No water', reportedAt: iso(10) }),
      t({ id: 'e', subject: 'Transfer', reportedAt: iso(9) }),
      t({ id: 'f', subject: 'Transfer', reportedAt: iso(8) }),
    ])
    expect(g).toHaveLength(6)
  })
  it('leads with the longest-waiting report', () => {
    const g = groupReports([
      t({ id: 'a', accommodationId: 'h1', subject: 'x', reportedAt: iso(30), waitingSince: null }),
      t({ id: 'b', accommodationId: 'h1', subject: 'x', reportedAt: iso(20), waitingSince: iso(20) }),
    ])
    expect(g[0]!.lead.id).toBe('b')
  })
})

describe('sortGroups', () => {
  it('puts waiting first, then priority, then longest wait', () => {
    const rows = groupReports([
      t({ id: 'answered-high', priority: 'high', waitingSince: null }),
      t({ id: 'low-old', priority: 'low', waitingSince: iso(100) }),
      t({ id: 'high-new', priority: 'high', waitingSince: iso(5) }),
      t({ id: 'high-old', priority: 'high', waitingSince: iso(50) }),
    ])
    expect(sortGroups(rows).map((g) => g.lead.id)).toEqual(['high-old', 'high-new', 'low-old', 'answered-high'])
  })
})

describe('waitAge', () => {
  const now = Date.parse('2026-09-26T12:00:00Z')
  it('reads as a size', () => {
    expect(waitAge(iso(0.5), now)).toBe('30m')
    expect(waitAge(iso(47), now)).toBe('47h')
    expect(waitAge(iso(120), now)).toBe('5d')
  })
})
