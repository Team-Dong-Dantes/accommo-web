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
      <q-tr :props="props" :key="'header'" class="bg-grey-1 border-bottom">
        <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-grey-6 text-weight-bold text-uppercase custom-th">
          {{ col.label }}
        </q-th>
      </q-tr>
    </template>

    <template v-slot:body="props">

      <!-- Skeleton placeholder cells while loading -->
      <q-tr v-if="loading" :props="props" :key="`skel-${props.rowIndex}`" class="skeleton-row">
        <q-td v-for="col in columns" :key="col.name" :props="props" class="skeleton-cell">
          <q-skeleton type="rect" animation="wave" class="cell-skeleton" />
        </q-td>
      </q-tr>

      <q-tr v-else-if="props.row._isEmpty" :props="props" :key="props.row[rowKey]" class="empty-row bg-surface">
        <q-td v-for="col in columns" :key="col.name" :props="props"></q-td>
      </q-tr>

      <slot v-else name="body" :props="props"></slot>

    </template>

  </q-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  pagination: { type: Object, default: () => ({ rowsPerPage: 10 }) },
  loading: { type: Boolean, default: false }
})

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

/* ---- Row borders + hover live on the ROW (full width, no cell gaps) ---- */
.custom-data-table :deep(tbody tr) {
  border-bottom: 1px solid var(--c-border);
  box-sizing: border-box;
}

.custom-data-table :deep(tbody tr:last-child) {
  border-bottom: none;
}

.custom-data-table :deep(tbody tr:hover) {
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
  background-color: var(--c-primary-soft);
}

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
  border-radius: 6px;
  height: 14px;
  width: 100%;
  max-width: 85%;
}
</style>
