<template>
  <q-table
    :rows="paddedRows"
    :columns="columns as QTableColumn[]"
    :row-key="rowKey"
    :hide-no-data="loading"
    flat
    class="custom-data-table"
    hide-pagination
    hide-bottom
    :pagination="pagination"
  >
<template #header="tp">
      <q-tr :props="tp" :key="'header'" class="header-row border-bottom">
        <q-th class="text-muted text-weight-bold custom-th row-num-cell" scope="col">#</q-th>
        <q-th
          v-for="col in tp.cols"
          :key="col.name"
          :props="{ ...tp, col }"
          class="text-muted text-weight-bold text-uppercase custom-th"
          :class="[col.headerClasses, { 'sortable-th': canSort(col), 'sorted-th': sort?.by === col.name }]"
          :aria-sort="canSort(col) ? (sort?.by !== col.name ? 'none' : sort?.desc ? 'descending' : 'ascending') : undefined"
          :tabindex="canSort(col) ? 0 : undefined"
          @click="toggleSort(col)"
          @keydown.enter.prevent="toggleSort(col)"
          @keydown.space.prevent="toggleSort(col)"
        >
          {{ col.label }}
          <Icon
            v-if="canSort(col)"
            :icon="sort?.by === col.name && sort?.desc ? 'lucide:arrow-down' : 'lucide:arrow-up'"
            width="12"
            height="12"
            class="sort-icon"
          />
        </q-th>
        <q-th v-if="rowChevron" class="row-chevron-cell" scope="col"></q-th>
      </q-tr>
    </template>

    <!-- Single root <q-tr> per row: avoids the duplicate-key warning that a
         v-if/v-else chain at the slot root would trigger, and keeps rows
         rendered (a bare <template> wrapper renders as display:none). -->
    <template #body="tp">
      <q-tr
        :props="tp"
        :key="tp.row[rowKey] || tp.row.id || `row-${tp.rowIndex}`"
        :class="[
          'body-row',
          rowClass ? rowClass(tp.row) : '',
          { 'skeleton-row': loading, 'empty-row bg-surface': tp.row._isEmpty }
        ]"
        @click="!loading && !tp.row._isEmpty && emit('row-click', tp.row)"
      >
        <template v-if="loading">
          <q-td class="skeleton-cell row-num-cell">
            <q-skeleton type="rect" animation="wave" class="cell-skeleton" />
          </q-td>
          <!-- The column's own sizing class rides along, or a skeleton for a
               fixed-width column would render at the shared 1-1-0 share instead
               of that column's real width, and the row would visibly reflow the
               moment loading finishes and the real cells take over. -->
          <q-td v-for="col in columns" :key="col.name" :props="tp" class="skeleton-cell" :class="col.headerClasses">
            <q-skeleton type="rect" animation="wave" class="cell-skeleton" />
          </q-td>
          <q-td v-if="rowChevron" class="row-chevron-cell"></q-td>
        </template>

        <!-- Padding rows exist only to hold the table's height; they are not
             records, so they get a blank cell rather than a number. -->
        <template v-else-if="tp.row._isEmpty">
          <q-td class="row-num-cell"></q-td>
          <q-td v-for="col in columns" :key="col.name" :props="tp" :class="col.headerClasses"></q-td>
          <q-td v-if="rowChevron" class="row-chevron-cell"></q-td>
        </template>

        <!-- The number is handed to the slot rather than rendered here, because
             most callers wrap their cells in their own <q-tr> with its own
             @click.stop — a cell rendered at this level would sit outside that
             row and not respond to clicking it. Every caller must render
             `rowNumber` as its first <q-td>, or its columns will be one short
             of the header. -->
        <template v-else>
          <slot name="body" :props="tp" :row-number="startIndex + tp.rowIndex + 1"></slot>
          <!-- Landed outside the slot's own <q-tr> the same way `rowNumber`'s
               cell is, on purpose — see the note above it. Renders as the row's
               last flex cell regardless of whether the caller wraps its cells
               in a <q-tr> of its own or not. -->
          <q-td v-if="rowChevron" class="row-chevron-cell">
            <Icon icon="lucide:chevron-right" width="16" height="16" class="chevron-icon" />
          </q-td>
        </template>
      </q-tr>
    </template>
