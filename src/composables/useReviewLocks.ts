// Who has a verification request open. Opening a request claims it (status
// 'reviewing' plus reviewing_by/at); presence and the claim's age decide when an
// abandoned claim goes back to the queue. Used by useVerifications only.
import { ref, watch, type Ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { capitalize } from '@/utils/format'
import { useReviewPresence } from '@/composables/useReviewPresence'
import { useAuthStore } from '@/stores/auth'
import { getStatusStyle, type VerificationRequest } from '@/features/verifications/queue'

/**
 * `reviewing` marks a request that a reviewer currently has open, so the queue
 * shows who is already being worked and two admins do not duplicate a
 * decision. Only a `pending` request is claimed — a decided one keeps its
 * verdict — and it is released again if the window closes with no decision,
 * which matters now that the reviewer can page through the queue.
 */
export function useReviewLocks(opts: {
  /** Every queue the page holds, so a status change reaches each copy. */
  lists: () => VerificationRequest[][]
  selectedRequest: Ref<VerificationRequest | null>
}) {
  const { selectedRequest } = opts
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
    const lists = opts.lists()
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
    const lists = opts.lists()
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

  return { claimedIds, presence, isLockedByOther, reviewerOf, sweepStaleLocks, claimForReview, releaseReview }
}
