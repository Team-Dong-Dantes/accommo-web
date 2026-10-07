import { computed, ref } from 'vue'

export type SortState = { by: string; desc: boolean } | null

/**
 * The bits of a table column sorting reads. `field` is the column's own
 * Quasar field; `sortValue` overrides it where the displayed value would sort
 * wrong (a formatted date, a status that has a workflow order, not an
 * alphabetical one). `sortable: false` leaves the header unclickable.
 */
export type SortColumn = {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field?: string | ((row: any) => unknown)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sortValue?: ((row: any) => unknown) | undefined
  sortable?: boolean
}

const isBlank = (v: unknown) => v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))

/** Blanks sink to the bottom in both directions; they are not "smallest". */
export function compareValues(a: unknown, b: unknown, desc = false): number {
  if (isBlank(a) || isBlank(b)) return isBlank(a) === isBlank(b) ? 0 : isBlank(a) ? 1 : -1
  const dir = desc ? -1 : 1
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * dir
  if (typeof a === 'boolean' && typeof b === 'boolean') return (Number(a) - Number(b)) * dir
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }) * dir
}

export function sortRows<T>(rows: T[], sort: SortState, columns: SortColumn[]): T[] {
  const col = sort && columns.find((c) => c.name === sort.by)
  if (!col) return rows
  const { field } = col
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const get = col.sortValue ?? (typeof field === 'function' ? field : (r: any) => (field ? r[field] : undefined))
  return [...rows].sort((a, b) => compareValues(get(a), get(b), sort!.desc))
}

/**
 * Click-to-sort for a table whose rows are paged by the caller. Sort the
 * filtered list, then slice it: sorting only the slice would order one page.
 */
export function useSort<T>(rows: () => T[], columns: () => SortColumn[]) {
  const sort = ref<SortState>(null)
  const sorted = computed(() => sortRows(rows(), sort.value, columns()))
  return { sort, sorted }
}