</q-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SortState } from '@/composables/useSort'
import type { QTableColumn } from 'quasar'
import type { TableColumn, TableRow } from '@/types/table'

const props = withDefaults(
  defineProps<{
    rows: TableRow[]
    columns: TableColumn[]
    rowKey?: string
    pagination?: { rowsPerPage?: number }
    loading?: boolean
    rowClass?: ((row: TableRow) => string) | undefined
    /**
     * Position of this page's first row in the full list, so the `#` column
     * counts continuously (page 2 starts at 11, not 1). Callers slice their own
     * rows before passing them, so `rowIndex` alone restarts every page.
     */
    startIndex?: number
    /**
     * A trailing muted chevron on every row — the "this is tappable" cue that
     * cursor/hover can't give on the landscape tablets this console runs on.
     * Off by default: a table whose rows already carry their own action (an
     * inline "Review →" link, an edit button) would show two affordances for
     * one thing, so this is opt-in per table rather than automatic everywhere.
     */
    rowChevron?: boolean
    /**
     * Header click-to-sort (`v-model:sort`, state from useSort). The caller does
     * the sorting, before it slices out a page; this only draws and toggles it.
     * Left unbound, headers stay plain.
     */
    sort?: SortState | undefined
  }>(),
  { rowKey: 'id', pagination: () => ({ rowsPerPage: 10 }), loading: false, startIndex: 0, rowChevron: false, rowClass: undefined, sort: undefined },
)

const emit = defineEmits<{
  (e: 'row-click', row: TableRow): void
  (e: 'update:sort', value: SortState): void
}>()

// Unlabelled columns hold actions, not values.
const canSort = (col: TableColumn) => props.sort !== undefined && col.sortable !== false && !!col.label

/** Ascending → descending → back to the list's own order. */
function toggleSort(col: TableColumn) {
  if (!canSort(col)) return
  const s = props.sort
  emit('update:sort', s?.by !== col.name ? { by: col.name, desc: false } : s?.desc ? null : { by: col.name, desc: true })
}

const paddedRows = computed(() => {
  const perPage = props.pagination.rowsPerPage || 10
  const currentLength = props.rows.length

  if (perPage === 0) return props.rows

  if (currentLength === 0) {
    return Array.from({ length: perPage }, (_, i) => ({
      _isEmpty: true,
      [props.rowKey]: `empty-${i}`
    }))
  }

  const remainder = currentLength % perPage
  if (remainder === 0) return props.rows

  const paddingNeeded = perPage - remainder
  const padding = Array.from({ length: paddingNeeded }, (_, i) => ({
    _isEmpty: true,
    [props.rowKey]: `empty-pad-${i}`
  }))

  return [...props.rows, ...padding]
})
</script>

<style scoped>
/* The `class` prop lands on the root .q-table__container div */
.custom-data-table {
  border-radius: 0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.border-bottom {
  border-bottom: 1px solid var(--c-border);
}

.custom-th {
  font-size: 11px !important;
  letter-spacing: 0.3px;
}

.sortable-th {
  cursor: pointer;
  user-select: none;
  gap: 4px;
}
.sortable-th:hover,
.sortable-th:focus-visible,
.sorted-th {
  color: var(--c-text) !important;
}
/* Faint on hover so a header reads as clickable; solid once sorted. */
.sort-icon {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--t-fast, 0.15s ease);
}
.sortable-th:hover .sort-icon,
.sortable-th:focus-visible .sort-icon { opacity: 0.4; }
.sorted-th .sort-icon { opacity: 1; color: var(--c-primary); }

/* Row-number column. Every other cell is `flex: 1 1 0` (see the shared th/td
   rule below), so without a fixed basis this would claim an equal share of the
   width. Narrow and fixed, and it sits outside the caller's `headerStyle`
   percentages — those redistribute across what is left. */
