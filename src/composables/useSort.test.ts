import { describe, expect, it } from 'vitest'
import { sortRows } from './useSort'

const rows = [{ n: 'b', v: 10 }, { n: 'a', v: null }, { n: 'C', v: 2 }]
const cols = [{ name: 'n', field: 'n' }, { name: 'v', field: (r: { v: number | null }) => r.v }]

describe('sortRows', () => {
  it('leaves the order alone when unsorted', () => {
    expect(sortRows(rows, null, cols)).toBe(rows)
  })
  it('sorts text case-insensitively', () => {
    expect(sortRows(rows, { by: 'n', desc: false }, cols).map((r) => r.n)).toEqual(['a', 'b', 'C'])
  })
  it('sorts numbers numerically with blanks last both ways', () => {
    expect(sortRows(rows, { by: 'v', desc: false }, cols).map((r) => r.v)).toEqual([2, 10, null])
    expect(sortRows(rows, { by: 'v', desc: true }, cols).map((r) => r.v)).toEqual([10, 2, null])
  })
})
