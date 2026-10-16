// How the verification queue's rows become requests. Pure: useVerifications
// fetches, this shapes.
import { getInitials, capitalize, getTimeAgo, ageInDays, formatPhone, humanizeEnum } from '@/utils/format'
import type { ApplicantDetails } from '@/api/users'
import {
  ACCOMMODATION_PERMITS, APPLICANT_REQUIREMENTS, INSTITUTIONAL_DOMAIN, REVIEW_TARGET_DAYS, ROUND_KIND_LABEL,
  byQueueOrder, checklist, getStatusStyle, ordinalYear, studentRecordChecks,
  type QueueDocumentRow, type RoundKind, type VerificationRequest,
} from '@/features/verifications/queue'

/** One row per account, its pending documents gathered under it. */
export function groupQueueRows(queueRows: any[] | null) {
  const grouped = new Map<string, any>()
  for (const row of (queueRows ?? []) as any[]) {
    const existing = grouped.get(row.user_id) ?? {
      id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      role: row.role,
      status: row.user_status,
      avatar_url: row.avatar_url,
      created_at: row.created_at,
      reviewing_at: row.reviewing_at,
      reviewing_by: row.reviewing_by,
      documents: [],
    }
    if (row.file_url) {
      existing.documents.push({
        id: row.doc_id,
        doc_type: row.doc_type,
        file_url: row.file_url,
        filename: row.filename,
      })
    }
    grouped.set(row.user_id, existing)
  }

  return Array.from(grouped.values())
}

/** An account (student or landlord/landlady) as a queue request. */
export function toAccountRequest(
  user: any,
  manager: boolean,
  details: Map<string, ApplicantDetails> | null,
  applicants: Set<string>,
): VerificationRequest {
  const files = user.documents.map((document: QueueDocumentRow) => ({
    id: document.id,
    name: document.filename || document.doc_type || 'Verification document',
    // Kept so the row can say which requirement is in, not just how many.
    type: document.doc_type ?? undefined,
    // Signed on demand in selectRequest — documents have no readable URL.
    url: '',
  }))
  const detail = details?.get(user.id)
  const requirements = [
    ...checklist(APPLICANT_REQUIREMENTS[manager ? 'landlord' : 'student'], files),
    ...(!manager && details ? studentRecordChecks(detail ?? { phone: null, student_id: null, college: null, program: null, year_level: null }) : []),
  ]
  const ageDays = user.created_at ? ageInDays(user.created_at) : null
  const email = String(user.email ?? '')
  return {
    // Row identity only; no longer shown — it was the uuid's first four
    // characters, which two students could share.
    id: `REQ-${manager ? 'AM' : 'S'}${user.id.substring(0, 4).toUpperCase()}`,
    rawId: user.id,
    name: user.full_name || (manager ? 'Unknown Landlord/Landlady' : 'Unknown Student'),
    email,
    owner: '',
    initials: getInitials(user.full_name),
    type: manager ? 'Landlord/Landlady Identity' : 'Enrollment Form / COR',
    files,
    status: capitalize(user.status),
    statusStyle: getStatusStyle(user.status),
    submitted: getTimeAgo(user.created_at),
    submittedAt: user.created_at ?? null,
    reviewingAt: user.reviewing_at ?? null,
    reviewingBy: user.reviewing_by ?? null,
    avatarColor: manager ? 'teal-7' : 'blue-6',
    avatarUrl: user.avatar_url || '',
    requirements,
    ready: requirements.every((item) => item.ok),
    applying: !manager && applicants.has(user.id),
    ageDays,
    late: ageDays !== null && ageDays > REVIEW_TARGET_DAYS,
    nonInstitutionalEmail: !manager && !!email && !email.toLowerCase().endsWith(INSTITUTIONAL_DOMAIN),
    studentNumber: detail?.student_id ?? '',
    college: detail?.college ?? '',
    yearLevel: ordinalYear(detail?.year_level),
    phone: detail?.phone ? formatPhone(detail.phone) : '',
    location: '',
    accommodationType: '',
  }
}

