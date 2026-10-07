import { ref, computed, watch, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { registerReset } from '@/utils/pageCache'
import { getStatus } from '@/utils/status.config'
import { getInitials, capitalize, getTimeAgo, ageInDays, formatPhone, humanizeEnum, landlordTitle } from '@/utils/format'
import { secureDocUrl } from '@/utils/docUrl'
import { fetchAccommodationExtras, type AccommodationExtras } from '@/api/accommodations'
import { fetchReviewProfile, fetchApplicantDetails, type ApplicantDetails, type ReviewProfile } from '@/api/users'
import { useReviewPresence } from '@/composables/useReviewPresence'
import { useAuthStore } from '@/stores/auth'
import { counted } from '@/utils/filterOptions'
import { sortRows, type SortState } from '@/composables/useSort'

/**
 * The property behind an accreditation request. An accommodation is not an
 * account, so none of `ReviewProfile` applies to it — what a reviewer checks
 * the permits against is the address, the size and the landlord/landlady behind it.
 */
export interface AccommodationFacts {
  accommodation_type: string | null
  description: string | null
  /** Amenities and house rules, loaded when the review window opens. */
  extras?: AccommodationExtras
  gender_policy: string | null
  purok?: string | null
  barangay: string | null
  city: string | null
  lat: number | null
  lng: number | null
  landlord_email: string | null
  landlord_phone: string | null
  landlord_status: string | null
  landlord_sex: string | null
}

export interface VerificationRequest {
  id: string
  rawId: string
  name: string
  email: string
  owner: string
  initials: string
  type: string
  files: QueueFile[]
  status: string
  statusStyle: { tone: string; icon: string }
  submitted: string
  /** When it arrived, ISO, for ordering. `submitted` is the same thing in words. */
  submittedAt: string | null
  /** When the current review claim was taken, ISO. Null when nobody holds it. */
  reviewingAt: string | null
  /** Who holds the claim (reviewing_by). Null when nobody does. */
  reviewingBy: string | null
  /** The account behind the request, loaded when the review window opens. */
  profile?: ReviewProfile
  /** The property behind an accreditation request, carried from the queue. */
  accommodation?: AccommodationFacts
  /** Accommodation tab: the open accreditation round this request is. */
  round?: RoundInfo
  avatarColor: string
  /** The applicant's profile photo. Empty for an accreditation request. */
  avatarUrl: string
  ownerId?: string
  /** Each file the applicant must supply, and whether it is in. */
  requirements: { label: string; ok: boolean }[]
  /** Every requirement is in, so the request can be decided now. */
  ready: boolean
  /** Whole days since it arrived; null when the arrival time is unknown. */
  ageDays: number | null
  /** Past the review target. Accreditation has no target, so never late. */
  late: boolean
  /** A student whose e-mail is not the university's own domain. */
  nonInstitutionalEmail: boolean
  /** Student tab: the student number, empty when not given. */
  studentNumber: string
  /** Student tab: the college, empty when not recorded. */
  college: string
  /** Student tab: "3rd year", empty when not recorded. */
  yearLevel: string
  /** Landlord/Landlady tab: the contact number. */
  phone: string
  /** Accommodation tab: barangay and city. */
  location: string
  /** Accommodation tab: the kind of accommodation, in words. */
  accommodationType: string
}

/**
 * OSAS's review target for account verifications, in days. Mirrors
 * VERIFICATION_REVIEW_SLA_DAYS on the dashboard.
 */
const REVIEW_TARGET_DAYS = 3

/**
 * The files each applicant role must supply, by the `doc_type` accommo-mobile
 * uploads them as (see its stores/auth.ts). A request is ready to decide when
 * all of them are in — a count of files, which is what this used to check,
 * called a landlord/landlady with a business permit and no ID complete.
 */
export const APPLICANT_REQUIREMENTS: Record<'student' | 'landlord', { type: string; label: string }[]> = {
  student: [
    { type: 'school_id', label: 'School ID' },
    { type: 'assessment_of_fees', label: 'Assessment of fees' },
  ],
  landlord: [
    { type: 'government_id', label: 'Government ID' },
    { type: 'business_permit', label: 'Business permit' },
  ],
}

const INSTITUTIONAL_DOMAIN = '@isu.edu.ph'

function checklist(required: { type: string; label: string }[], files: { type?: string }[]) {
  const have = new Set(files.map((file) => file.type))
  return required.map((item) => ({ label: item.label, ok: have.has(item.type) }))
}

function ordinalYear(year: number | null | undefined) {
  if (!year) return ''
  const suffix = year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'
  return `${year}${suffix} year`
}

/**
 * Ready to decide first, then those still waiting on the applicant; oldest
 * first inside each. A request that has waited longest is the one most overdue,
 * so it leads its group instead of sinking to the last page.
 */
function byQueueOrder(a: VerificationRequest, b: VerificationRequest) {
  if (a.ready !== b.ready) return a.ready ? -1 : 1
  return (a.submittedAt ?? '9999').localeCompare(b.submittedAt ?? '9999')
}

/** What an accreditation round asks OSAS to look at. */
export type RoundKind = 'new' | 'resubmission' | 'appeal' | 'renewal' | 'change' | 'permit_update'

export const ROUND_KIND_LABEL: Record<RoundKind, string> = {
  new: 'New accreditation',
  resubmission: 'Resubmission',
  appeal: 'Appeal',
  renewal: 'Renewal',
  change: 'Listing change',
  permit_update: 'Permit update',
}

/**
 * The open round behind an accommodation request, and the decision before it.
 * The accreditation term itself now lives in the database
 * (public.accreditation_term), next to the one function that stamps it.
 */
export interface RoundInfo {
  id: string
  number: number
  kind: RoundKind
  /** The listing stays visible to students while this is decided. */
  live: boolean
  /** accommodations.status as it stands. */
  listingStatus: string
  /** What the landlord/landlady wrote with it: the appeal, or a resubmission note. */
  message: string | null
  /** kind = 'change': the values asked for, by column. */
  proposedChanges: Record<string, unknown> | null
  expiresAt: string | null
  previous: {
    decision: 'approved' | 'returned' | 'rejected'
    decidedAt: string
    flaggedDocs: string[]
    tags: string[]
    note: string | null
  } | null
}

function getStatusStyle(status: string) {
  const def = getStatus(status)
  return { tone: def.tone, icon: def.icon || 'lucide:clock' }
}

const ACCOMMODATION_PERMITS = [
  { type: 'sanitary_permit', label: 'Sanitary permit' },
  { type: 'fire_safety', label: 'Fire safety permit' },
  { type: 'business_permit', label: 'Business permit' },
  { type: 'building_permit', label: 'Building permit' },
]

/** A document as the verification queue view returns it. */
interface QueueDocumentRow {
  id: string
  filename: string | null
  doc_type: string | null
}

/**
 * A file already mapped onto a queue request. `url` is empty until the request
 * is opened — documents have no readable URL without a signature — and `id` is
 * optional because the profile-column fallbacks carry a URL but no row.
 */
export interface QueueFile {
  id?: string
  name: string
  url: string
  type?: string
  /** Permits only: the expiry date the landlord/landlady gave, ISO date. */
  expiresAt?: string | null
  version?: number
  /** Permits only: SHA-256 of the file, for the duplicate check. */
  sha256?: string | null
  /** Permits only: replaced since OSAS last flagged it. */
  replaced?: boolean
}

// Module scope: the three queues survive navigation, so returning to
// Verifications shows them at once while fetch() refreshes them. Tabs, search,
// paging and the open request stay per visit. See utils/pageCache.ts.
const studentRequests = ref<VerificationRequest[]>([])
const landlordRequests = ref<VerificationRequest[]>([])
const accommodationRequests = ref<VerificationRequest[]>([])
const hasLoaded = ref(false)
registerReset(() => {
  studentRequests.value = []
  landlordRequests.value = []
  accommodationRequests.value = []
  hasLoaded.value = false
})

export function useVerifications() {
  const loading = ref(!hasLoaded.value)
  const notify = useNotify()

  const activeTab = ref<'student' | 'landlord' | 'accommodation'>('student')
  const search = ref('')
  const currentPage = ref(1)
  const selectedRequest = ref<VerificationRequest | null>(null)

  // Whether a request is still in review is on the row already (the lock note),
  // so the one filter left worth having is whether it can be decided now.
  const activeFilters = ref<{ readiness: string[] }>({ readiness: [] })
  // Counted from the open tab's requests, so an option never shows an empty list.
  const READINESS: Record<string, string> = { ready: 'Ready to decide', waiting: 'Waiting on the applicant' }
  const filterConfig = computed(() => {
    const rows = activeTab.value === 'landlord' ? landlordRequests.value
      : activeTab.value === 'accommodation' ? accommodationRequests.value : studentRequests.value
    return [{
      label: 'Readiness',
      key: 'readiness',
      options: counted(rows.map((r) => ({ readiness: r.ready ? 'ready' : 'waiting' })), 'readiness', (v) => READINESS[v] ?? v, ['ready', 'waiting']),
    }]
  })

  function clearFilters() {
    activeFilters.value = { readiness: [] }
  }

  // People are Verification's; accommodations are Accreditation's.
  const access = useAuthStore()
  const tabs = computed(() => [
    { name: 'student', label: 'Student' },
    { name: 'landlord', label: 'Landlord/Landlady' },
    { name: 'accommodation', label: 'Accommodation' },
  ].filter((t) => access.can(t.name === 'accommodation' ? 'accreditation' : 'verification')))
  watch(tabs, (list) => {
    if (list.length && !list.some((t) => t.name === activeTab.value)) activeTab.value = list[0]!.name as typeof activeTab.value
  }, { immediate: true })

  const searchPlaceholder = computed(() => {
    if (activeTab.value === 'student') return 'Search student name...'
    if (activeTab.value === 'landlord') return 'Search landlord/landlady name...'
    return 'Search accommodation name...'
  })

  // Each header names exactly what sits under it, in that tab's own words. Only
  // `action` is left flexible: it holds either a chevron or a lock note with a
  // reviewer's name and "Take over", which is genuinely variable-width.
  // Columns whose cell is drawn from other fields sort by what the cell shows.
  const SORT_VALUE: Record<string, (r: VerificationRequest) => unknown> = {
    entity: (r) => r.name,
    requirements: (r) => r.requirements.filter((q) => q.ok).length,
    waiting: (r) => r.ageDays,
  }
  const columns = computed(() => {
    const col = (name: string, label: string, headerClasses: string) =>
      ({ name, label, align: 'left', field: name, headerClasses, sortValue: SORT_VALUE[name] })
    const action = { name: 'action', label: '', align: 'right', field: 'action' }
    if (activeTab.value === 'student') {
      return [
        { ...col('entity', 'Student', 'col-title'), required: true },
        col('studentNumber', 'Student number', 'col-ref'),
        col('college', 'College and year', 'col-type'),
        col('requirements', 'Requirements', 'col-reqs'),
        col('waiting', 'Waiting', 'col-date'),
        action,
      ]
    }
    if (activeTab.value === 'landlord') {
      return [
        { ...col('entity', 'Landlord/Landlady', 'col-title'), required: true },
        col('phone', 'Phone number', 'col-type'),
        col('requirements', 'Requirements', 'col-reqs'),
        col('waiting', 'Waiting', 'col-date'),
        action,
      ]
    }
    return [
      { ...col('entity', 'Accommodation', 'col-title'), required: true },
      col('location', 'Location', 'col-type'),
      col('requirements', 'Permits', 'col-reqs-wide'),
      col('waiting', 'Waiting', 'col-date'),
      action,
    ]
  })

  async function fetch() {
    // With cached queues on screen, refresh without the loading state.
    if (!hasLoaded.value) loading.value = true
    try {
      // get_verification_queue() is the one source for users + documents: it is
      // admin-gated server-side and already joins the pending document rows.
      const { data: queueRows, error: queueError } = await (supabase as any)
        .rpc('get_verification_queue')

      if (queueError) {
        console.error('Could not fetch the verification queue:', queueError.message)
        notify.error('Verification queue unavailable', queueError.message)
        studentRequests.value = []
        landlordRequests.value = []
      } else {
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

        const queueUsers = Array.from(grouped.values())

        // Phone and school record are not in the queue RPC. A failed read costs
        // those columns, never the queue itself.
        let details = new Map<string, ApplicantDetails>()
        try {
          details = await fetchApplicantDetails(queueUsers.map((user) => user.id))
        } catch (err) {
          console.warn('Could not fetch applicant details:', err)
        }

        const mapRequest = (user: any, manager: boolean): VerificationRequest => {
          const files = user.documents.map((document: QueueDocumentRow) => ({
            id: document.id,
            name: document.filename || document.doc_type || 'Verification document',
            // Kept so the row can say which requirement is in, not just how many.
            type: document.doc_type ?? undefined,
            // Signed on demand in selectRequest — documents have no readable URL.
            url: '',
          }))
          const requirements = checklist(APPLICANT_REQUIREMENTS[manager ? 'landlord' : 'student'], files)
          const detail = details.get(user.id)
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

        // Split on the account's own role. The old document-type heuristic put a
        // landlord/landlady who uploaded an `id_card` into the Student tab, and it still
        // matched the retired `landlord` role label.
        const roleOf = (user: any) => String(user.role).toLowerCase().trim()
        studentRequests.value = queueUsers
          .filter((user) => roleOf(user) === 'student')
          .map((user) => mapRequest(user, false))
          .sort(byQueueOrder)
        landlordRequests.value = queueUsers
          .filter((user) => roleOf(user) === 'landlord')
          .map((user) => mapRequest(user, true))
          .sort(byQueueOrder)
      }

      // The accommodation queue is every listing with an open accreditation
      // round (accommo-mobile's migration 20261002120000) — a new listing, a
      // resubmission, an appeal, a renewal, a change or a permit replaced on a
      // live listing. It used to be "status is pending or reviewing", which
      // could not see the last three: they leave the listing live.
      const { data: openRounds, error: accommodationError } = await supabase
        .from('accreditation_rounds')
        .select(
          `id, round, kind, message, proposed_changes, submitted_at,
           accommodation:accommodation_id (
             id, name, status, landlord_id, accommodation_type, gender_policy,
             purok, barangay, city, description, lat, lng, reviewing_at, reviewing_by,
             accreditation_expires_at,
             landlord:users_full!accommodations_landlord_id_fkey ( full_name, email, phone, status, sex )
           )`,
        )
        .is('decided_at', null)

      if (accommodationError) {
        console.warn('Could not fetch accommodations:', accommodationError.message)
      } else if (openRounds) {
        const rounds = (openRounds as any[]).filter((r) => r.accommodation)
        const accommodationIds = rounds.map((r) => r.accommodation.id as string)
        const [{ data: documents, error: documentError }, { data: pastRounds }] = accommodationIds.length
          ? await Promise.all([
            supabase
              .from('accommodation_documents')
              .select('id, accommodation_id, doc_type, uploaded_at, expires_at, version, file_sha256')
              .in('accommodation_id', accommodationIds)
              .order('version', { ascending: false }),
            supabase
              .from('accreditation_rounds')
              .select('accommodation_id, round, kind, decision, decided_at, flagged_docs, tags, note')
              .in('accommodation_id', accommodationIds)
              .not('decided_at', 'is', null)
              .order('round', { ascending: false }),
          ])
          : [{ data: [], error: null }, { data: [] }]
        if (documentError) console.warn('Could not fetch accommodation permits:', documentError.message)

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

        accommodationRequests.value = rounds.map((r: any) => {
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
      hasLoaded.value = true
    } catch (err) {
      console.error('Unexpected error fetching verifications:', err)
    } finally {
      loading.value = false
      // The table has just been drawn from rows that may carry an abandoned
      // claim, so judge them now rather than waiting for presence to change.
      void sweepStaleLocks()
    }
  }

  const currentDataArray = computed(() => {
    if (activeTab.value === 'student') return studentRequests.value
    if (activeTab.value === 'landlord') return landlordRequests.value
    return accommodationRequests.value
  })

  const filteredRows = computed(() => filterArr(currentDataArray.value))

  const paginatedRows = computed(() => {
    const start = (currentPage.value - 1) * 10
    return filteredRows.value.slice(start, start + 10)
  })

  // Applied with the filters so the review window's prev/next follows the
  // table's order. Only the active tab's columns exist, and a tab change clears it.
  const sort = ref<SortState>(null)

  function filterArr(arr: VerificationRequest[]) {
    let result = arr
    if (search.value) {
      const needle = search.value.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(needle)),
      )
    }
    const readiness = activeFilters.value.readiness
    if (readiness && readiness.length) {
      result = result.filter((row) => readiness.includes(row.ready ? 'ready' : 'waiting'))
    }
    return sortRows(result, sort.value, columns.value)
  }
  function paginateArr(arr: VerificationRequest[]) {
    const start = (currentPage.value - 1) * 10
    return arr.slice(start, start + 10)
  }

  const studentFiltered = computed(() => filterArr(studentRequests.value))
  const landlordFiltered = computed(() => filterArr(landlordRequests.value))
  const accommodationFiltered = computed(() => filterArr(accommodationRequests.value))

  const studentPaginated = computed(() => paginateArr(studentFiltered.value))
  const landlordPaginated = computed(() => paginateArr(landlordFiltered.value))
  const accommodationPaginated = computed(() => paginateArr(accommodationFiltered.value))

  const totalLabel = computed(() => {
    const ready = filteredRows.value.filter((row) => row.ready).length
    const waiting = filteredRows.value.length - ready
    return `${ready} ready to decide, ${waiting} waiting`
  })

  const emptyTitle = computed(() => {
    if (activeTab.value === 'student') return 'All caught up!'
    if (activeTab.value === 'landlord') return 'All caught up!'
    return 'All caught up!'
  })
  const emptyMessage = computed(() => {
    if (activeTab.value === 'student') return 'No pending student verifications.'
    if (activeTab.value === 'landlord') return 'No pending landlord/landlady verifications.'
    return 'No pending accommodation accreditations.'
  })

  /**
   * `reviewing` marks a request that a reviewer currently has open, so the queue
   * shows who is already being worked and two admins do not duplicate a
   * decision. Only a `pending` request is claimed — a decided one keeps its
   * verdict — and it is released again if the window closes with no decision,
   * which matters now that the reviewer can page through the queue.
   */
  /**
   * Writes the status to every copy of the request the page is holding.
   *
   * `selectRequest` replaces the selection with `{ ...row, files: signed }` — a
   * detached copy — so mutating the object handed to this function updated the
   * copy and left the table row showing the old badge. The request is patched by
   * id wherever it lives instead.
   */
  function patchRowStatus(id: string, next: 'pending' | 'reviewing', reviewingAt: string | null, reviewingBy: string | null) {
    const label = capitalize(next)
    const style = getStatusStyle(next)
    const lists = [studentRequests.value, landlordRequests.value, accommodationRequests.value]
    for (const list of lists) {
      for (const row of list) {
        if (row.id !== id) continue
        row.status = label
        row.statusStyle = style
        row.reviewingAt = reviewingAt
        row.reviewingBy = reviewingBy
      }
    }
    if (selectedRequest.value?.id === id) {
      selectedRequest.value = { ...selectedRequest.value, status: label, statusStyle: style, reviewingAt, reviewingBy }
    }
  }

  /**
   * The claim and its owner move together. A status written without the two
   * lock columns is exactly the unverifiable claim this replaced.
   */
  async function setRequestStatus(row: VerificationRequest, next: 'pending' | 'reviewing') {
    const table = row.id.startsWith('REQ-AC') ? 'accommodations' : 'users'
    // Opening a request claims it for review; view-only access just looks.
    if (!auth.can(table === 'accommodations' ? 'accreditation' : 'verification', 'edit')) return
    const taking = next === 'reviewing'
    const reviewingAt = taking ? new Date().toISOString() : null
    const reviewingBy = taking ? auth.user?.id ?? (await supabase.auth.getUser()).data.user?.id ?? null : null
    // A live listing (renewal, change, permit update) keeps its own status —
    // writing 'reviewing' over 'accredited' would take it off Discover. Its
    // claim is the two lock columns alone.
    const { error } = await supabase
      .from(table)
      .update(
        (row.round?.live
          ? { reviewing_by: reviewingBy, reviewing_at: reviewingAt }
          : { status: next, reviewing_by: reviewingBy, reviewing_at: reviewingAt }) as never,
      )
      .eq('id', row.rawId)
    if (error) {
      console.warn('Could not set review status:', error.message)
      return
    }
    patchRowStatus(row.id, next, reviewingAt, reviewingBy)
  }

  /** Requests this browser session has open. */
  const claimedIds = ref(new Set<string>())

  const presence = useReviewPresence()
  const auth = useAuthStore()

  /**
   * A claim made by this admin — in this tab, an earlier one, or before a
   * refresh. reviewing_by records the owner, and presence carries the user id
   * too, so neither should read the admin's own lock as somebody else's.
   */
  function isMine(row: VerificationRequest): boolean {
    const me = auth.user?.id
    if (!me) return false
    const holder = presence.holderOf(row.id)?.userId || row.reviewingBy
    return holder === me
  }

  /**
   * How long a claim stands on its timestamp alone. Presence answers the online
   * case within seconds; this is the floor that stops a live lock being freed
   * just because Realtime is slow, reconnecting, or switched off entirely.
   */
  const STALE_AFTER_MS = 10 * 60 * 1000

  /**
   * Whether somebody is really in the review panel for this request. The two
   * checks are OR'd, so a lock is only abandoned when presence says nobody is
   * connected to it AND its claim has aged out.
   */
  function isHeld(row: VerificationRequest): boolean {
    if (presence.holderOf(row.id)) return true
    if (!row.reviewingAt) return false
    const age = Date.now() - new Date(row.reviewingAt).getTime()
    return Number.isFinite(age) && age < STALE_AFTER_MS
  }

  function isLockedByOther(row: VerificationRequest): boolean {
    return (
      String(row.status).toLowerCase() === 'reviewing' &&
      !claimedIds.value.has(row.id) &&
      !isMine(row) &&
      isHeld(row)
    )
  }

  /** The reviewer who has this open, when presence knows their name. */
  function reviewerOf(row: VerificationRequest): string {
    return presence.holderOf(row.id)?.name ?? ''
  }

  /**
   * Put every abandoned claim back in the queue. Gated on `presence.ready`:
   * a client that has not yet received its first sync reads an empty channel,
   * and would take that as nobody reviewing anything and free the lot.
   */
  async function sweepStaleLocks() {
    if (!presence.ready.value) return
    const lists = [studentRequests.value, landlordRequests.value, accommodationRequests.value]
    for (const list of lists) {
      for (const row of list) {
        if (String(row.status).toLowerCase() !== 'reviewing') continue
        if (claimedIds.value.has(row.id) || isHeld(row)) continue
        await setRequestStatus(row, 'pending')
      }
    }
  }

  // A lock can go stale while the queue simply sits open, so the sweep follows
  // presence rather than only the load that first drew the table.
  watch([presence.holders, presence.ready], () => void sweepStaleLocks())

  async function claimForReview(row: VerificationRequest) {
    // Pending, or already this admin's (reopened after a refresh): take it and
    // stamp a fresh claim time.
    const status = String(row.status).toLowerCase()
    if (status !== 'pending' && !(status === 'reviewing' && isMine(row))) return
    claimedIds.value.add(row.id)
    presence.track(row.id)
    await setRequestStatus(row, 'reviewing')
  }

  async function releaseReview(row: VerificationRequest | null) {
    if (!row) return
    claimedIds.value.delete(row.id)
    presence.untrack()
    if (String(row.status).toLowerCase() !== 'reviewing') return
    await setRequestStatus(row, 'pending')
  }

  /**
   * The ordinary close. Not awaited and not relied on — a killed browser never
   * runs it, which is what presence and the timestamp are for — but when it does
   * land the request is back in the queue immediately instead of waiting for
   * another admin's sweep.
   */
  function releaseOnUnload() {
    void releaseReview(selectedRequest.value)
  }
  window.addEventListener('pagehide', releaseOnUnload)
  onUnmounted(() => window.removeEventListener('pagehide', releaseOnUnload))

  /**
   * Takes a request off another session. Needed because a lock outlives the
   * browser that set it — a closed tab or a crash leaves `reviewing` behind with
   * nothing to clear it, and with 69 waiting nobody should be stuck.
   */
  async function takeOverReview(row: VerificationRequest) {
    claimedIds.value.add(row.id)
    presence.track(row.id)
    await selectRequest(row, true)
  }

  async function selectRequest(row: VerificationRequest, force = false) {
    if (!force && isLockedByOther(row)) {
      notify.warning('Already being reviewed', `Another reviewer has ${row.name} open.`)
      return
    }
    const previous = selectedRequest.value
    if (previous && previous.id !== row.id) void releaseReview(previous)
    selectedRequest.value = row
    void claimForReview(row)
    void loadReviewProfile(row)
    void loadAccommodationExtras(row)
    // Documents live behind Cloudinary authenticated delivery. Sign just this
    // request's files, on open, rather than minting URLs for the whole queue.
    const table = row.id.startsWith('REQ-AC') ? 'accommodation_documents' : 'verification_documents'
    const signed = await Promise.all(
      row.files.map(async (file: QueueFile) => ({ ...file, url: await secureDocUrl(table, file.id) })),
    )
    // Matched by id, not by object identity, and merged rather than replaced.
    // Claiming the review and loading the profile both swap `selectedRequest`
    // for a fresh copy while these URLs are still being signed: an identity
    // check then failed and the signed files were dropped on the floor, leaving
    // every document with an empty URL. Spreading `row` back over the top would
    // have undone whichever of those two landed first.
    if (selectedRequest.value?.id === row.id) {
      selectedRequest.value = { ...selectedRequest.value, files: signed }
    }
  }
  /** Amenities and house rules, loaded on open and merged into the request. */
  async function loadAccommodationExtras(row: VerificationRequest) {
    if (!row.id.startsWith('REQ-AC') || !row.accommodation) return
    try {
      const extras = await fetchAccommodationExtras(row.rawId)
      if (selectedRequest.value?.id !== row.id) return
      const current = selectedRequest.value
      selectedRequest.value = {
        ...current,
        accommodation: { ...(current.accommodation as AccommodationFacts), extras },
      }
    } catch (e) {
      console.warn('Could not load the property details:', e)
    }
  }

  /** The account behind the request, loaded on open and merged into it. */
  async function loadReviewProfile(row: VerificationRequest) {
    if (row.id.startsWith('REQ-AC')) return
    const role = row.id.startsWith('REQ-AM') ? 'landlord' : 'student'
    const profile = await fetchReviewProfile(row.rawId, role)
    if (profile && selectedRequest.value?.id === row.id) {
      selectedRequest.value = { ...selectedRequest.value, profile }
    }
  }

  function clearRequest() {
    const open = selectedRequest.value
    selectedRequest.value = null
    void releaseReview(open)
  }

  // --- queue navigation ------------------------------------------------------
  // 69 requests are waiting and 67 are past target, so the review window is a
  // queue tool: the reviewer moves through it without returning to the table.
  const queue = computed(() => filteredRows.value)
  const queueIndex = computed(() =>
    selectedRequest.value ? queue.value.findIndex((r) => r.id === selectedRequest.value?.id) : -1,
  )
  const queueCount = computed(() => queue.value.length)
  const hasPrev = computed(() => queueIndex.value > 0)
  const hasNext = computed(() => queueIndex.value >= 0 && queueIndex.value < queueCount.value - 1)

  function step(direction: -1 | 1) {
    if (queueIndex.value < 0) return
    for (let i = queueIndex.value + direction; i >= 0 && i < queue.value.length; i += direction) {
      const row = queue.value[i]
      if (row && !isLockedByOther(row)) {
        void selectRequest(row)
        return
      }
    }
  }
  function selectPrev() { step(-1) }
  function selectNext() { step(1) }

  watch(activeTab, () => {
    search.value = ''
    currentPage.value = 1
    selectedRequest.value = null
    sort.value = null
  })
  watch([search, activeFilters, sort], () => {
    currentPage.value = 1
  }, { deep: true })

  /**
   * An accommodation decision is one call. decide_accreditation (accommo-mobile
   * migration 20261002120000) closes the round, sets the status, stamps the
   * term, writes the audit entry and tells the landlord/landlady — in one
   * transaction. It used to be five separate writes from here, any of which
   * could fail alone and leave a listing accredited with nobody told and
   * nothing recorded.
   */
  async function decideAccommodation(req: VerificationRequest, payload: any): Promise<boolean> {
    const decision: 'approved' | 'returned' | 'rejected' =
      payload?.decision === 'approve' ? 'approved'
        : payload?.allowResubmission === true ? 'returned'
          : 'rejected'
    const { data, error } = await supabase.rpc('decide_accreditation', {
      p_accommodation: req.rawId,
      p_decision: decision,
      p_flagged_docs: payload?.flaggedDocs?.length ? payload.flaggedDocs : undefined,
      p_tags: payload?.tags?.length ? payload.tags : undefined,
      p_note: payload?.notes || undefined,
      p_override: payload?.override === true,
    })
    if (error) {
      notify.error('Decision not saved', error.message)
      return false
    }
    const kind = req.round?.kind
    const words =
      decision === 'approved'
        ? kind === 'renewal' ? 'Renewal approved' : kind === 'change' ? 'Change approved'
          : kind === 'permit_update' ? 'Permit accepted' : 'Accommodation accredited'
        : decision === 'returned' ? 'Sent back for changes'
          : kind === 'appeal' ? 'Rejection upheld' : 'Refused'
    notify.success(words, `${req.name} · status ${humanizeEnum(String(data))}. The ${landlordTitle(req.accommodation?.landlord_sex).toLowerCase()} was notified.`)
    return true
  }

  async function handleDecision(decisionPayload: any) {
    if (!selectedRequest.value) return
    loading.value = true
    try {
      const req = selectedRequest.value
      // Where the reviewer was in the queue, so the decision can hand them the
      // next request instead of the table they came from. Read before the
      // refetch, which rebuilds the rows.
      const decidedIndex = queueIndex.value

      if (req.id.startsWith('REQ-AC')) {
        if (!(await decideAccommodation(req, decisionPayload))) return
      } else {
        await decideAccount(req, decisionPayload)
      }

      await fetch()

      // The decided request is gone from the pending queue, so the one that
      // took its index is the next one to look at.
      const following = decidedIndex >= 0 ? queue.value[decidedIndex] : undefined
      selectedRequest.value = null
      if (following) void selectRequest(following)
    } catch (error: unknown) {
      console.error('Failed to update status:', error instanceof Error ? error.message : error)
      selectedRequest.value = null
    } finally {
      loading.value = false
    }
  }

  /** A student or landlord/landlady account. Throws on the status write. */
  async function decideAccount(req: VerificationRequest, decisionPayload: any) {
    const decision = decisionPayload?.decision || 'approve'
    // Either way the applicant can re-upload; "allow resubmission" is OSAS
    // asking again rather than refusing, so it has its own status.
    const allowResub = decision === 'reject' && decisionPayload?.allowResubmission === true
    const newStatus = decision === 'approve' ? 'verified' : allowResub ? 'needs_resubmission' : 'rejected'

    const rawId = req.rawId
    const actorId = (await supabase.auth.getUser()).data.user?.id || null

    const { data, error } = await supabase
      .from('users')
      .update({ status: newStatus as any, reviewing_by: null, reviewing_at: null } as never)
      .eq('id', rawId)
      .select('id')

    if (error) {
      notify.error('Database error', error.message)
      throw error
    }

    // Approving a STUDENT stamps student_profiles.osas_verified_at, which is
    // what actually gates the QR, lease applications and chat-apply — not
    // users.status. Upsert unconditionally: an update alone matches no rows for
    // a student with no profile row yet (a Google signup with no ISU record)
    // and reports no error, which is how this silently no-opped for a whole
    // release. Revoking on reject/suspend is handled by tg_revoke_on_unverify.
    if (decision === 'approve') {
      const { error: stampErr } = await supabase
        .from('student_profiles')
        .upsert({ user_id: rawId, osas_verified_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (stampErr) notify.error('Could not record OSAS verification', stampErr.message)
    }

    // Close out the document rows this decision covers. Nothing wrote these
    // before, so decided accounts trailed the queue forever.
    {
      const { error: docErr } = await supabase
        .from('verification_documents')
        .update({
          status: decision === 'approve' ? 'approved' : 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: actorId,
        } as any)
        .eq('user_id', rawId)
        .eq('status', 'pending')
      if (docErr) console.warn('Could not close verification documents:', docErr.message)
    }

    const verb = decision === 'approve' ? 'verified' : allowResub ? 'sent back for resubmission' : 'rejected'

    if (!data || data.length === 0) {
      notify.warning('No rows updated', 'This is likely a Row Level Security (RLS) policy restriction.')
    } else {
      notify.success('User ' + verb, `Status set to "${newStatus}".`)
    }

    // --- Close the loop: record the decision + notify (best-effort) -------
    // supabase-js RETURNS errors, it does not throw them — these three writes
    // used to sit inside try/catch blocks that could never fire, so an RLS
    // refusal was invisible. audit_logs had no admin INSERT policy at all
    // until 20260915000004, which is why not one decision was ever recorded.
    {
      const { error: auditErr } = await supabase.from('audit_logs').insert({
        action: allowResub ? 'verification.resubmit' : `verification.${decision}`,
        actor_id: actorId,
        entity_id: rawId,
        entity_type: 'user',
        before_json: { status: req.status },
        after_json: {
          status: newStatus,
          decision,
          override: decisionPayload?.override === true,
          allow_resubmission: allowResub,
          tags: decisionPayload?.tags ?? null,
          notes: decisionPayload?.notes ?? null,
        },
      } as any)
      if (auditErr) notify.warning('Decision not recorded in the audit log', auditErr.message)
    }

    {
      const notifs: any[] = [{
        user_id: rawId,
        type: 'verification',
        title:
          decision === 'approve' ? 'Verification approved'
            : allowResub ? 'Resubmission requested' : 'Verification rejected',
        body:
          decision === 'approve'
            ? 'Your account has been verified.'
            : allowResub
              ? `We need more information — please re-upload your requirements.${decisionPayload?.notes ? ' Note: ' + decisionPayload.notes : ''}`
              : `Your account was rejected.${decisionPayload?.notes ? ' Reason: ' + decisionPayload.notes : ''}`,
        link_url: '/profile',
      }]
      if (actorId) {
        notifs.push({
          user_id: actorId,
          type: 'system',
          title: 'Verification decision recorded',
          body: `You ${verb} ${req.name}.`,
          link_url: `/users?user=${rawId}`,
        })
      }
      // Both rows go in one statement, so a refusal on the applicant's row
      // used to take the admin's own copy with it — and can_notify() does not
      // cover admin → applicant, so that was every decision. 20260915000004
      // adds notifications_insert_admin; if it is ever missing again, say so
      // rather than leaving the applicant silently uninformed.
      const { error: notifErr } = await supabase.from('notifications').insert(notifs as any)
      if (notifErr) notify.warning('Applicant was not notified', notifErr.message)
    }

    {
      const { error: reqErr } = await (supabase as any).from('verification_requests').insert({
        entity_type: 'user',
        entity_id: rawId,
        type: req.type,
        status:
          decision === 'approve' ? 'approved'
            : allowResub ? 'resubmission_requested'
              : 'rejected',
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
        rejection_reasons: decisionPayload?.tags ?? null,
        decision_notes: decisionPayload?.notes ?? null,
      })
      if (reqErr) notify.warning('Decision history not updated', reqErr.message)
    }
  }

  return {
    loading,
    activeTab,
    search,
    activeFilters,
    filterConfig,
    clearFilters,
    currentPage,
    selectedRequest,
    tabs,
    columns,
    sort,
    studentRequests,
    landlordRequests,
    accommodationRequests,
    filteredRows,
    paginatedRows,
    studentFiltered,
    landlordFiltered,
    accommodationFiltered,
    studentPaginated,
    landlordPaginated,
    accommodationPaginated,
    totalLabel,
    searchPlaceholder,
    emptyTitle,
    emptyMessage,
    fetch,
    handleDecision,
    selectRequest,
    clearRequest,
    queueIndex,
    queueCount,
    hasPrev,
    hasNext,
    selectPrev,
    selectNext,
    isLockedByOther,
    reviewerOf,
    takeOverReview,
  }
}
