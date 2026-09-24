<template>
  <q-table
    :rows="paddedRows"
    :columns="columns"
    :row-key="rowKey"
    :hide-no-data="loading"
    flat
    class="custom-data-table"
    hide-pagination
    hide-bottom
    :pagination="pagination"
  >

    <template v-slot:header="props">
      <q-tr :props="props" :key="'header'" class="header-row border-bottom">
        <q-th class="text-muted text-weight-bold custom-th row-num-cell" scope="col">#</q-th>
        <q-th
          v-for="col in props.cols"
          :key="col.name"
          :props="{ ...props, col }"
          class="text-muted text-weight-bold text-uppercase custom-th"
          :class="col.headerClasses"
        >
          {{ col.label }}
        </q-th>
        <q-th v-if="rowChevron" class="row-chevron-cell" scope="col"></q-th>
      </q-tr>
    </template>

    <!-- Single root <q-tr> per row: avoids the duplicate-key warning that a
         v-if/v-else chain at the slot root would trigger, and keeps rows
         rendered (a bare <template> wrapper renders as display:none). -->
    <template v-slot:body="props">
      <q-tr
        :props="props"
        :key="props.row[rowKey] || props.row.id || `row-${props.rowIndex}`"
        :class="[
          'body-row',
          rowClass ? rowClass(props.row) : '',
          { 'skeleton-row': loading, 'empty-row bg-surface': props.row._isEmpty }
        ]"
        @click="!loading && !props.row._isEmpty && emit('row-click', props.row)"
      >
        <template v-if="loading">
          <q-td class="skeleton-cell row-num-cell">
            <q-skeleton type="rect" animation="wave" class="cell-skeleton" />
          </q-td>
          <!-- The column's own sizing class rides along, or a skeleton for a
               fixed-width column would render at the shared 1-1-0 share instead
               of that column's real width, and the row would visibly reflow the
               moment loading finishes and the real cells take over. -->
          <q-td v-for="col in columns" :key="col.name" :props="props" class="skeleton-cell" :class="col.headerClasses">
            <q-skeleton type="rect" animation="wave" class="cell-skeleton" />
          </q-td>
          <q-td v-if="rowChevron" class="row-chevron-cell"></q-td>
        </template>

        <!-- Padding rows exist only to hold the table's height; they are not
             records, so they get a blank cell rather than a number. -->
        <template v-else-if="props.row._isEmpty">
          <q-td class="row-num-cell"></q-td>
          <q-td v-for="col in columns" :key="col.name" :props="props" :class="col.headerClasses"></q-td>
          <q-td v-if="rowChevron" class="row-chevron-cell"></q-td>
        </template>

        <!-- The number is handed to the slot rather than rendered here, because
             most callers wrap their cells in their own <q-tr> with its own
             @click.stop — a cell rendered at this level would sit outside that
             row and not respond to clicking it. Every caller must render
             `rowNumber` as its first <q-td>, or its columns will be one short
             of the header. -->
        <template v-else>
          <slot name="body" :props="props" :row-number="startIndex + props.rowIndex + 1"></slot>
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
import { computed, PropType } from 'vue'

const props = defineProps({
  rows: { type: Array as PropType<any[]>, required: true },
  columns: { type: Array as PropType<any[]>, required: true },
  rowKey: { type: String, default: 'id' },
  pagination: { type: Object, default: () => ({ rowsPerPage: 10 }) },
  loading: { type: Boolean, default: false },
  rowClass: { type: Function as PropType<((row: any) => string) | undefined>, default: undefined },
  /**
   * Position of this page's first row in the full list, so the `#` column
   * counts continuously (page 2 starts at 11, not 1). Callers slice their own
   * rows before passing them, so `rowIndex` alone restarts every page.
   */
  startIndex: { type: Number, default: 0 },
  /**
   * A trailing muted chevron on every row — the "this is tappable" cue that
   * cursor/hover can't give on the landscape tablets this console runs on.
   * Off by default: a table whose rows already carry their own action (an
   * inline "Review →" link, an edit button) would show two affordances for
   * one thing, so this is opt-in per table rather than automatic everywhere.
   */
  rowChevron: { type: Boolean, default: false }
})

const emit = defineEmits<{
  (e: 'row-click', row: any): void
}>()

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
}

.custom-data-table :deep(tbody tr.body-row:last-child) {
  border-bottom: none;
}