/** Every listing with an open accreditation round, as queue requests. */
export function toAccommodationRequests(rounds: any[], documents: any[] | null, pastRounds: any[] | null): VerificationRequest[] {
  // Latest version of each permit only. Every version used to be listed,
  // so a resubmitted listing showed the rejected file beside its fix.
  const latestDocs = new Map<string, any[]>()
  for (const document of documents ?? []) {
    if (!document.accommodation_id) continue
    const list = latestDocs.get(document.accommodation_id) ?? []
    if (!list.some((d) => d.doc_type === document.doc_type)) list.push(document)
    latestDocs.set(document.accommodation_id, list)
  }
  const previousRound = new Map<string, any>()
  for (const past of pastRounds ?? []) {
    if (!previousRound.has(past.accommodation_id)) previousRound.set(past.accommodation_id, past)
  }

  return rounds.map((r: any) => {
    const p = r.accommodation
    const landlordRow = (Array.isArray(p.landlord) ? p.landlord[0] : p.landlord) as any
    const ownerName = landlordRow?.full_name || 'Unknown Landlord/Landlady'
    const previous = previousRound.get(p.id) ?? null
    const live = !['pending', 'reviewing'].includes(String(p.status))
    // A live listing keeps its own status; whether someone has it open is
    // the claim alone.
    const queueStatus = live ? (p.reviewing_by ? 'reviewing' : 'pending') : String(p.status)
    const files = (latestDocs.get(p.id) ?? []).map((document) => ({
      id: document.id,
      name: ACCOMMODATION_PERMITS.find((permit) => permit.type === document.doc_type)?.label ?? document.doc_type,
      type: document.doc_type,
      // Signed on demand in selectRequest — permits have no readable URL.
      url: '',
      expiresAt: document.expires_at ?? null,
      version: document.version ?? 1,
      sha256: document.file_sha256 ?? null,
      // Replaced since OSAS last sent it back, which is what a reviewer
      // checks first on a resubmission.
      replaced: Boolean(
        previous?.decided_at &&
        (previous.flagged_docs ?? []).includes(document.doc_type) &&
        document.uploaded_at &&
        new Date(document.uploaded_at) > new Date(previous.decided_at),
      ),
    }))
    // Short names: four chips have to share one cell.
    const requirements = checklist(
      ACCOMMODATION_PERMITS.map((permit) => ({ ...permit, label: permit.label.replace(/ permit$/, '') })),
      files,
    )
    const submittedAt: string | null = r.submitted_at ?? null
    const ageDays = submittedAt ? ageInDays(submittedAt) : null
    return {
      requirements,
      ready: requirements.every((item) => item.ok),
      applying: false,
      ageDays,
      // No review target exists for accreditation, so nothing reads as late.
      late: false,
      nonInstitutionalEmail: false,
      studentNumber: '',
      college: '',
      yearLevel: '',
      phone: '',
      location: [p.purok, p.barangay, p.city].filter(Boolean).join(', '),
      accommodationType: p.accommodation_type ? humanizeEnum(p.accommodation_type) : '',
      id: `REQ-AC${p.id.substring(0, 4).toUpperCase()}`,
      rawId: p.id,
      name: p.name || 'Unnamed Accommodation',
      email: '',
      owner: ownerName,
      ownerId: p.landlord_id,
      initials: getInitials(p.name),
      type: ROUND_KIND_LABEL[r.kind as RoundKind] ?? 'OSAS Accreditation',
      files,
      status: capitalize(queueStatus),
      statusStyle: getStatusStyle(queueStatus),
      submitted: submittedAt ? getTimeAgo(submittedAt) : 'Unknown',
      submittedAt,
      reviewingAt: p.reviewing_at ?? null,
      reviewingBy: p.reviewing_by ?? null,
      avatarColor: 'orange-6',
      // A property, not a person — the initials circle is the whole avatar.
      avatarUrl: '',
      round: {
        id: r.id,
        number: r.round,
        kind: r.kind as RoundKind,
        live,
        listingStatus: String(p.status),
        message: r.message ?? null,
        proposedChanges: (r.proposed_changes ?? null) as Record<string, unknown> | null,
        expiresAt: p.accreditation_expires_at ?? null,
        previous: previous
          ? {
            decision: previous.decision,
            decidedAt: previous.decided_at,
            flaggedDocs: previous.flagged_docs ?? [],
            tags: previous.tags ?? [],
            note: previous.note ?? null,
          }
          : null,
      },
      accommodation: {
        accommodation_type: p.accommodation_type ?? null,
        description: p.description ?? null,
        gender_policy: p.gender_policy ?? null,
        purok: p.purok ?? null,
        barangay: p.barangay ?? null,
        city: p.city ?? null,
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        landlord_email: landlordRow?.email ?? null,
        landlord_phone: landlordRow?.phone ?? null,
        landlord_status: landlordRow?.status ?? null,
        landlord_sex: landlordRow?.sex ?? null,
      },
    }
  }).sort(byQueueOrder)
}
