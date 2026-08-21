import { ref, computed, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { getStatus } from '@/utils/status.config'
import { getInitials, capitalize, getTimeAgo } from '@/utils/format'

export interface VerificationRequest {
  id: string
  rawId: string
  name: string
  email: string
  owner: string
  initials: string
  type: string
  files: { name: string; url: string }[]
  status: string
  statusStyle: { tone: string; icon: string }
  submitted: string
  avatarColor: string
}

function getStatusStyle(status: string) {
  const def = getStatus(status)
  return { tone: def.tone, icon: def.icon || 'mdi:clock-outline' }
}

export function useVerifications() {
  const loading = ref(true)
  const notify = useNotify()

  const activeTab = ref<'student' | 'landlord' | 'property'>('student')
  const search = ref('')
  const currentPage = ref(1)
  const selectedRequest = ref<VerificationRequest | null>(null)

  const studentRequests = ref<VerificationRequest[]>([])
  const landlordRequests = ref<VerificationRequest[]>([])
  const propertyRequests = ref<VerificationRequest[]>([])

  const tabs = [
    { name: 'student', label: 'Student' },
    { name: 'landlord', label: 'Landlord' },
    { name: 'property', label: 'Property' },
  ]

  const searchPlaceholder = computed(() => {
    if (activeTab.value === 'student') return 'Search student name...'
    if (activeTab.value === 'landlord') return 'Search landlord name...'
    return 'Search property name...'
  })

  const columns = computed(() => {
    const label =
      activeTab.value === 'student' ? 'Student'
        : activeTab.value === 'landlord' ? 'Landlord'
          : 'Property'
    return [
      { name: 'entity', required: true, label, align: 'left', field: 'name' },
      { name: 'id', label: 'Ref ID', align: 'left', field: 'id' },
      { name: 'type', label: 'Document', align: 'left', field: 'type' },
      { name: 'status', label: 'Status', align: 'left', field: 'status' },
      { name: 'submitted', label: 'Received', align: 'left', field: 'submitted' },
      { name: 'action', label: '', align: 'right', field: 'action' },
    ]
  })

  async function fetch() {
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
          .filter((u: any) => u.role?.toLowerCase() === 'student')
          .map((s: any) => {
            const profile = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles || {}
            const actualFiles: { name: string; url: string }[] = []
            if (profile.school_id_url) actualFiles.push({ name: 'School ID', url: profile.school_id_url })
            if (profile.assessment_of_fees_url) actualFiles.push({ name: 'Assessment of Fees', url: profile.assessment_of_fees_url })
            return {
              id: `REQ-S${s.id.substring(0, 4).toUpperCase()}`,
              rawId: s.id,
              name: s.full_name || 'Unknown Student',
              email: s.email,
              owner: '',
              initials: getInitials(s.full_name),
              type: 'Enrollment Form / COR',
              files: actualFiles,
              status: capitalize(s.status),
              statusStyle: getStatusStyle(s.status),
              submitted: getTimeAgo(s.created_at),
              avatarColor: 'blue-6',
            }
          })

        landlordRequests.value = users
          .filter((u: any) => u.role?.toLowerCase() === 'landlord')
          .map((l: any) => {
            const profile = Array.isArray(l.landlord_profiles) ? l.landlord_profiles[0] : l.landlord_profiles || {}
            const actualFiles: { name: string; url: string }[] = []
            if (profile.government_id_url) actualFiles.push({ name: 'Government ID', url: profile.government_id_url })
            return {
              id: `REQ-L${l.id.substring(0, 4).toUpperCase()}`,
              rawId: l.id,
              name: l.full_name || 'Unknown Landlord',
              email: l.email,
              owner: '',
              initials: getInitials(l.full_name),
              type: 'Landlord Identity',
              files: actualFiles,
              status: capitalize(l.status),
              statusStyle: getStatusStyle(l.status),
              submitted: getTimeAgo(l.created_at),
              avatarColor: 'teal-7',
            }
          })
      }

      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select(`id, name, status, owner:landlord_id ( full_name )`)
        .in('status', ['pending', 'reviewing'])

      if (propError) {
        console.warn('Could not fetch properties:', propError.message)
      } else if (properties) {
        propertyRequests.value = (properties as any[]).map((p: any) => {
          const ownerName = Array.isArray(p.owner) ? p.owner[0]?.full_name : (p.owner as any)?.full_name || 'Unknown Owner'
          return {
            id: `REQ-P${p.id.substring(0, 4).toUpperCase()}`,
            rawId: p.id,
            name: p.name || 'Unnamed Property',
            email: '',
            owner: ownerName,
            initials: getInitials(p.name),
            type: 'OSAS Accreditation',
            files: [],
            status: capitalize(p.status),
            statusStyle: getStatusStyle(p.status),
            submitted: 'Unknown',
            avatarColor: 'orange-6',
          }
        })
      }
    } catch (err) {
      console.error('Unexpected error fetching verifications:', err)
    } finally {
      loading.value = false
    }
  }

  const currentDataArray = computed(() => {
    if (activeTab.value === 'student') return studentRequests.value
    if (activeTab.value === 'landlord') return landlordRequests.value
    return propertyRequests.value
  })

  const filteredRows = computed(() => {
    let result = currentDataArray.value
    if (search.value) {
      const needle = search.value.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(needle)),
      )
    }
    return result
  })

  const paginatedRows = computed(() => {
    const start = (currentPage.value - 1) * 10
    return filteredRows.value.slice(start, start + 10)
  })

  function filterArr(arr: VerificationRequest[]) {
    let result = arr
    if (search.value) {
      const needle = search.value.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(needle)),
      )
    }
    return result
  }
  function paginateArr(arr: VerificationRequest[]) {
    const start = (currentPage.value - 1) * 10
    return arr.slice(start, start + 10)
  }

  const studentFiltered = computed(() => filterArr(studentRequests.value))
  const landlordFiltered = computed(() => filterArr(landlordRequests.value))
  const propertyFiltered = computed(() => filterArr(propertyRequests.value))

  const studentPaginated = computed(() => paginateArr(studentFiltered.value))
  const landlordPaginated = computed(() => paginateArr(landlordFiltered.value))
  const propertyPaginated = computed(() => paginateArr(propertyFiltered.value))

  const totalLabel = computed(
    () => `${filteredRows.value.length} total ${filteredRows.value.length === 1 ? 'request' : 'requests'}`,
  )

  const emptyTitle = computed(() => {
    if (activeTab.value === 'student') return 'All caught up!'
    if (activeTab.value === 'landlord') return 'All caught up!'
    return 'All caught up!'
  })
  const emptyMessage = computed(() => {
    if (activeTab.value === 'student') return 'No pending student verifications.'
    if (activeTab.value === 'landlord') return 'No pending landlord verifications.'
    return 'No pending property accreditations.'
  })

  function selectRequest(row: VerificationRequest) {
    selectedRequest.value = row
  }
  function clearRequest() {
    selectedRequest.value = null
  }

  watch(activeTab, () => {
    search.value = ''
    currentPage.value = 1
    selectedRequest.value = null
  })
  watch(search, () => {
    currentPage.value = 1
  })

  async function handleDecision(decisionPayload: any) {
    if (!selectedRequest.value) return
    loading.value = true
    try {
      const req = selectedRequest.value
      const isProperty = req.id.startsWith('REQ-P')
      const targetTable = isProperty ? 'properties' : 'users'

      let newStatus: string
      if (decisionPayload.decision === 'approve') {
        newStatus = isProperty ? 'accredited' : 'verified'
      } else if (decisionPayload.decision === 'reject') {
        newStatus = 'rejected'
      } else {
        newStatus = 'reviewing'
      }

      const rawId = req.rawId
      const { data, error } = isProperty
        ? await supabase
            .from('properties')
            .update({ status: newStatus as any })
            .eq('id', rawId)
            .select()
        : await supabase
            .from('users')
            .update({ status: newStatus as any })
            .eq('id', rawId)
            .select()

      console.log('Supabase Update Response:', { data, error })

      if (error) {
        notify.error('Database error', error.message)
        throw error
      }

      const verb =
        decisionPayload.decision === 'approve'
          ? isProperty ? 'accredited' : 'verified'
          : decisionPayload.decision === 'reject'
            ? 'rejected'
            : 'marked for review'

      if (!data || data.length === 0) {
        notify.warning('No rows updated', 'This is likely a Row Level Security (RLS) policy restriction.')
      } else {
        notify.success(isProperty ? 'Property ' + verb : 'User ' + verb, `Status set to "${newStatus}".`)
      }

      await fetch()
    } catch (error: any) {
      console.error('Failed to update status:', error.message)
    } finally {
      selectedRequest.value = null
      loading.value = false
    }
  }

  return {
    loading,
    activeTab,
    search,
    currentPage,
    selectedRequest,
    tabs,
    columns,
    filteredRows,
    paginatedRows,
    studentFiltered,
    landlordFiltered,
    propertyFiltered,
    studentPaginated,
    landlordPaginated,
    propertyPaginated,
    totalLabel,
    searchPlaceholder,
    emptyTitle,
    emptyMessage,
    fetch,
    handleDecision,
    selectRequest,
    clearRequest,
  }
}
