<template>
  <q-page class="users-page q-pa-md column no-wrap" style="background-color: var(--c-bg)">

    <div class="row justify-between items-end non-shrink">
      <TabNav v-model="activeEntityTab" :tabs="tabs" />
    </div>

    <TableCard
      v-if="!selectedRequest"
      v-model:search="search"
      v-model:page="currentPage"
      :filters="[]"
      :active-filters="{ }"
      :search-placeholder="searchPlaceholder"
      :total-label="`${filteredRows.length} total ${filteredRows.length === 1 ? 'request' : 'requests'}`"
      :total-items="filteredRows.length"
      item-name="requests"
      :loading="loading"
      @refresh="fetchVerifications"
    >
      <template #panels>
        <q-tab-panels v-model="activeEntityTab" animated style="background: transparent; height: 100%;">

            <!-- STUDENT TAB -->
            <q-tab-panel name="student" class="q-pa-none">
              <DataTable :rows="paginatedRows" :columns="studentColumns" rowKey="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
                <template #no-data>
                  <div class="full-width row flex-center text-grey-5 q-pa-xl column">
                    <Icon icon="mdi:verified" width="48" height="48" class="q-mb-md" />
                    <div class="text-h6 text-weight-bold">All caught up!</div>
                    <div>No pending student verifications.</div>
                  </div>
                </template>
                <template #body="{ props }">
                  <q-tr :props="props" class="smart-row">
                    <q-td key="student" :props="props">
                      <div class="row items-center no-wrap">
                        <q-avatar size="48px" :color="props.row.avatarColor" text-color="white" class="text-weight-bold q-mr-md shadow-1" style="font-size: 18px">{{ props.row.initials }}</q-avatar>
                        <div class="column">
                          <div class="text-weight-bold text-dark" style="font-size: 14px; line-height: 1.2">{{ props.row.name }}</div>
                          <div class="text-grey-6" style="font-size: 12px; margin-top: 2px">{{ props.row.email }}</div>
                        </div>
                      </div>
                    </q-td>
                    <q-td key="id" :props="props" class="text-grey-6" style="font-family: monospace; font-size: 13px">{{ props.row.id }}</q-td>
                    <q-td key="type" :props="props">
                      <div class="text-dark text-weight-medium" style="font-size: 13px">{{ props.row.type }}</div>
                      <div class="row items-center text-grey-6" style="font-size: 11px; margin-top: 2px">
                        <Icon icon="mdi:file-document-outline" width="12" height="12" class="q-mr-xs" />
                        {{ props.row.files?.length || 0 }} document{{ props.row.files?.length === 1 ? '' : 's' }}
                      </div>
                    </q-td>
                    <q-td key="status" :props="props">
                      <BadgePill :bg="props.row.statusStyle.bg" :text-color="props.row.statusStyle.text" :icon="props.row.statusStyle.icon" :label="props.row.status" />
                    </q-td>
                    <q-td key="submitted" :props="props" class="text-grey-7" style="font-size: 12px">{{ props.row.submitted }}</q-td>
                    <q-td key="action" :props="props" class="text-right">
                      <q-btn unelevated dense color="primary" text-color="white" no-caps class="text-weight-bold review-btn" @click="selectedRequest = props.row">
                        Review <Icon icon="mdi:chevron-right" class="q-ml-xs" width="14" height="14" />
                      </q-btn>
                    </q-td>
                  </q-tr>
                </template>
              </DataTable>
            </q-tab-panel>

            <!-- LANDLORD TAB -->
            <q-tab-panel name="landlord" class="q-pa-none">
              <DataTable :rows="paginatedRows" :columns="landlordColumns" rowKey="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
                <template #no-data>
                  <div class="full-width row flex-center text-grey-5 q-pa-xl column">
                    <Icon icon="mdi:verified" width="48" height="48" class="q-mb-md" />
                    <div class="text-h6 text-weight-bold">All caught up!</div>
                    <div>No pending landlord verifications.</div>
                  </div>
                </template>
                <template #body="{ props }">
                  <q-tr :props="props" class="smart-row">
                    <q-td key="landlord" :props="props">
                      <div class="row items-center no-wrap">
                        <q-avatar size="48px" :color="props.row.avatarColor" text-color="white" class="text-weight-bold q-mr-md shadow-1" style="font-size: 18px">{{ props.row.initials }}</q-avatar>
                        <div class="column">
                          <div class="text-weight-bold text-dark" style="font-size: 14px; line-height: 1.2">{{ props.row.name }}</div>
                          <div class="text-grey-6" style="font-size: 12px; margin-top: 2px">{{ props.row.email }}</div>
                        </div>
                      </div>
                    </q-td>
                    <q-td key="id" :props="props" class="text-grey-6" style="font-family: monospace; font-size: 13px">{{ props.row.id }}</q-td>
                    <q-td key="type" :props="props">
                      <div class="text-dark text-weight-medium" style="font-size: 13px">{{ props.row.type }}</div>
                      <div class="row items-center text-grey-6" style="font-size: 11px; margin-top: 2px">
                        <Icon icon="mdi:file-document-outline" width="12" height="12" class="q-mr-xs" />
                        {{ props.row.files?.length || 0 }} document{{ props.row.files?.length === 1 ? '' : 's' }}
                      </div>
                    </q-td>
                    <q-td key="status" :props="props">
                      <BadgePill :bg="props.row.statusStyle.bg" :text-color="props.row.statusStyle.text" :icon="props.row.statusStyle.icon" :label="props.row.status" />
                    </q-td>
                    <q-td key="submitted" :props="props" class="text-grey-7" style="font-size: 12px">{{ props.row.submitted }}</q-td>
                    <q-td key="action" :props="props" class="text-right">
                      <q-btn unelevated dense color="primary" text-color="white" no-caps class="text-weight-bold review-btn" @click="selectedRequest = props.row">
                        Review <Icon icon="mdi:chevron-right" class="q-ml-xs" width="14" height="14" />
                      </q-btn>
                    </q-td>
                  </q-tr>
                </template>
              </DataTable>
            </q-tab-panel>

            <!-- PROPERTY TAB -->
            <q-tab-panel name="property" class="q-pa-none">
              <DataTable :rows="paginatedRows" :columns="propertyColumns" rowKey="id" :loading="loading" :pagination="{ rowsPerPage: 10 }">
                <template #no-data>
                  <div class="full-width row flex-center text-grey-5 q-pa-xl column">
                    <Icon icon="mdi:verified" width="48" height="48" class="q-mb-md" />
                    <div class="text-h6 text-weight-bold">All caught up!</div>
                    <div>No pending property accreditations.</div>
                  </div>
                </template>
                <template #body="{ props }">
                  <q-tr :props="props" class="smart-row">
                    <q-td key="property" :props="props">
                      <div class="row items-center no-wrap">
                        <q-avatar size="48px" :color="props.row.avatarColor" text-color="white" class="text-weight-bold q-mr-md shadow-1" style="font-size: 18px">{{ props.row.initials }}</q-avatar>
                        <div class="column">
                          <div class="text-weight-bold text-dark" style="font-size: 14px; line-height: 1.2">{{ props.row.name }}</div>
                          <div class="text-grey-6" style="font-size: 12px; margin-top: 2px">Owned by {{ props.row.owner }}</div>
                        </div>
                      </div>
                    </q-td>
                    <q-td key="id" :props="props" class="text-grey-6" style="font-family: monospace; font-size: 13px">{{ props.row.id }}</q-td>
                    <q-td key="type" :props="props">
                      <div class="text-dark text-weight-medium" style="font-size: 13px">{{ props.row.type }}</div>
                      <div class="row items-center text-grey-6" style="font-size: 11px; margin-top: 2px">
                        <Icon icon="mdi:file-document-outline" width="12" height="12" class="q-mr-xs" />
                        {{ props.row.files?.length || 0 }} document{{ props.row.files?.length === 1 ? '' : 's' }}
                      </div>
                    </q-td>
                    <q-td key="status" :props="props">
                      <BadgePill :bg="props.row.statusStyle.bg" :text-color="props.row.statusStyle.text" :icon="props.row.statusStyle.icon" :label="props.row.status" />
                    </q-td>
                    <q-td key="submitted" :props="props" class="text-grey-7" style="font-size: 12px">{{ props.row.submitted }}</q-td>
                    <q-td key="action" :props="props" class="text-right">
                      <q-btn unelevated dense color="primary" text-color="white" no-caps class="text-weight-bold review-btn" @click="selectedRequest = props.row">
                        Review <Icon icon="mdi:chevron-right" class="q-ml-xs" width="14" height="14" />
                      </q-btn>
                    </q-td>
                  </q-tr>
                </template>
              </DataTable>
            </q-tab-panel>

          </q-tab-panels>
      </template>
    </TableCard>

    <q-card v-else flat class="detail-card">
      <VerificationReview
        :request="selectedRequest"
        @close="selectedRequest = null"
        @submit="handleDecision"
      />
    </q-card>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

