<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeTab" :tabs="tabs" />

      <q-btn v-if="auth.can('reports')" unelevated color="teal-7" no-caps class="text-weight-bold rounded-button q-mb-md" @click="reportOpen = true">
        <Icon icon="lucide:file-chart-column" class="on-left" width="18" height="18" />Report
      </q-btn>
    </div>

    <div class="users-body">
    <TableCard
      v-model:search="search"
      :search-placeholder="activeTab === 'students' ? 'Search by name, e-mail, or student ID…' : 'Search by name or e-mail…'"
      v-model:active-filters="activeFilters"
      v-model:page="currentPage"
      :filters="filterConfig"
      :loading="loading"
      :total-label="totalLabel"
      :total-items="filteredRows.length"
      :item-name="activeTab === 'students' ? 'students' : 'landlords/landladies'"
      @clear-filters="clearFilters"
      @refresh="load"
    >
      <template #panels>
        <q-tab-panels v-model="activeTab" animated style="background: transparent; height: 100%;">
          <!-- Students -->
          <q-tab-panel name="students" class="q-pa-none">
            <DataTable :rows="paginatedRows" :columns="studentColumns" row-key="rawId" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="(currentPage - 1) * 10" row-chevron v-model:sort="sort">
              <template #no-data><div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon :icon="loadError ? 'lucide:circle-alert' : 'lucide:user-x'" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">{{ loadError ? 'Could not load accounts' : 'No students match' }}</div>
                  <div v-if="loadError" class="text-caption q-mt-xs" style="color: var(--c-danger)">{{ loadError }}</div>
                </div></template>
              <template #body="{ props, rowNumber }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click.stop="openUser(props.row)">
                  <q-td class="row-num-cell">{{ rowNumber }}</q-td>
                  <q-td key="user" :props="props">
                    <UserInfoCell :initials="props.row.initials" :name="props.row.name" :email="props.row.email" :avatar-color="props.row.avatarColor" :avatar-url="props.row.avatarUrl" />
                  </q-td>
                  <q-td key="studentId" :props="props" class="text-ink us-mono">{{ props.row.studentId || '—' }}</q-td>
                  <q-td key="academic" :props="props">
                    <div class="us-stack">
                    <div class="text-ink us-clip" :title="props.row.college">{{ collegeShort(props.row.college) || '—' }}</div>
                    <div class="text-muted us-sub">{{ [props.row.program, props.row.yearLevel && `Year ${props.row.yearLevel}`].filter(Boolean).join(' · ') }}</div>
                    </div>
                  </q-td>
                  <q-td key="stay" :props="props">
                    <div v-if="props.row.stay" class="us-stack">
                      <div class="text-ink us-clip">{{ props.row.stay.accommodation }}</div>
                      <div class="text-muted us-sub">{{ props.row.stay.room }}</div>
                    </div>
                    <span v-else class="text-muted us-none">Not placed</span>
                  </q-td>
                  <q-td key="status" :props="props">
                    <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.status" />
                  </q-td>
                  <q-td key="lastActive" :props="props" class="text-muted">{{ props.row.lastActive }}</q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>

          <!-- Landlords / landladies -->
          <q-tab-panel name="landlords" class="q-pa-none">
            <DataTable :rows="paginatedRows" :columns="landlordColumns" row-key="rawId" :loading="loading" :pagination="{ rowsPerPage: 10 }" :start-index="(currentPage - 1) * 10" row-chevron v-model:sort="sort">
              <template #no-data><div class="full-width row flex-center text-muted q-pa-xl column">
                  <Icon :icon="loadError ? 'lucide:circle-alert' : 'lucide:user-x'" width="48" height="48" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold">{{ loadError ? 'Could not load accounts' : 'No landlords/landladies match' }}</div>
                  <div v-if="loadError" class="text-caption q-mt-xs" style="color: var(--c-danger)">{{ loadError }}</div>
                </div></template>
              <template #body="{ props, rowNumber }">
                <q-tr :props="props" class="smart-row cursor-pointer" @click.stop="openUser(props.row)">
                  <q-td class="row-num-cell">{{ rowNumber }}</q-td>
                  <q-td key="user" :props="props">
                    <UserInfoCell :initials="props.row.initials" :name="props.row.name" :email="props.row.email" :avatar-color="props.row.avatarColor" :avatar-url="props.row.avatarUrl" />
                  </q-td>
                  <q-td key="title" :props="props" class="text-ink">{{ props.row.roleTitle }}</q-td>
                  <q-td key="accommodations" :props="props">
                    <div v-if="props.row.portfolio.count" class="row items-center no-wrap q-gutter-x-sm">
                      <!-- One pip per accommodation, filled when accredited; capped at 5 with a "+n". -->
                      <span class="us-pips" aria-hidden="true">
                        <i
                          v-for="n in Math.min(props.row.portfolio.count, 5)"
                          :key="n"
                          :class="{ 'is-on': n <= props.row.portfolio.accredited }"
                        />
                        <span v-if="props.row.portfolio.count > 5" class="text-muted us-more">+{{ props.row.portfolio.count - 5 }}</span>
                      </span>
                      <span class="text-ink text-weight-medium us-num">{{ props.row.portfolio.count }}</span>
                      <q-tooltip>{{ props.row.portfolio.accredited }} of {{ props.row.portfolio.count }} accredited</q-tooltip>
                    </div>
                    <span v-else class="text-muted us-none">None yet</span>
                  </q-td>
                  <q-td key="beds" :props="props" class="text-ink us-num">
                    {{ props.row.portfolio.beds ? `${props.row.portfolio.taken} / ${props.row.portfolio.beds}` : '—' }}
                  </q-td>
                  <q-td key="response" :props="props" class="us-num" :class="props.row.responseState === 'below' ? 'us-warn' : 'text-ink'">
                    {{ props.row.responseRate != null ? `${props.row.responseRate}%` : '—' }}
                  </q-td>
                  <q-td key="status" :props="props">
                    <BadgePill :tone="props.row.statusStyle.tone" :icon="props.row.statusStyle.icon" :label="props.row.status" />
                  </q-td>
                  <q-td key="lastActive" :props="props" class="text-muted">{{ props.row.lastActive }}</q-td>
                </q-tr>
              </template>
            </DataTable>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </TableCard>

    <DetailDrawer
      v-model="drawerOpen"
      size="full"
      close-on-backdrop
      :preview="userPreview"
      :loading="detailLoading"
      :management-actions="userManagementActions"
      @manage="onManageUser"
    />

    <AccountActionDialog :spec="actionSpec" @close="closeAction" />
    <EditProfileDialog :user-id="editingUserId" :name="selectedUser?.name ?? ''" @close="editingUserId = null" @saved="onProfileSaved" />

    <ReportDialog v-model="reportOpen" :reports="['boarders', 'landlords']" :initial="activeTab === 'landlords' ? 'landlords' : 'boarders'" />
    <!-- The open person's own report, from their record's menu. -->
    <ReportDialog
      v-model="personReportOpen"
      :reports="[String(selectedUser?.role).toLowerCase() === 'landlord' ? 'landlord' : 'student']"
      :record-id="selectedUser?.rawId"
    />

    </div><!-- /users-body -->

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSort } from '@/composables/useSort'
import { useUserRecord } from '@/composables/useUserRecord'
import { useRoute } from 'vue-router'

