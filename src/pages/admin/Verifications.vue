<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />
    </div>

    <div class="table-wrapper">
      <TableCard
        v-if="!selectedRequest"
        v-model:search="search"
        :search-placeholder="searchPlaceholder"
        :filters="[]"
        :active-filters="{}"
        :loading="loading"
        :total-label="totalLabel"
        :rows="paginatedRows"
        :columns="columns"
        row-key="id"
        :rows-per-page="10"
        :total-items="filteredRows.length"
        item-name="requests"
        :page="currentPage"
        @refresh="fetch"
        @update:page="currentPage = $event"
      >
        <template #empty>
          <RichEmptyState icon="mdi:verified" :title="emptyTitle" :message="emptyMessage" />
        </template>
        <template #body="{ props }">
          <q-tr :props="props" class="smart-row">
            <q-td key="entity" :props="props">
              <UserInfoCell
                :initials="props.row.initials"
                :name="props.row.name"
                :email="props.row.email"
                :subtitle="props.row.owner || ''"
                :avatar-color="props.row.avatarColor"
                size="36px"
                font-size="13px"
              />
            </q-td>
            <q-td key="id" :props="props" class="text-muted" style="font-family: monospace; font-size: 13px">{{ props.row.id }}</q-td>
            <q-td key="type" :props="props">
              <div class="text-ink text-weight-medium" style="font-size: 13px">{{ props.row.type }}</div>
              <div class="row items-center text-muted" style="font-size: 11px; margin-top: 2px">
                <Icon icon="mdi:file-document-outline" width="12" height="12" class="q-mr-xs" />
                {{ props.row.files?.length || 0 }} document{{ props.row.files?.length === 1 ? '' : 's' }}
              </div>
            </q-td>
            <q-td key="status" :props="props">
              <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.status" />
            </q-td>
            <q-td key="submitted" :props="props" class="text-muted" style="font-size: 12px">{{ props.row.submitted }}</q-td>
            <q-td key="action" :props="props" class="text-right action-cell">
              <q-btn unelevated dense color="primary" text-color="white" no-caps class="text-weight-bold review-btn" @click="selectRequest(props.row)">
                Review <Icon icon="mdi:chevron-right" class="q-ml-xs" width="14" height="14" />
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </TableCard>

      <q-card v-else flat class="table-container">
        <VerificationReview
          :request="selectedRequest"
          @close="clearRequest"
          @submit="handleDecision"
        />
      </q-card>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { useVerifications } from '@/composables/useVerifications'
import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import RichEmptyState from '@/components/ui/RichEmptyState.vue'
import VerificationReview from '@/components/verification/VerificationReview.vue'
import { Icon } from '@iconify/vue'

const {
  loading,
  activeTab,
  search,
  currentPage,
  selectedRequest,
  tabs,
  columns,
  filteredRows,
  paginatedRows,
  totalLabel,
  searchPlaceholder,
  emptyTitle,
  emptyMessage,
  fetch,
  handleDecision,
  selectRequest,
  clearRequest,
} = useVerifications()

fetch()
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

.table-wrapper {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.table-container {
  background: var(--c-surface);
  border-radius: 0 12px 12px 12px;
  border: 1px solid var(--c-border-strong);
  border-top: none;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important;
  overflow: hidden;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.smart-row {
  transition: background-color 0.2s ease;
}
.smart-row:hover {
  background-color: var(--c-surface-2) !important;
}

.review-btn {
  border-radius: 8px;
  padding: 4px 16px;
  font-size: 12px;
  transition: transform 0.1s ease;
}
.review-btn:active {
  transform: scale(0.96);
}

/* DataTable cells are flex; text-right alone won't move a flex child,
   so right-align the action cell's content */
:deep(.custom-data-table tbody td.action-cell) {
  justify-content: flex-end;
}
</style>
