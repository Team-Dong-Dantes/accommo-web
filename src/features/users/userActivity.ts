// A person's activity feed in the user record: what they have done and what
// OSAS decided, newest first.
import { cap, escapeHtml, fmtDate, humanizeEnum } from '@/utils/format'
import { accountActivity, type ActivityLine } from './accountActivity'
import type { UserDetailInput } from './userPreview'

export const DOC_LABELS: Record<string, string> = {
  school_id: 'School ID',
  assessment_of_fees: 'Assessment of Fees',
  government_id: 'Government ID',
  business_permit: 'Business Permit',
  // Property permit types, from accommodation_documents.
  sanitary_permit: 'Sanitary Permit',
  fire_safety: 'Fire Safety Certificate',
  building_permit: 'Building Permit',
}

export function userActivity(input: UserDetailInput, isStudent: boolean): ActivityLine[] {
  const { selectedUser: u, userDetail: detail, housing, boardingHistory, userReviews, verificationDocs } = input
  // Activity feed — what the user has actually done / experienced in the app,
  // derived from real lifecycle events (most recent first).
  //
  // `text` is rendered with v-html by ActivityFeed.vue so the names can be
  // bolded, which makes every value spliced in here an injection point: names
  // and accommodation names are typed by users. escapeHtml() on each one; the
  // <strong> tags are ours and stay literal.
  const events: ActivityLine[] = []

  if (u.joined) {
    const ts = new Date(u.joined).getTime()
    if (!isNaN(ts)) {
      events.push({
        text: `<strong>${escapeHtml(u.name)}</strong> created their account`,
        time: fmtDate(u.joined),
        ts,
        icon: 'lucide:user-plus',
        tone: 'primary',
        kind: 'Account',
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
        kind: 'Status',
        by: 'OSAS',
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
        kind: 'Housing',
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
      kind: 'Housing',
    })
  })

  userReviews.forEach((r) => {
    const ts = new Date(r.created_at).getTime()
    if (isNaN(ts)) return
    const author = r.author_name && r.author_name !== 'Anonymous' ? ` from ${escapeHtml(r.author_name)}` : ''
    events.push({
      text: `Received a <strong>${r.rating}★</strong> rating${author}`,
      time: fmtDate(r.created_at),
      ts,
      icon: 'lucide:star',
      tone: 'warning',
      kind: 'Ratings',
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
        kind: 'Documents',
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
        kind: 'Documents',
      })
    }
  }

  events.push(...accountActivity(input.accountEvents ?? []))

  events.sort((a, b) => b.ts - a.ts)
  return events
}
