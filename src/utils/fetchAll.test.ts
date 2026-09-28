import { describe, expect, it } from 'vitest'
import { PAGE_SIZE, fetchAll } from './fetchAll'
import { utcMs } from './format'

describe('fetchAll', () => {
  it('pages until a short page and concatenates', async () => {
    const total = PAGE_SIZE * 2 + 5
    const calls: [number, number][] = []
    const rows = await fetchAll((from, to) => {
      calls.push([from, to])
      const data = Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, i) => from + i)
      return Promise.resolve({ data, error: null })
    })
    expect(rows).toHaveLength(total)
    expect(rows[total - 1]).toBe(total - 1)
    expect(calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]])
  })

  it('throws the query error', async () => {
    await expect(fetchAll(() => Promise.resolve({ data: null, error: { message: 'boom' } }))).rejects.toEqual({ message: 'boom' })
  })
})

describe('utcMs', () => {
  it('passes offset-bearing timestamps through unchanged (timestamptz columns)', () => {
    expect(utcMs('2026-09-28T12:11:28.913185+00:00')).toBe(Date.parse('2026-09-28T12:11:28.913Z'))
    expect(utcMs('2026-09-28T20:11:28+08:00')).toBe(Date.parse('2026-09-28T12:11:28Z'))
  })
})