.custom-data-table :deep(.row-num-cell) {
  flex: 0 0 56px !important;
  justify-content: center;
  color: var(--c-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding: 0 8px !important;
}

.custom-data-table :deep(thead .row-num-cell) {
  font-size: 11px !important;
  letter-spacing: 0.3px;
}

.custom-data-table :deep(tbody .row-num-cell .cell-skeleton) {
  max-width: 24px;
}

/* Trailing tap cue (`row-chevron` prop). Narrow, fixed, quiet — it names the
   row as tappable without competing with the row's own content for attention. */
.custom-data-table :deep(.row-chevron-cell) {
  flex: 0 0 32px !important;
  justify-content: center;
  padding: 0 !important;
}
.custom-data-table :deep(tbody .row-chevron-cell .chevron-icon) {
  color: var(--c-border-strong, #cbcbcb);
  transition: color var(--t-fast, 0.15s ease), transform var(--t-fast, 0.15s ease);
}
.custom-data-table :deep(tbody tr:hover .row-chevron-cell .chevron-icon) {
  color: var(--c-primary);
  transform: translateX(2px);
}

/* ---- Fill parent height, disable scrolling entirely ---- */
.custom-data-table :deep(.q-table__middle) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden !important;
  max-height: none !important;
  display: flex;
  flex-direction: column;
}

.custom-data-table :deep(.q-table__middle table) {
  height: 100%;
  flex: 1 1 auto;
  display: flex !important;
  flex-direction: column;
}

/* A short viewport cannot hold ten rows at their 46px minimum, and the table
 * clips rather than scrolls — so below tablet-landscape height the body scrolls
 * instead. Tall screens keep the deliberate no-scrollbar look. */
@media (max-height: 820px) {
  .custom-data-table :deep(.q-table__middle) {
    overflow-y: auto !important;
  }
}

/* ---- Header stays compact, body stretches to fill ---- */
.custom-data-table :deep(thead) {
  flex-shrink: 0;
  display: flex !important;
  flex-direction: column;
  min-height: 44px;
}

.custom-data-table :deep(tbody) {
  flex: 1 1 auto;
  min-height: 0;
  display: flex !important;
  flex-direction: column;
}

.custom-data-table :deep(thead tr),
.custom-data-table :deep(tbody tr) {
  display: flex !important;
  align-items: center;
  width: 100%;
}

.custom-data-table :deep(thead tr) {
  flex-shrink: 0;
  min-height: 44px;
}

/* Every body row grows equally to fill, capped so it never gets huge */
.custom-data-table :deep(tbody tr) {
  flex: 1 1 0;
  min-height: 46px;
  max-height: 76px;
  height: auto !important;
}

/* ---- Row borders + hover live on the ROW (full width, no cell gaps) ----
 *
 * Scoped to `.body-row` — the class only this component's OWN <q-tr> carries
 * — not bare `tbody tr`. Most callers wrap their cells in a second <q-tr> of
 * their own, for a click handler this component can't provide (see the note
 * by the body slot below). Vue builds the DOM directly rather than parsing an
 * HTML string, so that inner <tr> is a genuine child of this one in the real
 * DOM; a browser's own parser would never let a <tr> nest like that, but
 * nothing here goes through a parser to catch it. A bare `tbody tr` selector
 * matched both, painting the divider twice — once at the row's full width
 * from this element, and again, inset, from the caller's inner one — visible
 * as two close, slightly offset lines under every such row.
 */
.custom-data-table :deep(tbody tr.body-row) {
  border-bottom: 1px solid var(--c-border);
  box-sizing: border-box;
  background-color: var(--c-surface);
}

.custom-data-table :deep(tbody tr.body-row:last-child) {
  border-bottom: none;
}

/* Rows share the empty filler rows' surface; teal on hover. */
.custom-data-table :deep(tbody tr.body-row:hover) {
  background-color: var(--c-primary-soft);
}
/* Filler rows aren't records and can't be opened: a neutral grey, not the
   teal that says "click me". */
.custom-data-table :deep(tbody tr.body-row.empty-row:hover) {
  background-color: var(--c-surface-2);
}

/* Neutralize Quasar's per-cell :before/:after hover & selected overlays —
   they sit inside flex cells and won't line up with the row borders. */
.custom-data-table :deep(tbody td:before),
.custom-data-table :deep(tbody td:after) {
  display: none !important;
  content: none !important;
}

/* Cells are borderless — flex content only, so lines & hover stay aligned */
.custom-data-table :deep(thead th),
.custom-data-table :deep(tbody td) {
  display: flex;
  align-items: center;
  height: 100%;
  flex: 1 1 0;
  min-width: 0;
  padding: 0 16px !important;
  border: none !important;
  overflow: hidden;
}
</style>

<style scoped src="./dataTableCells.css"></style>