import TabNav from '@/components/ui/TabNav.vue'
import TableCard from '@/components/table/TableCard.vue'
import DataTable from '@/components/table/DataTable.vue'
import { matches, useUserDirectory, type DirectoryRow } from '@/features/users/useUserDirectory'
import ReportDialog from '@/features/reports/ReportDialog.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import { getStatus, getTone } from '@/utils/status.config'
import { counted } from '@/utils/filterOptions'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import { useAuthStore } from '@/stores/auth'
import type { AccountStatus, EditableProfile } from '@/api/accounts'
import EditProfileDialog from '@/features/users/EditProfileDialog.vue'
import { useAccountActions } from '@/features/users/accountActions'
import { humanizeEnum } from '@/utils/format'
import AccountActionDialog from '@/features/users/AccountActionDialog.vue'


// The list: students and landlords/landladies, in their own tabs.
const { rows: allRows, students, landlords, campusResponseRate, loading, error: loadError, load } = useUserDirectory()
const search = ref('')
const currentPage = ref(1)
const activeTab = ref<'students' | 'landlords'>('students')
const EMPTY_FILTERS = (): Record<string, string[]> => ({})
const activeFilters = ref<Record<string, string[]>>(EMPTY_FILTERS())
const route = useRoute()
const { drawerOpen, selectedUser, detailLoading, standing, signIn, closed, openUser, fetchDetail, loadAccountState, userPreview } = useUserRecord(campusResponseRate)

const tabs = computed(() => [
  { name: 'students', label: `Students (${students.value.length})` },
  { name: 'landlords', label: `Landlords/Landladies (${landlords.value.length})` },
])
const tabRows = computed(() => (activeTab.value === 'students' ? students.value : landlords.value))

