// Ticket-window shared types + option lists.
// Shared ticket workspace types.

export interface MsgGroup {
  day: string
  items: any[]
}

export interface TicketOption {
  value: string
  label: string
}

export const STATUS_OPTS: TicketOption[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

export const PRIORITY_OPTS: TicketOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

import type { Ticket } from '@/composables/useTickets'

const priorityRank = (t: Ticket) => PRIORITY_OPTS.findIndex((o) => o.value === t.priority)

/**
 * The triage table's columns. Here rather than in TicketTable.vue because the
 * page sorts its tickets by them before slicing out a page. `field` is what a
 * header click sorts by.
 */
export const TICKET_COLUMNS = [
  { name: 'ticket', label: 'TICKET', align: 'left' as const, field: 'ref', headerClasses: 'tk-grow' },
  { name: 'requester', label: 'REQUESTER', align: 'left' as const, field: 'reporterName', headerClasses: 'tk-wide' },
  { name: 'place', label: 'PLACE', align: 'left' as const, field: 'accommodationName' },
  { name: 'category', label: 'CATEGORY', align: 'left' as const, field: 'category', headerClasses: 'tk-narrow' },
  { name: 'priority', label: 'PRIORITY', align: 'left' as const, field: priorityRank, headerClasses: 'tk-narrow' },
  // Newest wait first when ascending, so the longest waits come up on a second click.
  { name: 'waiting', label: 'WAITING', align: 'left' as const, field: (t: Ticket) => (t.waitingSince ? -Date.parse(t.waitingSince) : null) },
  { name: 'assignee', label: 'ASSIGNEE', align: 'left' as const, field: 'assignee', headerClasses: 'tk-wide' },
]

export function stLabel(key: string): string {
  const map: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  }
  return map[key] ?? key
}

export function stLabelPlain(key: string): string {
  const map: Record<string, string> = {
    open: 'Open',
    in_progress: 'In progress',
    resolved: 'Resolved',
    urgent: ' Urgent',
    high: ' High',
    medium: ' Medium',
    low: ' Low',
  }
  return map[key] ?? key
}

export interface ReplyTemplate {
  key: string
  label: string
  text: string
}

export const REPLY_TEMPLATES: ReplyTemplate[] = [
  { key: 'ack', label: 'Acknowledged', text: 'Thank you for reaching out. We have received your ticket and a member of our team is looking into this now.' },
  { key: 'update', label: 'Request update', text: 'Could you share a little more detail or a photo so we can investigate further?' },
]