import TabNav from '@/components/common/TabNav.vue'
import TableCard from '@/components/common/TableCard.vue'
import DataTable from '@/components/common/DataTable.vue'
import BadgePill from '@/components/common/BadgePill.vue'
import VerificationReview from '@/components/admin/VerificationReview.vue'

const loading = ref(true)
const activeEntityTab = ref('student')
const search = ref('')
const currentPage = ref(1)
const selectedRequest = ref<any>(null)

const tabs = [
  { name: 'student', label: 'Student' },
  { name: 'landlord', label: 'Landlord' },
  { name: 'property', label: 'Property' },
]

const studentRequests = ref<any[]>([])
const landlordRequests = ref<any[]>([])
const propertyRequests = ref<any[]>([])

const searchPlaceholder = computed(() => {
  if (activeEntityTab.value === 'student') return 'Search student name...'
  if (activeEntityTab.value === 'landlord') return 'Search landlord name...'
  return 'Search property name...'
})

const studentColumns = [
  { name: 'student', required: true, label: 'Student', align: 'left', field: 'name' },
  { name: 'id', label: 'Ref ID', align: 'left', field: 'id' },
  { name: 'type', label: 'Document', align: 'left', field: 'type' },
  { name: 'status', label: 'Status', align: 'left', field: 'status' },
  { name: 'submitted', label: 'Received', align: 'left', field: 'submitted' },
  { name: 'action', label: '', align: 'right', field: 'action' }
]