const STATUS_ORDER = ['Pending', 'Reviewing', 'Verified', 'Needs Resubmission', 'Rejected', 'Suspended', 'Unverified']
const LAST_ACTIVE: Record<string, string> = { week: 'This week', month: 'This month', stale: 'Over a month ago', never: 'Never logged in' }
const EMAIL: Record<string, string> = { unconfirmed: 'Not confirmed', confirmed: 'Confirmed' }

// Option values are row fields' values; the list keeps a row when its field
// equals any chosen value (see `matches`).
const filterConfig = computed(() => {
  if (activeTab.value === 'students') {
    const rows = students.value
    return [
      { label: 'Status', key: 'status', options: counted(rows, 'status', undefined, STATUS_ORDER) },
      { label: 'Current stay', key: 'stayState', options: counted(rows, 'stayState', (v) => (v === 'placed' ? 'Placed' : 'Not placed'), ['not_placed', 'placed']) },
      { label: 'Accommodation', key: 'stayAccommodation', options: counted(rows, 'stayAccommodation') },
      { label: 'College', key: 'college', options: counted(rows, 'college', collegeShort) },
      { label: 'Year level', key: 'yearLevel', options: counted(rows, 'yearLevel', (v) => `Year ${v}`) },
      { label: 'Last active', key: 'activeState', options: counted(rows, 'activeState', (v) => LAST_ACTIVE[v] ?? v, Object.keys(LAST_ACTIVE)) },
      { label: 'E-mail', key: 'emailState', options: counted(rows, 'emailState', (v) => EMAIL[v] ?? v, Object.keys(EMAIL)) },
    ]
  }
  const rows = landlords.value
  const campus = campusResponseRate.value
  const ACCREDIT: Record<string, string> = { accredited: 'Has accredited', unaccredited: 'None accredited yet', none: 'No accommodation' }
  const RESPONSE: Record<string, string> = {
    below: `Below average${campus != null ? ` (${campus}%)` : ''}`,
    ok: 'At or above average',
    none: 'No rate yet',
  }
  return [
    { label: 'Status', key: 'status', options: counted(rows, 'status', undefined, STATUS_ORDER) },
    { label: 'Title', key: 'roleTitle', options: counted(rows, 'roleTitle') },
    { label: 'Accreditation', key: 'accreditState', options: counted(rows, 'accreditState', (v) => ACCREDIT[v] ?? v, Object.keys(ACCREDIT)) },
    { label: 'Response rate', key: 'responseState', options: counted(rows, 'responseState', (v) => RESPONSE[v] ?? v, Object.keys(RESPONSE)) },
    { label: 'Last active', key: 'activeState', options: counted(rows, 'activeState', (v) => LAST_ACTIVE[v] ?? v, Object.keys(LAST_ACTIVE)) },
    { label: 'E-mail', key: 'emailState', options: counted(rows, 'emailState', (v) => EMAIL[v] ?? v, Object.keys(EMAIL)) },
  ]
})

const studentColumns = [
  { name: 'user', required: true, label: 'STUDENT', align: 'left', field: 'name' },
  { name: 'studentId', label: 'STUDENT ID', align: 'left', field: 'studentId' },
  { name: 'academic', label: 'COLLEGE · PROGRAM', align: 'left', field: 'college' },
  { name: 'stay', label: 'CURRENT STAY', align: 'left', field: (r: DirectoryRow) => r.stay?.accommodation ?? '' },
  { name: 'status', label: 'STATUS', align: 'left', field: 'status' },
  { name: 'lastActive', label: 'LAST ACTIVE', align: 'left', field: 'lastLoginAt' },
]
const landlordColumns = [
  { name: 'user', required: true, label: 'NAME', align: 'left', field: 'name' },
  { name: 'title', label: 'TITLE', align: 'left', field: 'roleTitle' },
  { name: 'accommodations', label: 'ACCOMMODATIONS', align: 'left', field: (r: DirectoryRow) => r.portfolio?.count ?? 0 },
  { name: 'beds', label: 'BEDS TAKEN', align: 'right', field: (r: DirectoryRow) => r.portfolio?.taken ?? 0 },
  { name: 'response', label: 'RESPONSE', align: 'right', field: 'responseRate' },
  { name: 'status', label: 'STATUS', align: 'left', field: 'status' },
  { name: 'lastActive', label: 'LAST ACTIVE', align: 'left', field: 'lastLoginAt' },
]

/** "College of Computing Studies, … (CCSICT)" → "CCSICT"; the full name is the cell's tooltip. */
function collegeShort(college: string): string {
  return college.match(/\(([^)]+)\)\s*$/)?.[1] ?? college
}

function clearFilters() {
  activeFilters.value = EMPTY_FILTERS()
}

