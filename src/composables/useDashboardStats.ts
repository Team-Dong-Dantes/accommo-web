// Dashboard statistics orchestrator.
// Owns the reactive stats object + loading/error state; all Supabase access
// lives in src/api/* modules. Transform logic lifted verbatim from the
// original monolithic load() — no behavior change.

import { errorMessage } from '@/utils/errors'
import { ref, reactive } from 'vue'
import type { DashboardStats } from '@/types/dashboard'
import { registerReset } from '@/utils/pageCache'
import {
  fetchAccommodationRows,
  fetchExpiringAccommodationAccreditations,
  fetchAccreditedPermits,
  fetchPendingAccommodations,
  fetchAccommodationDocumentIndex,
} from '@/api/accommodations'
import { fetchRoomRows } from '@/api/rooms'
import {
  fetchAdminName,
  fetchStudentCount,
  fetchNewStudentCount,
  fetchRegistrationsSince,
  fetchStudentSexes,
} from '@/api/users'
import {
  fetchStudentProfiles,
  fetchEnrichedTickets,
} from '@/api/tickets'
import { currentUserId } from '@/api/notifications'
import { mapTicket } from '@/composables/useTickets'
import { loadAccountRequests } from '@/composables/useVerifications'
import {
  fetchActiveLeaseCount,
  fetchExpiringLeases,
  fetchActiveLeaseAccreditation,
} from '@/api/leases'
import {
  fetchPendingLandlordPaymentVerificationCount,
} from '@/api/payments'
import {
  computeAccommodations,
  computeAccreditationQueue,
  computeComingUp,
  computeRegistrationTrend,
  computeRooms,
  computeStudentDemographics,
  computeTickets,
  computeVerifications,
  emptyStats,
} from './dashboardCompute'

export type { DashboardStats } from '@/types/dashboard'

const DASHBOARD_LOAD_TIMEOUT_MS = 15_000
function settleWithin<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Dashboard data is taking too long to load. Check your connection and retry.'))
    }, DASHBOARD_LOAD_TIMEOUT_MS)

    promise.then(
      (value) => {
        clearTimeout(timeout)
        resolve(value)
      },
      (reason) => {
        clearTimeout(timeout)
        reject(reason)
      },
    )
  })
}

// --- orchestrator ------------------------------------------------------------

// Module scope: the last figures survive navigation, so returning to the
// dashboard shows them at once (dimmed) while load() refreshes them.
// See utils/pageCache.ts.
const data = reactive<DashboardStats>(emptyStats())
const hasLoaded = ref(false)
const lastUpdated = ref<Date | null>(null)
registerReset(() => {
  Object.assign(data, emptyStats())
  hasLoaded.value = false
  lastUpdated.value = null
})

export function useDashboardStats() {
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      const nowIso = new Date().toISOString()
      const thirtyDaysIso = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      const regFetchSince = new Date(Date.now() - 395 * 24 * 3600 * 1000).toISOString()

      // The two work queues read what their pages read, through the pages' own
      // loaders, so the dashboard cannot disagree with them. Either failing
      // blanks its own card, not the dashboard.
      const [
        adminName,
        accommodations,
        rooms,
        studentTotal,
        studentNew,
        profiles,
        sexes,
        ticketRows,
        me,
        activeLeases,
        leaseAccreditation,
        regRows,
        expLeases,
        expAccred,
        accreditedPermits,
        landlordPaymentsPending,
        accountRequests,
        pendingAccommodations,
        accommodationDocuments,
      ] = await settleWithin(Promise.all([
        fetchAdminName(),
        fetchAccommodationRows(),
        fetchRoomRows(),
        fetchStudentCount(),
        fetchNewStudentCount(since),
        fetchStudentProfiles(),
        fetchStudentSexes(),
        fetchEnrichedTickets().then((rows) => rows.map((row) => mapTicket(row))).catch(() => null),
        currentUserId().catch(() => null),
        fetchActiveLeaseCount(),
        fetchActiveLeaseAccreditation(),
        fetchRegistrationsSince(regFetchSince),
        fetchExpiringLeases(nowIso, thirtyDaysIso),
        fetchExpiringAccommodationAccreditations(nowIso, thirtyDaysIso),
        fetchAccreditedPermits(),
        fetchPendingLandlordPaymentVerificationCount(),
        loadAccountRequests().catch(() => null),
        fetchPendingAccommodations(),
        fetchAccommodationDocumentIndex(),
      ]))

      if (adminName) data.adminName = adminName

      // Accommodations / rooms / rent
      computeAccommodations(accommodations, rooms, data)

      // Rooms (occupancy, top occupied)
      computeRooms(rooms, data)

      // Students
      data.students.total = studentTotal
      data.students.newThisMonth = studentNew
      computeStudentDemographics(profiles, sexes, studentTotal, data)

      // Active leases
      data.activeLeases = activeLeases
      data.leasesByAccreditation = leaseAccreditation

      // Landlord/landlady lease payments.
      data.landlordPayments = {
        pendingVerification: landlordPaymentsPending,
      }

      // Registration trend — the 13-month series behind the registrations chart.
      computeRegistrationTrend(regRows, data)

      computeVerifications(accountRequests, data)
      computeTickets(ticketRows, me, data)
      computeAccreditationQueue(pendingAccommodations, accommodationDocuments, data)
      computeComingUp(expAccred, accreditedPermits, expLeases, thirtyDaysIso, data)
    } catch (e) {
      error.value = errorMessage(e, 'Failed to load dashboard data')
    } finally {
      hasLoaded.value = true
      loading.value = false
      lastUpdated.value = new Date()
    }
  }

  return { loading, error, data, hasLoaded, lastUpdated, load }
}