const landlordColumns = [
  { name: 'landlord', required: true, label: 'Landlord', align: 'left', field: 'name' },
  { name: 'id', label: 'Ref ID', align: 'left', field: 'id' },
  { name: 'type', label: 'Document', align: 'left', field: 'type' },
  { name: 'status', label: 'Status', align: 'left', field: 'status' },
  { name: 'submitted', label: 'Received', align: 'left', field: 'submitted' },
  { name: 'action', label: '', align: 'right', field: 'action' }
]

const propertyColumns = [
  { name: 'property', required: true, label: 'Property', align: 'left', field: 'name' },
  { name: 'id', label: 'Ref ID', align: 'left', field: 'id' },
  { name: 'type', label: 'Document', align: 'left', field: 'type' },
  { name: 'status', label: 'Status', align: 'left', field: 'status' },
  { name: 'submitted', label: 'Received', align: 'left', field: 'submitted' },
  { name: 'action', label: '', align: 'right', field: 'action' }
]

async function fetchVerifications() {
  loading.value = true

  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(`
        id, full_name, email, role, status, created_at,
        student_profiles ( school_id_url, assessment_of_fees_url ),
        landlord_profiles ( government_id_url )
      `)
      .in('status', ['pending', 'reviewing'])
      .order('created_at', { ascending: false })

    if (userError) {
      console.error('Error fetching users for verification:', userError.message)
    } else if (users) {
      studentRequests.value = users
        .filter(u => u.role?.toLowerCase() === 'student')
        .map(s => {
          const profile = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles || {}
          const actualFiles = []

          if (profile.school_id_url) actualFiles.push({ name: 'School ID', url: profile.school_id_url })
          if (profile.assessment_of_fees_url) actualFiles.push({ name: 'Assessment of Fees', url: profile.assessment_of_fees_url })

          return {
            id: `REQ-S${s.id.substring(0, 4).toUpperCase()}`,
            rawId: s.id,
            name: s.full_name || 'Unknown Student',
            email: s.email,
            initials: getInitials(s.full_name),
            type: 'Enrollment Form / COR',
            files: actualFiles,
            status: capitalize(s.status),
            statusStyle: getStatusStyle(s.status),
            submitted: getTimeAgo(s.created_at),
            avatarColor: 'blue-6'
          }
        })

      landlordRequests.value = users
        .filter(u => u.role?.toLowerCase() === 'landlord')
        .map(l => {
          const profile = Array.isArray(l.landlord_profiles) ? l.landlord_profiles[0] : l.landlord_profiles || {}
          const actualFiles = []

          if (profile.government_id_url) actualFiles.push({ name: 'Government ID', url: profile.government_id_url })

          return {
            id: `REQ-L${l.id.substring(0, 4).toUpperCase()}`,
            rawId: l.id,
            name: l.full_name || 'Unknown Landlord',
            email: l.email,
            initials: getInitials(l.full_name),
            type: 'Landlord Identity',
            files: actualFiles,
            status: capitalize(l.status),
            statusStyle: getStatusStyle(l.status),
            submitted: getTimeAgo(l.created_at),
            avatarColor: 'teal-7'
          }
        })
    }

    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select(`
        id, name, status,
        owner:landlord_id ( full_name )
      `)
      .in('status', ['pending', 'reviewing'])

    if (propError) {
      console.warn('Could not fetch properties:', propError.message)
    } else if (properties) {
      propertyRequests.value = properties.map(p => {
        const ownerName = Array.isArray(p.owner) ? p.owner[0]?.full_name : (p.owner as any)?.full_name || 'Unknown Owner'

        return {
          id: `REQ-P${p.id.substring(0, 4).toUpperCase()}`,
          rawId: p.id,
          name: p.name || 'Unnamed Property',
          owner: ownerName,
          initials: getInitials(p.name),
          type: 'OSAS Accreditation',
          files: [],
          status: capitalize(p.status),
          statusStyle: getStatusStyle(p.status),
          submitted: 'Unknown',
          avatarColor: 'orange-6'
        }
      })
    }

  } catch (err) {
    console.error('Unexpected error fetching verifications:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVerifications()
})

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length > 1) {
    const first = parts[0]?.[0] ?? ''
    const last = parts[parts.length - 1]?.[0] ?? ''
    return (first + last).toUpperCase()
  }
  if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase()
  return '?'
}