.custom-data-table :deep(tbody tr.body-row:hover) {
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

/* Truncate long text. The cell is a flex container; its text children clip to
   width and show an ellipsis. Applies to bare text and wrapped nodes alike. */
.custom-data-table :deep(thead th),
.custom-data-table :deep(tbody td) {
  min-width: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

/* Headers wrap instead of truncating. A clipped "NO. OF RO…" is useless, and
   forcing every header onto one line made narrow numeric columns reserve width
   for their label rather than their two digits — width the name column needed.
   Body cells keep truncating: a clipped value is still readable, and the full
   one is in the drawer. */
.custom-data-table :deep(thead th) {
  white-space: normal;
  text-overflow: clip;
  line-height: 1.15;
}

/* Direct child elements share the truncation (mono id, ellipsis cells, etc.) */
.custom-data-table :deep(tbody td > *) {
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

/* Stacked sub-content (name over email) — each inner line truncates on its own */
.custom-data-table :deep(tbody td .column) {
  min-width: 0;
  overflow: hidden;
}

.custom-data-table :deep(tbody td .column > div) {
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.custom-data-table :deep(thead th) {
  padding: 12px 16px !important;
}

/*
 * The green fill lives on the ROW, not on each `th`. It used to be painted per
 * cell, which left a grey stripe wherever two cells did not sit flush — the
 * `.col-split` gap (margin-left: auto, used to push a group of columns to the
 * right) has no cell in it, so the row's own grey background showed through
 * and broke the green into two pieces.
 */
.custom-data-table :deep(thead tr.header-row) {
  background-color: var(--c-primary-soft);
}

/* Columns holding a single number: the 16px side padding is most of the cell at
   these widths, so it comes down and the label centres over the digits. */
.custom-data-table :deep(thead th.num-cell),
.custom-data-table :deep(tbody td.num-cell) {
  padding: 0 6px !important;
  justify-content: center;
  text-align: center;
}

.custom-data-table :deep(thead th.num-cell) {
  padding: 12px 6px !important;
}

/* ---- Column sizing ------------------------------------------------------
 *
 * Every cell above is `flex: 1 1 0`, and for a flex item a basis of 0 beats
 * `width` — so a `headerStyle: 'width: 42%'` was silently ignored and all
 * columns came out exactly equal. In an 8-column table that left the name
 * column ~130px, most of it padding and avatar.
 *
 * So a column that holds something of known size claims a fixed basis instead.
 * Put the class on BOTH the `th` (via the column's `headerClasses`) and the
 * `td`, exactly as `.row-num-cell` does — the header and body are separate
 * flex rows and only match if both are sized the same way.
 *
 * These may shrink but never grow, so a row of them leaves slack. `.col-split`
 * collects that slack in front of one column, which pins the identity columns
 * to the left and everything from the split onwards to the right.
 */
.custom-data-table :deep(thead th.col-num),
.custom-data-table :deep(tbody td.col-num) { flex: 0 1 56px !important; }

.custom-data-table :deep(thead th.col-num-wide),
.custom-data-table :deep(tbody td.col-num-wide) { flex: 0 1 68px !important; }

.custom-data-table :deep(thead th.col-badge),
.custom-data-table :deep(tbody td.col-badge) { flex: 0 1 124px !important; }

/* A total plus a two-figure gender breakdown ("12  ♂5 ♀7"). */
.custom-data-table :deep(thead th.col-occupants),
.custom-data-table :deep(tbody td.col-occupants) { flex: 0 1 110px !important; }

/* A short reference code ("REQ-AM1A2B"), monospace. */
.custom-data-table :deep(thead th.col-ref),
.custom-data-table :deep(tbody td.col-ref) { flex: 0 1 110px !important; }

/* A label plus a short second line beneath it (a document type + its count,
   a permit name + its expiry). Wider than `.col-badge` because it holds text
   that isn't a pill. */
.custom-data-table :deep(thead th.col-type),
.custom-data-table :deep(tbody td.col-type) { flex: 0 1 190px !important; }

/* A short date or relative time ("3 days ago", "Sep 22, 2026"). */
.custom-data-table :deep(thead th.col-date),
.custom-data-table :deep(tbody td.col-date) { flex: 0 1 100px !important; }

.custom-data-table :deep(thead th.col-person),
.custom-data-table :deep(tbody td.col-person) { flex: 0 1 244px !important; }

/* Name + secondary line, with a thumbnail: the widest thing in the row. */
.custom-data-table :deep(thead th.col-title),
.custom-data-table :deep(tbody td.col-title) { flex: 0 1 420px !important; }

/* All of the row's leftover width lands in front of this column. */
.custom-data-table :deep(thead th.col-split),
.custom-data-table :deep(tbody td.col-split) { margin-left: auto; }

/* Skeleton loading rows — no hover flash, no background tint */
.custom-data-table :deep(tbody tr.skeleton-row) {
  border-bottom: 1px solid var(--c-border);
}
.custom-data-table :deep(tbody tr.skeleton-row:hover) {
  background-color: transparent;
}

/* Visible skeleton bars (Quasar default is a faint near-white separator) */
.custom-data-table :deep(tbody tr.skeleton-row .cell-skeleton) {
  background: var(--c-surface-2);
  border-radius: var(--radius-sm);
  height: 14px;
  width: 100%;
  max-width: 85%;
}
</style>
