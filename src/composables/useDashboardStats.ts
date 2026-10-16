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
  fetchPendingVerificationUsers,
  fetchVerificationDocIndex,
} from '@/api/users'
import {
  fetchStudentProfiles,
  fetchTicketSummaries,
} from '@/api/tickets'
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
  computeOperationalQueues,
  computeRegistrationTrend,
  computeRooms,
  computeStudentDemographics,
  computeTicketMix,
  computeVerificationAges,
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

      // 19 queries, down from 26: seven fed transforms that were computed and
      // then rendered nowhere.
      const [
        adminName,
        accommodations,
        rooms,
        studentTotal,
        studentNew,
        profiles,
        sexes,
        ticketRows,
        activeLeases,
        leaseAccreditation,
        regRows,
        expLeases,
        expAccred,
        landlordPaymentsPending,
        verificationUsers,
        verificationDocs,
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
        fetchTicketSummaries(),
        fetchActiveLeaseCount(),
        fetchActiveLeaseAccreditation(),
        fetchRegistrationsSince(regFetchSince),
        fetchExpiringLeases(nowIso, thirtyDaysIso),
        fetchExpiringAccommodationAccreditations(nowIso, thirtyDaysIso),
        fetchPendingLandlordPaymentVerificationCount(),
        fetchPendingVerificationUsers(),
        fetchVerificationDocIndex(),
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

      // Shape, not just depth: how long the queue has been waiting.
      computeVerificationAges(verificationUsers, data)
      computeTicketMix(ticketRows, data)

      computeOperationalQueues(
        verificationUsers,
        verificationDocs,
        pendingAccommodations,
        accommodationDocuments,
        ticketRows,
        data,
      )

      // Expiring leases (active, ending within 30 days)
      data.expiringLeases = expLeases.map(l => ({
        id: l.id,
        end_date: l.end_date,
      }))

      // Expiring accommodation accreditations (within 30 days).
      data.expiringAccreditations = expAccred.length

      data.recentTickets = ticketRows
        .filter((ticket) => ['open', 'in_progress'].includes(ticket.status.toLowerCase()))
        .slice(0, 5)
        .map((ticket) => ({
          id: ticket.id,
          subject: ticket.subject,
          priority: ticket.priority,
          status: ticket.status,
          reported_at: ticket.reported_at,
        }))
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
