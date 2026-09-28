// PostgREST returns at most 1,000 rows per request and says nothing when it
// cuts a result short. For lists that can outgrow that — every student, every
// registration — page through with .range() until a short page comes back.

export const PAGE_SIZE = 1000

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>

/**
 * `build(from, to)` must return the same query each time with `.range(from, to)`
 * applied, and an `.order()` on a unique column so pages don't overlap.
 */
export async function fetchAll<T>(build: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}
