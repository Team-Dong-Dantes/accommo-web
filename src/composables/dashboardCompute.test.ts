import { describe, expect, it } from 'vitest'
import type { VerificationRequest } from '@/features/verifications/queue'
import { computeComingUp, computeVerifications, emptyStats } from './dashboardCompute'

const day = 86_400_000
const inDays = (n: number) => new Date(Date.now() + n * day).toISOString()

describe('computeComingUp', () => {
  it('counts only the permit file on record, and only within 30 days', () => {
    const data = emptyStats()
    const name = { name: 'Casa' }
    computeComingUp([], [
      // Newest version first, as fetchAccreditedPermits returns them: the
      // renewed fire certificate hides the old one that is about to lapse.
      { accommodation_id: 'a', doc_type: 'fire_safety', expires_at: inDays(200), accommodation: name },
      { accommodation_id: 'a', doc_type: 'fire_safety', expires_at: inDays(5), accommodation: name },
      { accommodation_id: 'a', doc_type: 'sanitary_permit', expires_at: inDays(-3), accommodation: name },
      { accommodation_id: 'a', doc_type: 'business_permit', expires_at: inDays(40), accommodation: name },
      { accommodation_id: 'a', doc_type: 'building_permit', expires_at: null, accommodation: name },
    ], [], inDays(30), data)
    expect(data.comingUp.map((item) => item.what)).toEqual(['Sanitary permit'])
  })
})

describe('computeVerifications', () => {
  it('splits ready from waiting and names what the waiting ones lack most', () => {
    const request = (ready: boolean, missing: string[]) => ({
      rawId: String(Math.random()), name: 'x', role: 'student', ageDays: 1, late: false, applying: false, ready,
      requirements: ['School ID', 'Assessment of fees'].map((label) => ({ label, ok: !missing.includes(label) })),
    }) as unknown as VerificationRequest
    const data = emptyStats()
    computeVerifications([
      request(true, []),
      request(false, ['Assessment of fees']),
      request(false, ['Assessment of fees', 'School ID']),
    ], data)
    expect(data.verifications).toMatchObject({ ready: 1, waiting: 2, mostMissing: { label: 'Assessment of fees', count: 2 } })
    expect(data.verifications?.rows).toHaveLength(1)
  })
})
