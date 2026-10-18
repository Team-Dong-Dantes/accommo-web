// Shared shapes for the table, filter, and sort components.

export interface FilterOption {
  label: string
  value: string | number
}

export interface FilterGroup {
  label: string
  key: string
  options: FilterOption[]
}

/** The values chosen in each filter group, by group key. */
export type ActiveFilters = Record<string, Array<string | number>>

/**
 * A table row is whatever its caller holds: DataTable and TableCard are shared
 * by every list in the console and only read the row key the caller names. The
 * caller's own types keep the row's shape; typing it here would mean one
 * generic parameter threaded through every table component.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableRow = any

/** A column definition, in the shape Quasar's q-table takes plus the sort override. */
export interface TableColumn {
  name: string
  label?: string
  align?: string
  field?: string | ((row: TableRow) => unknown)
  sortable?: boolean
  sortValue?: ((row: TableRow) => unknown) | undefined
  headerClasses?: string
  [key: string]: unknown
}