function capitalize(val: string) {
  if (!val) return 'Pending'
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
}

function getStatusStyle(status: string) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'reviewing') return { bg: 'indigo-1', text: 'indigo-6', icon: 'mdi:eye' }
  return { bg: 'orange-1', text: 'orange-7', icon: 'mdi:clock-outline' }
}

function getTimeAgo(dateString: string | null | undefined) {
  if (!dateString) return 'Unknown'
  const past = new Date(dateString).getTime()
  if (isNaN(past)) return 'Unknown'

  const diffInMins = Math.floor((new Date().getTime() - past) / 60000)
  if (diffInMins < 60) return `${diffInMins} mins ago`
  if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)} hrs ago`
  return `${Math.floor(diffInMins / 1440)} days ago`
}

const currentDataArray = computed(() => {
  if (activeEntityTab.value === 'student') return studentRequests.value
  if (activeEntityTab.value === 'landlord') return landlordRequests.value
  return propertyRequests.value
})

const filteredRows = computed(() => {
  let result = currentDataArray.value

  if (search.value) {
    const needle = search.value.toLowerCase()
    result = result.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(needle)))
  }

  return result
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredRows.value.slice(start, start + 10)
})

watch(activeEntityTab, () => {
  search.value = ''
  currentPage.value = 1
  selectedRequest.value = null
})

watch(search, () => {
  currentPage.value = 1
})

async function handleDecision(decisionPayload: any) {
  if (!selectedRequest.value) return;

  loading.value = true;

  try {
    const isProperty = selectedRequest.value.id.startsWith('REQ-P');
    const targetTable = isProperty ? 'properties' : 'users';

    let newStatus: string;
    if (decisionPayload.decision === 'approve') {
      newStatus = isProperty ? 'accredited' : 'verified';
    } else if (decisionPayload.decision === 'reject') {
      newStatus = 'rejected';
    } else {
      newStatus = 'reviewing';
    }

    // Call Supabase with .select() to verify returned rows
    const rawId = selectedRequest.value.rawId
    const { data, error } = isProperty
      ? await supabase
          .from('properties')
          .update({ status: newStatus as 'pending' | 'reviewing' | 'accredited' | 'rejected' | 'delisted' })
          .eq('id', rawId)
          .select()
      : await supabase
          .from('users')
          .update({ status: newStatus as 'unverified' | 'pending' | 'reviewing' | 'verified' | 'rejected' | 'suspended' })
          .eq('id', rawId)
          .select();

    // Log the server payload for debugging RLS vs database constraints
    console.log('Supabase Update Response:', { data, error });

    if (error) {
      alert(`Database Error: ${error.message}`);
      throw error;
    }

    if (!data || data.length === 0) {
      alert('Silent block: 0 rows updated. This is definitely a Row Level Security (RLS) policy restriction.');
    } else {
      console.log(`Successfully updated ${targetTable} status to ${newStatus}`);
    }

    await fetchVerifications();
  } catch (error: any) {
    console.error('Failed to update status:', error.message);
  } finally {
    selectedRequest.value = null;
    loading.value = false;
  }
}
</script>

<style scoped>
.users-page {
  overflow: hidden !important;
  height: 100% !important;
}

.detail-card {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.custom-radius :deep(.q-field__control) {
  border-radius: 12px !important;
}

.smart-row {
  transition: background-color 0.2s ease;
}
.smart-row:hover {
  background-color: var(--c-surface-2) !important;
}

</style>
