import { describe, it, expect } from 'vitest'
import { buildUserPreview } from './userPreview'

// HistoryTab renders, in order: historyCards → card → history → empty state.
// A placeholder row pushed into `history` for unplaced students kept the third
// branch matching forever, so the empty state was unreachable and the tab showed
// a one-dot timeline instead. These guard the branch the empty state needs.

const student = {
  id: 'u1',
  role: 'student',
  name: 'Test Student',
  email: 'test@isu.edu.ph',
  contact: '',
  joined: 'Aug 24, 2026',
  status: 'verified',
}

function previewFor(overrides: Record<string, unknown> = {}) {
  return buildUserPreview({
    selectedUser: student,
    userDetail: null,
    housing: null,
    boardingHistory: [],
    accommodationRows: [],
    userReviews: [],
    ...overrides,
  })
}

describe('buildUserPreview — boarding history', () => {
  it('leaves history empty for a student who has never been placed', () => {
    const preview = previewFor()
    expect(preview.historyCards).toEqual([])
    expect(preview.history).toEqual([])
    expect(preview.card).toBeUndefined()
  })

  it('still records the placement status for the stats block', () => {
    expect(previewFor().placement?.status).toBe('Not placed')
  })

  it('builds a timeline once the student has a placement', () => {
    const preview = previewFor({
      housing: {
        placed: true,
        accommodationName: 'Pogi Boarding House',
        roomType: 'shared',
        address: 'Echague, Isabela',
        moveIn: '2026-08-01',
      },
    })
    expect(preview.history?.length).toBe(1)
    expect(preview.historyCards?.length).toBe(1)
  })
})

describe('buildUserPreview — tabs that carry an empty state', () => {
  it('assigns the arrays so the tabs still appear when there is nothing in them', () => {
    const preview = previewFor()
    expect(preview.files).toEqual([])
    expect(preview.reviews).toEqual([])
  })

  it('keeps the account-created event, which is real rather than a placeholder', () => {
    const activity = previewFor().activity ?? []
    expect(activity).toHaveLength(1)
    expect(activity[0]?.text).toContain('created their account')
  })
})
