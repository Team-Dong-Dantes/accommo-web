// User → DetailDrawer preview construction + private helpers.
// Extracted verbatim from pages/admin/Users.vue; the page keeps the fetch
// logic and passes its refs' values in.

import { getTone, type StatusTone } from '@/utils/status.config'
import { escapeHtml, humanizeEnum } from '@/utils/format'
import type { DrawerPreview, PreviewChip, PreviewLease, PreviewPayment } from '@/features/drawer/preview'

const DOC_LABELS: Record<string, string> = {
  school_id: 'School ID',
  assessment_of_fees: 'Assessment of Fees',
  government_id: 'Government ID',
  business_permit: 'Business Permit',
}

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

function leaseStatusTone(status: string): StatusTone {
  switch (status) {
    case 'active': return 'success'
    case 'terminated': return 'danger'
    case 'leave_requested': return 'warning'
    default: return 'neutral'
  }
}

function paymentStatusTone(status: string): StatusTone {
  switch (status) {
    case 'paid': return 'success'
    case 'overdue': return 'danger'
    case 'due':
    case 'pending_verification': return 'warning'
    default: return 'neutral'
  }
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'gcash': return 'GCash'
    case 'maya': return 'Maya'
    case 'bank': return 'Bank Transfer'
    case 'cash': return 'Cash'
    case 'others': return 'Other'
    default: return cap(method) || '—'
  }
}

function fmtCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtMonth(month: string): string {
  if (!month) return '—'
  const [year, m] = month.split('-')
  if (!year || !m) return month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const mi = parseInt(m, 10) - 1
  if (mi < 0 || mi > 11) return month
  return `${months[mi]} ${year}`
}

export interface UserDetailInput {
  selectedUser: any | null
  userDetail: any | null
  housing: any | null
  boardingHistory: any[]
  accommodationRows: any[]
  userReviews: any[]
  /** Rows from `verification_documents` for this user. */
  verificationDocs?: {
    id: string
    doc_type: string
    filename: string | null
    file_url: string | null
    status: string | null
    uploaded_at?: string | null
    verified_at?: string | null
  }[]
  leases?: any[]
  payments?: any[]
}

