import { ref, computed, watch, onUnmounted } from 'vue'
import { useNotify } from '@/utils/notify'
import { registerReset } from '@/utils/pageCache'
import { secureDocUrl } from '@/utils/docUrl'
import { fetchAccommodationExtras } from '@/api/accommodations'
import { readinessFilterConfig, verificationColumns, verificationEmptyMessage, verificationSearchPlaceholder } from '@/features/verifications/table'
import { fetchOpenRounds, fetchRoundEvidence, fetchVerificationQueue } from '@/api/verifications'
import { fetchPendingApplicants } from '@/api/leases'
import { fetchReviewProfile, fetchApplicantDetails } from '@/api/users'
import { useReviewLocks } from '@/composables/useReviewLocks'
import { useVerificationDecisions } from '@/composables/useVerificationDecisions'
import { useAuthStore } from '@/stores/auth'
import { sortRows, type SortState } from '@/composables/useSort'
import { groupQueueRows, toAccountRequest, toAccommodationRequests } from '@/features/verifications/requests'
import { byQueueOrder, type QueueFile, type VerificationRequest, type AccommodationFacts } from '@/features/verifications/queue'

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
  // Opens on "ready" so OSAS sees only what it can act on; the incomplete ones
  // stay one filter away for chasing or turning away spam.
  const activeFilters = ref<{ readiness: string[] }>({ readiness: ['ready'] })
  const filterConfig = computed(() => readinessFilterConfig(
    activeTab.value === 'landlord' ? landlordRequests.value
      : activeTab.value === 'accommodation' ? accommodationRequests.value : studentRequests.value,
  ))

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

  const searchPlaceholder = computed(() => verificationSearchPlaceholder(activeTab.value))
  const columns = computed(() => verificationColumns(activeTab.value))

  /** `show`: the refresh button — with no loading state a click looked like it did nothing. */
  async function fetch(show = false) {
    // With cached queues on screen, refresh without the loading state.
    if (show || !hasLoaded.value) loading.value = true
    try {
      // get_verification_queue() is the one source for users + documents: it is
      // admin-gated server-side and already joins the pending document rows.
      let queueRows: any[] | null = null
      try {
        queueRows = await fetchVerificationQueue()
      } catch (queueError) {
        const message = queueError instanceof Error ? queueError.message : String(queueError)
        console.error('Could not fetch the verification queue:', message)
        notify.error('Verification queue unavailable', message)
        studentRequests.value = []
        landlordRequests.value = []
      }
      if (queueRows) {
        const queueUsers = groupQueueRows(queueRows)

        // Phone, school record and pending applications are not in the queue
        // RPC. A failed read costs those columns, never the queue itself.
        const userIds = queueUsers.map((user) => user.id)
        const [detailsResult, applicantsResult] = await Promise.allSettled([
          fetchApplicantDetails(userIds),
          fetchPendingApplicants(userIds),
        ])
        if (detailsResult.status === 'rejected') console.warn('Could not fetch applicant details:', detailsResult.reason)
        if (applicantsResult.status === 'rejected') console.warn('Could not fetch pending applications:', applicantsResult.reason)
        // Null, not empty, when the read failed: a student's record is then
        // unknown rather than missing, and must not hold every one of them back.
        const details = detailsResult.status === 'fulfilled' ? detailsResult.value : null
        const applicants = applicantsResult.status === 'fulfilled' ? applicantsResult.value : new Set<string>()

        const mapRequest = (user: any, manager: boolean) => toAccountRequest(user, manager, details, applicants)

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
      let openRounds: any[] | null = null
      try {
        openRounds = await fetchOpenRounds()
      } catch (accommodationError) {
        console.warn('Could not fetch accommodations:', accommodationError instanceof Error ? accommodationError.message : accommodationError)
      }
      if (openRounds) {
        const rounds = openRounds.filter((r) => r.accommodation)
        const accommodationIds = rounds.map((r) => r.accommodation.id as string)
        const { documents, documentError, pastRounds } = await fetchRoundEvidence(accommodationIds)
        if (documentError) console.warn('Could not fetch accommodation permits:', documentError.message)

        accommodationRequests.value = toAccommodationRequests(rounds, documents, pastRounds)
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

  const emptyTitle = computed(() => 'All caught up!')
  const emptyMessage = computed(() => verificationEmptyMessage(activeTab.value))

  const { decideAccommodation, decideAccount } = useVerificationDecisions()

  const {
    claimedIds, presence, isLockedByOther, reviewerOf, sweepStaleLocks, claimForReview, releaseReview,
  } = useReviewLocks({
    lists: () => [studentRequests.value, landlordRequests.value, accommodationRequests.value],
    selectedRequest,
  })

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
