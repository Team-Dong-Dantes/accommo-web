import { ref, computed, watch, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { getStatus } from '@/utils/status.config'
import { getInitials, capitalize, getTimeAgo } from '@/utils/format'
import { secureDocUrl } from '@/utils/docUrl'
import { fetchAccommodationExtras, type AccommodationExtras } from '@/api/accommodations'
import { fetchReviewProfile, type ReviewProfile } from '@/api/users'
import { useReviewPresence } from '@/composables/useReviewPresence'

/**
 * The property behind an accreditation request. An accommodation is not an
 * account, so none of `ReviewProfile` applies to it — what a reviewer checks
 * the permits against is the address, the size and the manager behind it.
 */
export interface AccommodationFacts {
  accommodation_type: string | null
  description: string | null
  /** Amenities and house rules, loaded when the review window opens. */
  extras?: AccommodationExtras
  gender_policy: string | null
  barangay: string | null
  city: string | null
  lat: number | null
  lng: number | null
  manager_email: string | null
  manager_phone: string | null
  manager_status: string | null
}

export interface VerificationRequest {
  id: string
  rawId: string
  name: string
  email: string
  owner: string
  initials: string
  type: string
  files: { id?: string; name: string; url: string; type?: string }[]
  status: string
  statusStyle: { tone: string; icon: string }
  submitted: string
  /** When it arrived, ISO, for ordering. `submitted` is the same thing in words. */
  submittedAt: string | null
  /** When the current review claim was taken, ISO. Null when nobody holds it. */
  reviewingAt: string | null
  /** The account behind the request, loaded when the review window opens. */
  profile?: ReviewProfile
  /** The property behind an accreditation request, carried from the queue. */
  accommodation?: AccommodationFacts
  avatarColor: string
  /** The applicant's profile photo. Empty for an accreditation request. */
  avatarUrl: string
  ownerId?: string
}

/**
 * Newest first. The queue is read top-down and the first page is the ten rows a
 * reviewer actually sees, so that page should be what just came in. Rows with no
 * timestamp sort last rather than jumping the line.
 */
function byNewest(a: VerificationRequest, b: VerificationRequest) {
  return (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')
}

/**
 * How long an OSAS accreditation stands before it has to be renewed. One
 * number, one place — change it here and both the stamp and the nightly expiry
 * sweep follow.
 */
const ACCREDITATION_TERM_YEARS = 1

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

export function useVerifications() {
  const loading = ref(true)
  const notify = useNotify()

  const activeTab = ref<'student' | 'accommodation_manager' | 'accommodation'>('student')
  const search = ref('')
  const currentPage = ref(1)
  const selectedRequest = ref<VerificationRequest | null>(null)

  const activeFilters = ref<{ status: string[] }>({ status: [] })
  const filterConfig = [
    {
      label: 'Status',
      key: 'status',
      options: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Reviewing', value: 'Reviewing' },
      ],
    },
  ]

  function clearFilters() {
    activeFilters.value = { status: [] }
  }

  const studentRequests = ref<VerificationRequest[]>([])
  const accommodationManagerRequests = ref<VerificationRequest[]>([])
  const accommodationRequests = ref<VerificationRequest[]>([])

  const tabs = [
    { name: 'student', label: 'Student' },
    { name: 'accommodation_manager', label: 'Accommodation Manager' },
    { name: 'accommodation', label: 'Accommodation' },
  ]

  const searchPlaceholder = computed(() => {
    if (activeTab.value === 'student') return 'Search student name...'
    if (activeTab.value === 'accommodation_manager') return 'Search accommodation manager name...'
    return 'Search accommodation name...'
  })

  const columns = computed(() => {
    const label =
      activeTab.value === 'student' ? 'Student'
        : activeTab.value === 'accommodation_manager' ? 'Accommodation Manager'
          : 'Accommodation'
    return [
      { name: 'entity', required: true, label, align: 'left', field: 'name' },
      { name: 'id', label: 'Ref ID', align: 'left', field: 'id' },
      { name: 'type', label: 'Document', align: 'left', field: 'type' },
      { name: 'status', label: 'Status', align: 'left', field: 'status' },
      { name: 'submitted', label: 'Received', align: 'left', field: 'submitted' },
      { name: 'action', label: '', align: 'right', field: 'action' },
    ]
  })

  async function fetch() {
    loading.value = true
    try {
      // get_verification_queue() is the one source for users + documents: it is
      // admin-gated server-side and already joins the pending document rows.
      const { data: queueRows, error: queueError } = await (supabase as any)
        .rpc('get_verification_queue')

      if (queueError) {
        console.error('Could not fetch the verification queue:', queueError.message)
        notify.error('Verification queue unavailable', queueError.message)
        studentRequests.value = []
        accommodationManagerRequests.value = []
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

        const mapRequest = (user: any, manager: boolean) => ({
          id: `REQ-${manager ? 'AM' : 'S'}${user.id.substring(0, 4).toUpperCase()}`,
          rawId: user.id,
          name: user.full_name || (manager ? 'Unknown Accommodation Manager' : 'Unknown Student'),
          email: user.email,
          owner: '',
          initials: getInitials(user.full_name),
          type: manager ? 'Accommodation Manager Identity' : 'Enrollment Form / COR',
          files: user.documents.map((document: any) => ({
            id: document.id,
            name: document.filename || document.doc_type || 'Verification document',
            // Signed on demand in selectRequest — documents have no readable URL.
            url: '',
          })),
          status: capitalize(user.status),
          statusStyle: getStatusStyle(user.status),
          submitted: getTimeAgo(user.created_at),
          submittedAt: user.created_at ?? null,
          reviewingAt: user.reviewing_at ?? null,
          avatarColor: manager ? 'teal-7' : 'blue-6',
          avatarUrl: user.avatar_url || '',
        })

        // Split on the account's own role. The old document-type heuristic put a
        // manager who uploaded an `id_card` into the Student tab, and it still
        // matched the retired `landlord` role label.
        const queueUsers = Array.from(grouped.values())
        const roleOf = (user: any) => String(user.role).toLowerCase().trim()
        studentRequests.value = queueUsers
          .filter((user) => roleOf(user) === 'student')
          .map((user) => mapRequest(user, false))
          .sort(byNewest)
        accommodationManagerRequests.value = queueUsers
          .filter((user) => roleOf(user) === 'accommodation_manager')
          .map((user) => mapRequest(user, true))
          .sort(byNewest)
      }

      const { data: accommodations, error: accommodationError } = await supabase
        .from('accommodations')
        .select(
          `id, name, status, accommodation_manager_id, accommodation_type, gender_policy,
           barangay, city, description, lat, lng, reviewing_at,
           manager:accommodation_manager_id ( full_name, email, phone, status )`,
        )
        .in('status', ['pending', 'reviewing'])

      if (accommodationError) {
        console.warn('Could not fetch accommodations:', accommodationError.message)
      } else if (accommodations) {
        const accommodationIds = (accommodations as any[]).map((accommodation) => accommodation.id)
        const { data: documents, error: documentError } = accommodationIds.length
          ? await supabase
            .from('accommodation_documents')
            .select('id, accommodation_id, doc_type, file_url, uploaded_at')
            .in('accommodation_id', accommodationIds)
          : { data: [], error: null }
        if (documentError) console.warn('Could not fetch accommodation permits:', documentError.message)
        const documentsByAccommodation = new Map<string, any[]>()
        for (const document of documents ?? []) {
          if (!document.accommodation_id) continue
          documentsByAccommodation.set(document.accommodation_id, [
            ...(documentsByAccommodation.get(document.accommodation_id) ?? []),
            document,
          ])
        }
        accommodationRequests.value = (accommodations as any[]).map((p: any) => {
          const managerRow = (Array.isArray(p.manager) ? p.manager[0] : p.manager) as any
          const ownerName = managerRow?.full_name || 'Unknown Accommodation Manager'
          const documentRows = documentsByAccommodation.get(p.id) ?? []
          const submittedAt = documentRows.reduce<string | null>(
            (latest, document) =>
              document.uploaded_at && (!latest || document.uploaded_at > latest)
                ? document.uploaded_at
                : latest,
            null,
          )
          const files = documentRows.map((document) => ({
            id: document.id,
            name: ACCOMMODATION_PERMITS.find((permit) => permit.type === document.doc_type)?.label ?? document.doc_type,
            type: document.doc_type,
            // Signed on demand in selectRequest — permits have no readable URL.
            url: '',
          }))
          return {
            id: `REQ-AC${p.id.substring(0, 4).toUpperCase()}`,
            rawId: p.id,
            name: p.name || 'Unnamed Accommodation',
            email: '',
            owner: ownerName,
            ownerId: p.accommodation_manager_id,
            initials: getInitials(p.name),
            type: 'OSAS Accreditation',
            files,
            status: capitalize(p.status),
            statusStyle: getStatusStyle(p.status),
            submitted: submittedAt ? getTimeAgo(submittedAt) : 'Unknown',
            submittedAt,
            reviewingAt: p.reviewing_at ?? null,
            avatarColor: 'orange-6',
            // A property, not a person — the initials circle is the whole avatar.
            avatarUrl: '',
            accommodation: {
              accommodation_type: p.accommodation_type ?? null,
              description: p.description ?? null,
              gender_policy: p.gender_policy ?? null,
              barangay: p.barangay ?? null,
              city: p.city ?? null,
              lat: p.lat ?? null,
              lng: p.lng ?? null,
              manager_email: managerRow?.email ?? null,
              manager_phone: managerRow?.phone ?? null,
              manager_status: managerRow?.status ?? null,
            },
          }
        }).sort(byNewest)
      }
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
    if (activeTab.value === 'accommodation_manager') return accommodationManagerRequests.value
    return accommodationRequests.value
  })

  const filteredRows = computed(() => filterArr(currentDataArray.value))

  const paginatedRows = computed(() => {
    const start = (currentPage.value - 1) * 10
    return filteredRows.value.slice(start, start + 10)
  })

  function filterArr(arr: VerificationRequest[]) {
    let result = arr
    if (search.value) {
      const needle = search.value.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(needle)),
      )
    }
    const activeStatus = activeFilters.value.status
    if (activeStatus && activeStatus.length) {
      result = result.filter((row) =>
        activeStatus.some((v) => String(v).toLowerCase() === String(row.status).toLowerCase()),
      )
    }
    return result
  }
  function paginateArr(arr: VerificationRequest[]) {
    const start = (currentPage.value - 1) * 10
    return arr.slice(start, start + 10)
  }

  const studentFiltered = computed(() => filterArr(studentRequests.value))
  const accommodationManagerFiltered = computed(() => filterArr(accommodationManagerRequests.value))
  const accommodationFiltered = computed(() => filterArr(accommodationRequests.value))

  const studentPaginated = computed(() => paginateArr(studentFiltered.value))
  const accommodationManagerPaginated = computed(() => paginateArr(accommodationManagerFiltered.value))
  const accommodationPaginated = computed(() => paginateArr(accommodationFiltered.value))

  const totalLabel = computed(
    () => `${filteredRows.value.length} total ${filteredRows.value.length === 1 ? 'request' : 'requests'}`,
  )

  const emptyTitle = computed(() => {
    if (activeTab.value === 'student') return 'All caught up!'
    if (activeTab.value === 'accommodation_manager') return 'All caught up!'
    return 'All caught up!'
  })
  const emptyMessage = computed(() => {
    if (activeTab.value === 'student') return 'No pending student verifications.'
    if (activeTab.value === 'accommodation_manager') return 'No pending accommodation-manager verifications.'
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
  function patchRowStatus(id: string, next: 'pending' | 'reviewing', reviewingAt: string | null) {
    const label = capitalize(next)
    const style = getStatusStyle(next)
    const lists = [studentRequests.value, accommodationManagerRequests.value, accommodationRequests.value]
    for (const list of lists) {
      for (const row of list) {
        if (row.id !== id) continue
        row.status = label
        row.statusStyle = style
        row.reviewingAt = reviewingAt
      }
    }
    if (selectedRequest.value?.id === id) {
      selectedRequest.value = { ...selectedRequest.value, status: label, statusStyle: style, reviewingAt }
    }
  }

  /**
   * The claim and its owner move together. A status written without the two
   * lock columns is exactly the unverifiable claim this replaced.
   */
  async function setRequestStatus(row: VerificationRequest, next: 'pending' | 'reviewing') {
    const table = row.id.startsWith('REQ-AC') ? 'accommodations' : 'users'
    const taking = next === 'reviewing'
    const reviewingAt = taking ? new Date().toISOString() : null
    const reviewingBy = taking ? (await supabase.auth.getUser()).data.user?.id ?? null : null
    const { error } = await supabase
      .from(table)
      .update({ status: next as never, reviewing_by: reviewingBy, reviewing_at: reviewingAt } as never)
      .eq('id', row.rawId)
    if (error) {
      console.warn('Could not set review status:', error.message)
      return
    }
    patchRowStatus(row.id, next, reviewingAt)
  }

  /**
   * Requests this browser session has open. `reviewing` says a reviewer holds a
   * request but the tables carry no column saying which one, so ownership is
   * tracked here: anything already `reviewing` that this session did not claim
   * belongs to somebody else and stays shut.
   */
  const claimedIds = ref(new Set<string>())

  const presence = useReviewPresence()

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
    const lists = [studentRequests.value, accommodationManagerRequests.value, accommodationRequests.value]
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
    if (String(row.status).toLowerCase() !== 'pending') return
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
      row.files.map(async (file: any) => ({ ...file, url: await secureDocUrl(table, file.id) })),
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
    const role = row.id.startsWith('REQ-AM') ? 'accommodation_manager' : 'student'
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
  })
  watch([search, activeFilters], () => {
    currentPage.value = 1
  }, { deep: true })

  async function handleDecision(decisionPayload: any) {
    if (!selectedRequest.value) return
    loading.value = true
    try {
      const req = selectedRequest.value
      const isAccommodation = req.id.startsWith('REQ-AC')
      const decision = decisionPayload?.decision || 'approve'
      // Reject with "allow resubmission" is a soft reject (user can re-upload);
      // otherwise it's a hard reject.
      const allowResub = decision === 'reject' && decisionPayload?.allowResubmission === true

      // A refusal the manager can fix is not the same as a refusal. Soft
      // rejects used to land on `rejected` alongside an outright refusal, so a
      // blurry permit looked terminal; they now land on `needs_revision`, and
      // the ball being with the manager keeps them out of the OSAS queue until
      // a new document arrives and the permit trigger re-queues them.
      let newStatus: string
      if (decision === 'approve') newStatus = isAccommodation ? 'accredited' : 'verified'
      else if (allowResub && isAccommodation) newStatus = 'needs_revision'
      else newStatus = 'rejected'

      const rawId = req.rawId
      const actorId = (await supabase.auth.getUser()).data.user?.id || null
      // Accreditation runs for a term rather than forever. Stamping it here is
      // what makes `accreditation_expires_at` real — the column has always
      // existed and nothing wrote it, so the dashboard's renewal warning and
      // the nightly expiry sweep both had nothing to match on.
      const accreditedNow = isAccommodation && decision === 'approve'
      const accreditedAt = accreditedNow ? new Date() : null
      const expiresAt = accreditedAt ? new Date(accreditedAt) : null
      if (expiresAt) expiresAt.setFullYear(expiresAt.getFullYear() + ACCREDITATION_TERM_YEARS)

      const { data, error } = isAccommodation
        ? await supabase.from('accommodations').update({
            status: newStatus,
            reviewing_by: null,
            reviewing_at: null,
            ...(accreditedNow
              ? { accredited_at: accreditedAt!.toISOString(), accreditation_expires_at: expiresAt!.toISOString() }
              : {}),
          } as never).eq('id', rawId).select()
        : await supabase.from('users').update({ status: newStatus as any, reviewing_by: null, reviewing_at: null } as never).eq('id', rawId).select()

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
      if (!isAccommodation && decision === 'approve') {
        const { error: stampErr } = await supabase
          .from('student_profiles')
          .upsert({ user_id: rawId, osas_verified_at: new Date().toISOString() }, { onConflict: 'user_id' })
        if (stampErr) notify.error('Could not record OSAS verification', stampErr.message)
      }

      // Close out the document rows this decision covers. Nothing wrote these
      // before, so decided accounts trailed the queue forever.
      if (!isAccommodation) {
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

      const verb =
        decision === 'approve'
          ? isAccommodation ? 'accredited' : 'verified'
          : allowResub ? 'sent back for resubmission' : 'rejected'

      if (!data || data.length === 0) {
        notify.warning('No rows updated', 'This is likely a Row Level Security (RLS) policy restriction.')
      } else {
        notify.success(isAccommodation ? 'Accommodation ' + verb : 'User ' + verb, `Status set to "${newStatus}".`)
      }

      // --- Close the loop: record the decision + notify (best-effort) -------
      const entityType = isAccommodation ? 'accommodation' : 'user'
      const subjectUserId = isAccommodation ? (req as any).ownerId : rawId

      // supabase-js RETURNS errors, it does not throw them — these three writes
      // used to sit inside try/catch blocks that could never fire, so an RLS
      // refusal was invisible. audit_logs had no admin INSERT policy at all
      // until 20260915000004, which is why not one decision was ever recorded.
      {
        const { error: auditErr } = await supabase.from('audit_logs').insert({
          action: allowResub ? 'verification.resubmit' : `verification.${decision}`,
          actor_id: actorId,
          entity_id: rawId,
          entity_type: entityType,
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
        const notifs: any[] = []
        if (subjectUserId) {
          const subjectBody =
            decision === 'approve'
              ? `Your ${isAccommodation ? 'accommodation' : 'account'} has been verified.`
              : allowResub
                ? `We need more information — please re-upload your documents.${decisionPayload?.notes ? ' Note: ' + decisionPayload.notes : ''}`
                : `Your ${isAccommodation ? 'accommodation' : 'account'} was rejected.${decisionPayload?.notes ? ' Reason: ' + decisionPayload.notes : ''}`
          notifs.push({
            user_id: subjectUserId,
            type: 'verification',
            title:
              decision === 'approve' ? 'Verification approved'
                : allowResub ? 'Resubmission requested' : 'Verification rejected',
            body: subjectBody,
            link_url: isAccommodation ? `/verifications?focus=verification:${rawId}` : '/profile',
          })
        }
        if (actorId) {
          notifs.push({
            user_id: actorId,
            type: 'system',
            title: 'Verification decision recorded',
            body: `You ${verb} ${req.name}.`,
            link_url: isAccommodation ? `/verifications?focus=verification:${rawId}` : `/users?user=${rawId}`,
          })
        }
        // Both rows go in one statement, so a refusal on the applicant's row
        // used to take the admin's own copy with it — and can_notify() does not
        // cover admin → applicant, so that was every decision. 20260915000004
        // adds notifications_insert_admin; if it is ever missing again, say so
        // rather than leaving the applicant silently uninformed.
        if (notifs.length) {
          const { error: notifErr } = await supabase.from('notifications').insert(notifs as any)
          if (notifErr) notify.warning('Applicant was not notified', notifErr.message)
        }
      }

      {
        const { error: reqErr } = await (supabase as any).from('verification_requests').insert({
          entity_type: entityType,
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

      // Where the reviewer was in the queue, so the decision can hand them the
      // next request instead of the table they came from. Read before the
      // refetch, which rebuilds the rows.
      const decidedIndex = queueIndex.value

      await fetch()

      // The decided request is gone from the pending queue, so the one that
      // took its index is the next one to look at.
      const following = decidedIndex >= 0 ? queue.value[decidedIndex] : undefined
      selectedRequest.value = null
      if (following) void selectRequest(following)
    } catch (error: any) {
      console.error('Failed to update status:', error.message)
      selectedRequest.value = null
    } finally {
      loading.value = false
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
    studentRequests,
    accommodationManagerRequests,
    accommodationRequests,
    filteredRows,
    paginatedRows,
    studentFiltered,
    accommodationManagerFiltered,
    accommodationFiltered,
    studentPaginated,
    accommodationManagerPaginated,
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