const totalLabel = computed(() => {
  const n = filteredRows.value.length
  return activeTab.value === 'students'
    ? `${n} student${n === 1 ? '' : 's'}`
    : `${n} landlord${n === 1 ? '' : 's'}/landlad${n === 1 ? 'y' : 'ies'}`
})

// A new tab starts unfiltered on its first page.
watch(activeTab, () => { clearFilters(); search.value = ''; sort.value = null; currentPage.value = 1 })

// Report: Boarders or Landlords/Landladies, opening on the one this tab lists.
const reportOpen = ref(false)
const personReportOpen = ref(false)

onMounted(async () => {
  await load()
  openUserFromRoute()
})

function openUserFromRoute() {
  const userId = route.query.user
  if (typeof userId !== 'string') return
  const row = allRows.value.find((user) => user.rawId === userId)
  if (row && selectedUser.value?.rawId !== userId) {
    activeTab.value = String(row.role).toLowerCase() === 'landlord' ? 'landlords' : 'students'
    void openUser(row)
  }
}

watch(() => route.query.user, openUserFromRoute)



const filteredRows = computed(() => {
  let result = tabRows.value
  for (const [key, values] of Object.entries(activeFilters.value)) {
    if (values.length) result = result.filter((r) => matches(r, key, values))
  }
  if (search.value) {
    const needle = search.value.toLowerCase()
    result = result.filter((row) => [row.name, row.email, row.studentId].some((val) => String(val ?? '').toLowerCase().includes(needle)))
  }
  return result
})

const { sort, sorted: sortedRows } = useSort(() => filteredRows.value, () => (activeTab.value === 'students' ? studentColumns : landlordColumns))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * 10
  return sortedRows.value.slice(start, start + 10)
})

watch([search, activeFilters, sort], () => { currentPage.value = 1 }, { deep: true })


// OSAS's controls over the account: the menu, the confirmation dialog and what
// each action does live in features/users/accountActions.ts. This page only
// keeps the table row and the drawer in step when one of them lands.
const auth = useAuthStore()
const actorId = computed(() => auth.user?.id ?? '')
const isSuperadmin = computed(() => auth.isSuperadmin)
const editingUserId = ref<string | null>(null)


async function onAccountChanged(next: AccountStatus) {
  const u = selectedUser.value
  if (!u) return
  const style = { tone: getTone(next), icon: getStatus(next).icon || 'lucide:circle-help' }
  const label = humanizeEnum(next)
  u.status = label
  u.statusStyle = style
  const row = allRows.value.find((r) => r.rawId === u.rawId)
  if (row) {
    row.status = label
    row.statusStyle = style
  }
  await loadAccountState(u.rawId)
}

const {
  actions: userManagementActions,
  spec: actionSpec,
  open: onManageUser,
  close: closeAction,
} = useAccountActions(
  selectedUser,
  { standing, signIn, closed, actorId, isSuperadmin },
  {
    onChanged: onAccountChanged,
    onEditProfile: () => { editingUserId.value = selectedUser.value?.rawId ?? null },
    onReport: () => { personReportOpen.value = true },
    // A role change moves them to the other tab; a closure renames them. Re-read the table.
    onReload: async () => {
      drawerOpen.value = false
      await load()
    },
  },
)

/** Put the corrections on the table row and the record, then re-read the rest. */
async function onProfileSaved(p: EditableProfile) {
  const u = selectedUser.value
  if (!u) return
  const initials = p.fullName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  for (const target of [u, allRows.value.find((r) => r.rawId === u.rawId)]) {
    if (!target) continue
    target.name = p.fullName.trim()
    target.initials = initials
    target.contact = p.phone.trim() || 'No phone provided'
  }
  await Promise.all([fetchDetail(u.rawId, u.role), loadAccountState(u.rawId)])
}

</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

/* Holds the table + the right-docked detail drawer together so the drawer
   anchors flush to the table's right edge (no margin, inside the card area). */
.users-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Table cells */
/* DataTable cells lay out as a flex row; a two-line cell stacks inside one block. */
.us-stack { min-width: 0; }
.us-mono { font-family: var(--font-mono); }
.us-sub { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.us-clip { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* The italic's last glyph leans past the box; the cell would clip it. */
.us-none { font-style: italic; padding-right: 2px; }
.us-num { font-variant-numeric: tabular-nums; white-space: nowrap; }
.us-pips { display: inline-flex; align-items: center; gap: 3px; }
.us-pips i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid var(--c-primary);
  box-sizing: border-box;
}
.us-pips i.is-on { background: var(--c-primary); }
.us-more { font-size: 11px; margin-left: 2px; }
.us-warn { color: var(--c-warning); font-weight: 600; }
</style>