export function buildUserPreview(input: UserDetailInput): DrawerPreview {
  const { selectedUser: u, userDetail: detail, housing, boardingHistory, accommodationRows, userReviews, verificationDocs, leases, payments } = input
  if (!u) return { title: 'User Preview', name: '', avatar: '', stats: [], detailGroups: [] }

  const isStudent = (u.role || '').toLowerCase() === 'student'
  const isAccommodationManager = (u.role || '').toLowerCase() === 'accommodation_manager'
  const respTime = fmtMinutes(detail?.avg_response_minutes)

  const roleChip: PreviewChip = isStudent
    ? { text: 'Student', tone: 'neutral', icon: 'lucide:graduation-cap' }
    : isAccommodationManager
      ? { text: 'Accommodation Manager', tone: 'primary', icon: 'lucide:building-2' }
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
  type PDetail = NonNullable<DrawerPreview['detailGroups']>[number]['rows'][number]
  const detailRow = (label: string, value: string, link?: string): PDetail => {
    const row: PDetail = { label, value }
    if (link) row.link = link
    return row
  }

  const contactGroup = {
    title: 'Contact',
    icon: 'lucide:contact',
    rows: [
      detailRow('Email', u.email, `mailto:${u.email}`),
      detailRow('Phone', u.contact, telLink(u.contact)),
      detailRow('Date of birth', fmtDate(u.dateOfBirth)),
    ],
  }
  const accountGroup = {
    title: 'Account',
    icon: 'lucide:user',
    rows: [detailRow('Joined', u.joined)],
  }
  // Managers have no academic record, so they get two sections rather than an
  // Academic block full of "Not set".
  const detailGroups = isStudent
    ? [
        contactGroup,
        {
          title: 'Academic',
          icon: 'lucide:graduation-cap',
          rows: [
            detailRow('College', detail?.college || '—'),
            detailRow('Program', detail?.program || '—'),
            detailRow('Year Level', String(detail?.year_level ?? '—')),
            detailRow('Student ID', detail?.student_id || '—'),
          ],
        },
        accountGroup,
      ]
    : [contactGroup, accountGroup]

  let card: DrawerPreview['card']
  const historyCards: any[] = []
  if (isStudent) {
    if (housing?.placed) {
      const h = housing
      historyCards.push({
        icon: 'lucide:house',
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
        icon: 'lucide:history',
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
  //
  // `text` is rendered with v-html by ActivityTab.vue so the names can be
  // bolded, which makes every value spliced in here an injection point: names
  // and accommodation names are typed by users. escapeHtml() on each one; the
  // <strong> tags are ours and stay literal.
  type ActivityEvent = { text: string; time: string; ts: number; icon: string; tone: StatusTone }
  const events: ActivityEvent[] = []

  if (u.joined) {
    const ts = new Date(u.joined).getTime()
    if (!isNaN(ts)) {
      events.push({
        text: `<strong>${escapeHtml(u.name)}</strong> created their account`,
        time: fmtDate(u.joined),
        ts,
        icon: 'lucide:user-plus',
        tone: 'primary',
      })
    }
  }

  if (isStudent && detail?.osas_verified_at) {
    const ts = new Date(detail.osas_verified_at).getTime()
    if (!isNaN(ts)) {
      events.push({
        text: `<strong>${escapeHtml(u.name)}</strong> was verified by OSAS`,
        time: fmtDate(detail.osas_verified_at),
        ts,
        icon: 'lucide:shield-check',
        tone: 'success',
      })
    }
  }

  if (isStudent && housing?.placed && housing.moveIn) {
    const ts = new Date(housing.moveIn).getTime()
    if (!isNaN(ts)) {
      events.push({
        text: `Moved into <strong>${escapeHtml(housing.accommodationName)}</strong>`,
        time: fmtDate(housing.moveIn),
        ts,
        icon: 'lucide:house',
        tone: 'success',
      })
    }
  }

  boardingHistory.forEach((hh) => {
    const ts = new Date(hh.period_start).getTime()
    if (isNaN(ts)) return
    events.push({
      text: `Boarded at <strong>${escapeHtml(hh.accommodationName)}</strong>`,
      time: hh.period,
      ts,
      icon: 'lucide:history',
      tone: 'neutral',
    })
  })

  userReviews.forEach((r) => {
    const ts = new Date(r.created_at).getTime()
    if (isNaN(ts)) return
    const author = r.author_name && r.author_name !== 'Anonymous' ? ` from ${escapeHtml(r.author_name)}` : ''
    events.push({
      text: `Received a <strong>${r.rating}★</strong> review${author}`,
      time: fmtDate(r.created_at),
      ts,
      icon: 'lucide:star',
      tone: 'warning',
    })
  })

  for (const doc of verificationDocs ?? []) {
    const label = DOC_LABELS[doc.doc_type] || humanizeEnum(doc.doc_type)
    const uploadedTs = doc.uploaded_at ? new Date(doc.uploaded_at).getTime() : NaN
    if (!isNaN(uploadedTs)) {
      events.push({
        text: `Uploaded <strong>${escapeHtml(label)}</strong>`,
        time: fmtDate(doc.uploaded_at),
        ts: uploadedTs,
        icon: 'lucide:file-up',
        tone: 'info',
      })
    }
    const reviewedTs = doc.verified_at ? new Date(doc.verified_at).getTime() : NaN
    if (!isNaN(reviewedTs) && doc.status && doc.status !== 'pending') {
      events.push({
        text: `<strong>${escapeHtml(label)}</strong> ${doc.status === 'approved' ? 'approved' : cap(doc.status)}`,
        time: fmtDate(doc.verified_at),
        ts: reviewedTs,
        icon: doc.status === 'approved' ? 'lucide:badge-check' : 'lucide:octagon-x',
        tone: doc.status === 'approved' ? 'success' : 'danger',
      })
    }
  }

  events.sort((a, b) => b.ts - a.ts)

  const activity = events.map((e) => ({ text: e.text, time: e.time, icon: e.icon, tone: e.tone }))

  // Uploads live in `verification_documents`, which is also the only place a
  // manager's business permit exists. The profile URL columns are kept as a
  // fallback for records written before uploads were tracked there.
  const files: NonNullable<DrawerPreview['files']> = []
  const seen = new Set<string>()
  for (const doc of verificationDocs ?? []) {
    if (!doc.file_url) continue
    const label = DOC_LABELS[doc.doc_type] || humanizeEnum(doc.doc_type)
    files.push({
      name: doc.status && doc.status !== 'approved' ? `${label} · ${cap(doc.status)}` : label,
      url: doc.file_url,
      docId: doc.id,
      docTable: 'verification_documents',
      ...(doc.filename ? { filename: doc.filename } : {}),
    })
    seen.add(doc.doc_type)
  }
  const fallback = (type: string, label: string, url: string | null | undefined) => {
    if (url && !seen.has(type)) files.push({ name: label, url })
  }
  if (isStudent) {
    fallback('school_id', 'School ID', detail?.school_id_url)
    fallback('assessment_of_fees', 'Assessment of Fees', detail?.assessment_of_fees_url)
  } else if (isAccommodationManager) {
    fallback('government_id', 'Government ID', detail?.government_id_url)
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
        icon: 'lucide:house',
        active: true,
      })
    } else {
      placement = { status: 'Not placed', statusTone: 'neutral', accommodation: 'No active placement' }
    }
    boardingHistory.forEach((hh) => {
      history.push({
        title: hh.accommodationName || 'Boarding',
        desc: [hh.roomType ? cap(hh.roomType) : '', hh.address].filter(Boolean).join(' · '),
        meta: hh.period,
        tone: 'neutral',
        icon: 'lucide:history',
      })
    })
  }

    

  const leaseRows: PreviewLease[] = isStudent
    ? (leases || []).map((l: any) => {
        const acc = l.room?.accommodation
        return {
          id: l.id,
          accommodationId: acc?.id ?? '',
          accommodationName: acc?.name || l.accommodationName || '—',
          accommodationManagerName: l.accommodation_manager?.full_name,
          roomName: l.room?.room_number ?? l.room?.label,
          roomType: acc?.room_type,
          startDate: l.start_date,
          endDate: l.end_date,
          status: l.status,
          statusTone: leaseStatusTone(l.status),
          statusLabel: cap(l.status),
          // Room rent is the source of truth; the lease-level rent may be unset.
          monthlyRent: l.monthly_rent ?? l.room?.monthly_rent ?? null,
          periodLabel: periodLabel(l.start_date, l.end_date),
        }
      })
    : []

  const leaseById = new Map<string, PreviewLease>()
  leaseRows.forEach((l) => leaseById.set(l.id, l))

  const paymentRows: PreviewPayment[] = (payments || []).map((p: any) => {
    const lease = leaseById.get(p.lease_id)
    const row: PreviewPayment = {
      id: p.id,
      leaseId: p.lease_id,
      accommodationId: lease?.accommodationId ?? '',
      month: p.month,
      monthLabel: fmtMonth(p.month),
      amount: p.amount,
      amountLabel: fmtCurrency(p.amount),
      status: p.status,
      statusTone: paymentStatusTone(p.status),
      statusLabel: cap(p.status),
      paidAt: p.paid_at,
      method: p.method,
      methodLabel: paymentMethodLabel(p.method),
      proofUrl: p.proof_url,
      txnReference: p.txn_reference,
      description: p.description,
    }
    if (p.paid_at) row.paidAtLabel = fmtDate(p.paid_at)
    return row
  })

  const result: DrawerPreview = {
    title: 'User Preview',
    viewDetailsLabel: 'View Full Details',
    name: u.name,
    // Their own photo when they have one; the generated initials image is the
    // fallback, since this drawer header is always an image slot.
    avatar: u.avatarUrl || avatarUrl(u.name),
    chips,
    stats,
    detailGroups,
    activity,
  }
  if (card) result.card = card
  if (isStudent) {
       result.history = history
       result.historyCards = historyCards
       if (placement) result.placement = placement
       result.leases = leaseRows
       result.payments = paymentRows
       result.kind = 'user'
   }
  result.files = files
  result.reviews = reviews
  return result
}
