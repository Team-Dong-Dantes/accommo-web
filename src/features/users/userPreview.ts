// User → DetailDrawer preview construction + private helpers.
// Extracted verbatim from pages/admin/Users.vue; the page keeps the fetch
// logic and passes its refs' values in.

import { getTone, getStatus, type StatusTone } from '@/utils/status.config'
import type { DrawerPreview, PreviewChip } from '@/features/drawer/preview'

export function cap(s: string | null | undefined) {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function composeAddress(p: any) {
  if (!p) return '—'
  const parts = [p.address, p.barangay, p.city].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function periodLabel(start: string | null, end: string | null) {
  const s = fmtDate(start)
  return end ? `${s} – ${fmtDate(end)}` : `${s} – Present`
}

export function fmtMinutes(m: number | null | undefined) {
  if (m == null) return '—'
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

export const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=160&background=0F766E&color=fff&bold=true`

function statusChip(label: string, tone: StatusTone, icon?: string): PreviewChip {
  const c: PreviewChip = { text: label, tone }
  if (icon) c.icon = icon
  return c
}

export interface UserDetailInput {
  selectedUser: any | null
  userDetail: any | null
  housing: any | null
  boardingHistory: any[]
  accommodationRows: any[]
  userReviews: any[]
}

export function buildUserPreview(input: UserDetailInput): DrawerPreview {
  const { selectedUser: u, userDetail: detail, housing, boardingHistory, accommodationRows, userReviews } = input
  if (!u) return { title: 'User Preview', name: '', avatar: '', stats: [], details: [] }

  const isStudent = (u.role || '').toLowerCase() === 'student'
  const isAccommodationManager = (u.role || '').toLowerCase() === 'accommodation_manager'
  const respTime = fmtMinutes(detail?.avg_response_minutes)

  const roleChip: PreviewChip = isStudent
    ? { text: 'Student', tone: 'neutral', icon: 'mdi:school' }
    : isAccommodationManager
      ? { text: 'Accommodation Manager', tone: 'primary', icon: 'mdi:domain' }
      : { text: cap(u.role), tone: 'neutral' }

  const chips: PreviewChip[] = [roleChip, statusChip(u.status, u.statusStyle?.tone ?? 'neutral', u.statusStyle?.icon)]

  const stats = isAccommodationManager
    ? [
        { label: 'Accommodations', value: accommodationRows.length },
        { label: 'Response Rate', value: detail?.response_rate != null ? `${detail.response_rate}%` : '—' },
        { label: 'Avg Response', value: respTime },
      ]
    : []

  const telLink = (c: string) => c.startsWith('+') ? `tel:${c.replace(/\s/g, '')}` : undefined
  type PDetail = NonNullable<DrawerPreview['details']>[number]
  const detailRow = (label: string, value: string, link?: string): PDetail => {
    const row: PDetail = { label, value }
    if (link) row.link = link
    return row
  }

  const details = isStudent
    ? [
        detailRow('Email', u.email, `mailto:${u.email}`),
        detailRow('Phone', u.contact, telLink(u.contact)),
        detailRow('College', detail?.college || '—'),
        detailRow('Program', detail?.program || '—'),
        detailRow('Year Level', detail?.year_level ?? '—'),
        detailRow('Student ID', detail?.student_id || '—'),
        detailRow('Joined', u.joined),
      ]
    : [
        detailRow('Email', u.email, `mailto:${u.email}`),
        detailRow('Phone', u.contact, telLink(u.contact)),
        detailRow('Joined', u.joined),
      ]

  let card: DrawerPreview['card']
  const historyCards: any[] = []
  if (isStudent) {
    if (housing?.placed) {
      const h = housing
      historyCards.push({
        icon: 'mdi:home',
        title: h.accommodationName,
        status: 'Current',
        statusTone: 'success',
        active: true,
        roomType: h.roomType || '—',
        location: h.address,
        date: `Move-in ${fmtDate(h.moveIn)}`,
        accommodationId: h.accommodationId,
      })
    }
    boardingHistory.forEach((hh) => {
      historyCards.push({
        icon: 'mdi:history',
        title: hh.accommodationName,
        status: 'Past',
        statusTone: 'neutral',
        roomType: hh.roomType || '—',
        location: hh.address,
        date: hh.period,
        accommodationId: hh.accommodationId,
      })
    })
  } else if (isAccommodationManager && accommodationRows.length) {
    const p = accommodationRows[0]
    card = {
      title: 'Active Listing',
      accommodationId: p.id,
      head: { title: p.name, location: composeAddress(p), status: cap(p.status), statusTone: getTone(p.status) },
      cells: [
        { label: 'Type', value: cap(p.room_type) },
        { label: 'Rooms', value: p.total_rooms != null ? String(p.total_rooms) : '—' },
        { label: 'Rating', value: p.rating_avg != null ? `${p.rating_avg.toFixed(1)} ★` : 'No rating' },
        { label: 'Reviews', value: String(p.reviews_count || 0) },
      ],
    }
  }

  type PReview = NonNullable<DrawerPreview['reviews']>
  const reviews: PReview = userReviews.map((r: any) => ({
    author: r.author_name || 'Anonymous',
    rating: r.rating,
    comment: r.comment || undefined,
    time: fmtDate(r.created_at),
  }))

  // Activity feed — what the user has actually done / experienced in the app,
  // derived from real lifecycle events (most recent first).
  type ActivityEvent = { text: string; time: string; ts: number; icon: string; tone: StatusTone }
  const events: ActivityEvent[] = []

  if (u.joined) {
    const ts = new Date(u.joined).getTime()
    if (!isNaN(ts)) {
      events.push({
        text: `<strong>${u.name}</strong> created their account`,
        time: fmtDate(u.joined),
        ts,
        icon: 'mdi:account-plus',
        tone: 'primary',
      })
    }
  }

  if (isStudent && detail?.osas_verified_at) {
    const ts = new Date(detail.osas_verified_at).getTime()
    if (!isNaN(ts)) {
      events.push({
        text: `<strong>${u.name}</strong> was verified by OSAS`,
        time: fmtDate(detail.osas_verified_at),
        ts,
        icon: 'mdi:shield-check',
        tone: 'success',
      })
    }
  }

  if (isStudent && housing?.placed && housing.moveIn) {
    const ts = new Date(housing.moveIn).getTime()
    if (!isNaN(ts)) {
      events.push({
        text: `Moved into <strong>${housing.accommodationName}</strong>`,
        time: fmtDate(housing.moveIn),
        ts,
        icon: 'mdi:home',
        tone: 'success',
      })
    }
  }

  boardingHistory.forEach((hh) => {
    const ts = new Date(hh.period_start).getTime()
    if (isNaN(ts)) return
    events.push({
      text: `Boarded at <strong>${hh.accommodationName}</strong>`,
      time: hh.period,
      ts,
      icon: 'mdi:history',
      tone: 'neutral',
    })
  })

  userReviews.forEach((r) => {
    const ts = new Date(r.created_at).getTime()
    if (isNaN(ts)) return
    const author = r.author_name && r.author_name !== 'Anonymous' ? ` from ${r.author_name}` : ''
    events.push({
      text: `Received a <strong>${r.rating}★</strong> review${author}`,
      time: fmtDate(r.created_at),
      ts,
      icon: 'mdi:star',
      tone: 'warning',
    })
  })

  events.sort((a, b) => b.ts - a.ts)

  const activity = events.length
    ? events.map((e) => ({ text: e.text, time: e.time, icon: e.icon, tone: e.tone }))
    : [{ text: `<strong>${u.name}</strong> has no recorded activity yet`, time: '', icon: 'mdi:calendar-blank', tone: 'neutral' as StatusTone }]

  const files: { name: string; url: string }[] = []
  if (isStudent) {
    if (detail?.school_id_url) files.push({ name: 'School ID', url: detail.school_id_url })
    if (detail?.assessment_of_fees_url) files.push({ name: 'Assessment of Fees', url: detail.assessment_of_fees_url })
  } else if (isAccommodationManager) {
    if (detail?.government_id_url) files.push({ name: 'Government ID', url: detail.government_id_url })
  }

  type PHistory = NonNullable<DrawerPreview['history']>
  const history: PHistory = []
  let placement: DrawerPreview['placement']
  if (isStudent) {
    if (housing?.placed) {
      const h = housing
      placement = {
        status: 'Housed',
        statusTone: 'success',
        accommodation: h.accommodationName || 'Accommodation',
        roomType: h.roomType,
        accommodationManager: h.accommodationManagerName,
        address: h.address,
        moveIn: fmtDate(h.moveIn),
      }
      history.push({
        title: h.accommodationName || 'Active Placement',
        desc: [cap(h.roomType), h.accommodationManagerName, h.address].filter(Boolean).join(' · '),
        meta: `Move-in ${fmtDate(h.moveIn)}`,
        tone: 'success',
        icon: 'mdi:home',
        active: true,
      })
    } else {
      placement = { status: 'Not placed', statusTone: 'neutral', accommodation: 'No active placement' }
      history.push({ title: 'No active placement', tone: 'neutral', icon: 'mdi:home-outline' })
    }
    boardingHistory.forEach((hh) => {
      history.push({
        title: hh.accommodationName || 'Boarding',
        desc: [hh.roomType ? cap(hh.roomType) : '', hh.address].filter(Boolean).join(' · '),
        meta: hh.period,
        tone: 'neutral',
        icon: 'mdi:history',
      })
    })
  }

  const result: DrawerPreview = {
    title: 'User Preview',
    viewDetailsLabel: 'View Full Details',
    name: u.name,
    avatar: avatarUrl(u.name),
    chips,
    stats,
    details,
    activity,
  }
  if (card) result.card = card
  if (isStudent) {
    result.history = history
    result.historyCards = historyCards
    if (placement) result.placement = placement
  }
  result.files = files
  result.reviews = reviews
  return result
}
