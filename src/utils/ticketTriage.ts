// Triage rules for the Support Tickets queue: who is waiting on whom, when
// that becomes overdue, which reports are the same issue, and the order the
// queue is worked in. Pure functions — useTickets shapes rows with them and the
// page/board consume the result — so ticketTriage.test.ts can pin every rule.

import type { Ticket } from '@/composables/useTickets'

/** A ticket waiting on a support reply this long is overdue, whatever its priority. */
export const OVERDUE_MS = 48 * 3600 * 1000

/** Reports of the same issue from one accommodation this close together are one incident. */
export const GROUP_WINDOW_MS = 3 * 86400 * 1000

const PRIORITY_RANK: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 }

export function ticketRef(ticketNo: number | null | undefined, id: string): string {
  // ticket_no arrived with migration 20260926120000; the uuid prefix is only a
  // fallback for a database that predates it (and read TKT-0000 for every
  // seeded row, which is why the column exists).
  if (ticketNo) return 'TKT-' + String(ticketNo).padStart(4, '0')
  return 'TKT-' + id.replace(/-/g, '').slice(0, 4).toUpperCase()
}

interface Msg {
  authorRole: 'student' | 'agent'
  isInternal: boolean
  createdAt: string
}

/**
 * When the requester started waiting on support, or null when they are not:
 * the ticket is resolved, or support's public reply is the latest word.
 * Internal notes are not replies — the requester never sees them. A ticket no
 * one has answered has been waiting since it was reported.
 */
export function waitingSince(messages: Msg[], reportedAt: string, status: string): string | null {
  if (status === 'resolved') return null
  let lastReply = -1
  messages.forEach((m, i) => {
    if (m.authorRole === 'agent' && !m.isInternal) lastReply = i
  })
  if (lastReply === -1) return reportedAt
  const next = messages.slice(lastReply + 1).find((m) => m.authorRole === 'student')
  return next ? next.createdAt : null
}

export function isOverdue(since: string | null, now = Date.now()): boolean {
  return !!since && now - new Date(since).getTime() >= OVERDUE_MS
}

/** One row in the queue: a ticket, plus any other reports of the same incident. */
export interface TicketGroup {
  key: string
  /** The report the row opens — the one that has waited longest. */
  lead: Ticket
  reports: Ticket[]
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Collapse reports of one incident into a row: same accommodation, same status,
 * same subject (ignoring case and spacing), reported within GROUP_WINDOW_MS of
 * the group's first report. Tickets with no accommodation are never grouped —
 * two students' "Request to transfer rooms" elsewhere are two requests.
 * Status is part of the key so the board's columns and the status tabs never
 * split a row across themselves.
 */
export function groupReports(tickets: Ticket[]): TicketGroup[] {
  const groups: TicketGroup[] = []
  const open = new Map<string, TicketGroup[]>()
  const byReported = [...tickets].sort((a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime())
  for (const t of byReported) {
    if (!t.accommodationId) {
      groups.push({ key: t.id, lead: t, reports: [t] })
      continue
    }
    const k = `${t.accommodationId}|${t.status}|${norm(t.subject)}`
    const candidates = open.get(k) ?? []
    const t0 = new Date(t.reportedAt).getTime()
    const hit = candidates.find((g) => t0 - new Date(g.reports[0]!.reportedAt).getTime() <= GROUP_WINDOW_MS)
    if (hit) {
      hit.reports.push(t)
    } else {
      const g: TicketGroup = { key: t.id, lead: t, reports: [t] }
      candidates.push(g)
      open.set(k, candidates)
      groups.push(g)
    }
  }
  for (const g of groups) g.lead = pickLead(g.reports)
  return groups
}

/** The report that has waited longest; failing that, the most recently updated. */
function pickLead(reports: Ticket[]): Ticket {
  return [...reports].sort(compareTickets)[0]!
}

/** A group's wait is its longest-waiting report's. */
export function groupWaitingSince(g: TicketGroup): string | null {
  return g.lead.waitingSince
}

/**
 * Queue order: waiting on us first, then priority, then longest wait. Tickets
 * waiting on the requester (or resolved) follow, most recently updated first.
 */
export function compareTickets(a: Ticket, b: Ticket): number {
  const wa = a.waitingSince ? 1 : 0
  const wb = b.waitingSince ? 1 : 0
  if (wa !== wb) return wb - wa
  const pr = (PRIORITY_RANK[b.priority] ?? 1) - (PRIORITY_RANK[a.priority] ?? 1)
  if (pr) return pr
  if (a.waitingSince && b.waitingSince) {
    return new Date(a.waitingSince).getTime() - new Date(b.waitingSince).getTime()
  }
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export function sortGroups(groups: TicketGroup[]): TicketGroup[] {
  return [...groups].sort((a, b) => compareTickets(a.lead, b.lead))
}

/** "5d", "7h", "40m" — a wait is read as a size, so it drops the "ago". */
export function waitAge(since: string, now = Date.now()) {
  const ms = now - new Date(since).getTime()
  const m = Math.max(1, Math.floor(ms / 60000))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
