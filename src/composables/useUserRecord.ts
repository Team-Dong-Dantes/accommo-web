// The Users page's person record: the row a click opens, every detail fetch
// that fills it in, the account state OSAS acts on, and the DrawerPreview
// UserRecord reads. One instance per page.
import { ref, computed, type Ref } from 'vue'
import type { DrawerPreview } from '@/components/ui/DetailDrawer.vue'
import { buildUserPreview, cap, composeAddress, periodLabel } from '@/features/users/userPreview'
import { fetchStudentLeaseHistory, fetchPaymentsForLeases, fetchLedgerForLeases, type LeaseLedgerRow } from '@/api/leases'
import { fetchAccommodationDocs, fetchVerificationDocs, type AccommodationDocRow, type VerificationDocRow } from '@/api/users'
import {
  fetchActivePlacement,
  fetchBoardingHistory,
  fetchLandlordAccommodations,
  fetchLandlordProfile,
  fetchReviewsReceived,
  fetchStudentProfile,
} from '@/api/userDetail'
import { fetchAccountEvents, fetchAccountStanding, fetchClosedAt, fetchSignInMethods, NO_STANDING, type AccountEvent, type AccountStanding, type SignInMethods } from '@/api/accounts'

/** A query whose failure only means that part of the record stays empty. */
const soft = <T>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback)

export function useUserRecord(campusResponseRate: Ref<number | null>) {
  const drawerOpen = ref(false)
  const selectedUser = ref<any | null>(null)
  const userDetail = ref<any | null>(null)
  const verificationDocs = ref<VerificationDocRow[]>([])
  const accommodationDocs = ref<AccommodationDocRow[]>([])
  const userReviews = ref<any[]>([])
  const detailLoading = ref(false)

  const housing = ref<any | null>(null)
  const boardingHistory = ref<any[]>([])
  const accommodationRows = ref<any[]>([])
  const leases = ref<any[]>([])
  const payments = ref<any[]>([])
  const ledger = ref<LeaseLedgerRow[]>([])

  const standing = ref<AccountStanding>(NO_STANDING)
  const signIn = ref<SignInMethods | null>(null)
  const closed = ref(false)
  const accountEvents = ref<AccountEvent[]>([])

  async function openUser(row: any) {
    selectedUser.value = row
    userDetail.value = null
    housing.value = null
    boardingHistory.value = []
    accommodationRows.value = []
    userReviews.value = []
    verificationDocs.value = []
    accommodationDocs.value = []
    leases.value = []
    payments.value = []
    ledger.value = []
    standing.value = NO_STANDING
    signIn.value = null
    closed.value = false
    accountEvents.value = []
    drawerOpen.value = true
    await Promise.all([fetchDetail(row.rawId, row.role), loadAccountState(row.rawId)])
  }

  async function fetchDetail(userId: string, role: string) {
    detailLoading.value = true
    try {
      const normalized = (role || '').toLowerCase()
      let detail: any = null

      if (normalized === 'student') {
        detail = await soft(fetchStudentProfile(userId), null)

        // Active placement
        const lease = await soft(fetchActivePlacement(userId), null)
        housing.value = lease
          ? {
              placed: true,
              accommodationId: lease.room?.accommodation?.id,
              accommodationName: lease.room?.accommodation?.name || '—',
              roomType: cap(lease.room?.accommodation?.room_type),
              landlordName: lease.landlord?.full_name || '—',
              address: composeAddress(lease.room?.accommodation),
              moveIn: lease.start_date,
              room: lease.room?.room_number ? `Room ${lease.room.room_number}` : lease.room?.label || undefined,
            }
          : { placed: false }

        // Boarding history
        const hist = await soft(fetchBoardingHistory(userId), null)
        boardingHistory.value = (hist || []).map((h) => ({
          id: h.id,
          accommodationId: h.accommodation?.id,
          accommodationName: h.accommodation_name || h.accommodation?.name || '—',
          roomType: cap(h.room_type),
          address: composeAddress(h.accommodation),
          period: periodLabel(h.period_start, h.period_end),
        }))

        // Lease history + payments (student detail drawer)
        const leaseHist = await fetchStudentLeaseHistory(userId)
        leases.value = leaseHist
        const leaseIds = leaseHist.map((l) => l.id)
        if (leaseIds.length) {
          const [paymentRows, ledgerRows] = await Promise.all([fetchPaymentsForLeases(leaseIds), fetchLedgerForLeases(leaseIds)])
          payments.value = paymentRows
          ledger.value = ledgerRows
        }
      } else if (normalized === 'landlord') {
        detail = await soft(fetchLandlordProfile(userId), null)

        // Listed accommodations
        const props = await soft(fetchLandlordAccommodations(userId), null)
        accommodationRows.value = props || []
      }

      // Reviews — landlord/landlady = reviews received as manager; student =
      // tenant reviews received (see fetchReviewsReceived).
      if (normalized === 'landlord' || normalized === 'student') {
        const kind = normalized === 'landlord' ? 'manager' : 'tenant'
        userReviews.value = await soft(fetchReviewsReceived(userId, kind), [])
      } else {
        userReviews.value = []
      }

      try {
        verificationDocs.value = await fetchVerificationDocs(userId)
      } catch {
        verificationDocs.value = []
      }

      // A landlord/landlady's record accounts for their properties' permits too, so the
      // Documents tab is the whole compliance picture rather than only the two
      // files they uploaded against their own account.
      if (normalized === 'landlord') {
        try {
          accommodationDocs.value = await fetchAccommodationDocs(
            accommodationRows.value.map((p: any) => p.id).filter(Boolean),
          )
        } catch {
          accommodationDocs.value = []
        }
      }

      userDetail.value = detail
    } catch (err) {
      console.error('Failed to load user detail:', err)
      userDetail.value = null
    } finally {
      detailLoading.value = false
    }
  }

  async function loadAccountState(userId: string) {
    try {
      const [s, events, methods, closedAt] = await Promise.all([
        fetchAccountStanding(userId),
        fetchAccountEvents(userId),
        // Admin accounts are refused here; their menu has nothing to offer anyway.
        fetchSignInMethods(userId).catch(() => null),
        fetchClosedAt(userId),
      ])
      if (selectedUser.value?.rawId !== userId) return
      standing.value = s
      accountEvents.value = events
      signIn.value = methods
      closed.value = !!closedAt
    } catch {
      // The record still reads without them: no reason line, no OSAS decisions in Activity.
    }
  }

  // Drawer preview — construction lives in features/users/userPreview.ts.
  const userPreview = computed<DrawerPreview>(() =>
    buildUserPreview({
      selectedUser: selectedUser.value,
      userDetail: userDetail.value,
      housing: housing.value,
      boardingHistory: boardingHistory.value,
      accommodationRows: accommodationRows.value,
      userReviews: userReviews.value,
      verificationDocs: verificationDocs.value,
      accommodationDocs: accommodationDocs.value,
      leases: leases.value,
      payments: payments.value,
      ledger: ledger.value,
      standing: standing.value,
      accountEvents: accountEvents.value,
      campusResponseRate: campusResponseRate.value,
    })
  )

  return {
    drawerOpen,
    selectedUser,
    detailLoading,
    standing,
    signIn,
    closed,
    openUser,
    fetchDetail,
    loadAccountState,
    userPreview,
  }
}
