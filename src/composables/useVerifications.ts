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
  /** Populated by OCR at upload time (e.g. mobile ML Kit / edge function). */
  extractedName?: string
  extractedSchoolId?: string
  extractedGovId?: string
  ownerId?: string
}

function getStatusStyle(status: string) {
  const def = getStatus(status)
  return { tone: def.tone, icon: def.icon || 'mdi:clock-outline' }
}

export function useVerifications() {
  const loading = ref(true)
  const notify = useNotify()

  const activeTab = ref<'student' | 'accommodation_manager' | 'accommodation'>('student')
  const search = ref('')
  const currentPage = ref(1)
  const selectedRequest = ref<VerificationRequest | null>(null)

  const activeFilters = ref<{ status: string[] }>({ status: [] })
  const filterConfig = [
    {
      label: 'Status',
      key: 'status',
      options: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Reviewing', value: 'Reviewing' },
      ],
    },
  ]

  function clearFilters() {
    activeFilters.value = { status: [] }
  }

  const studentRequests = ref<VerificationRequest[]>([])
  const accommodationManagerRequests = ref<VerificationRequest[]>([])
  const accommodationRequests = ref<VerificationRequest[]>([])

  const tabs = [
    { name: 'student', label: 'Student' },
    { name: 'accommodation_manager', label: 'Accommodation Manager' },
    { name: 'accommodation', label: 'Accommodation' },
  ]

  const searchPlaceholder = computed(() => {
    if (activeTab.value === 'student') return 'Search student name...'
    if (activeTab.value === 'accommodation_manager') return 'Search accommodation manager name...'
    return 'Search accommodation name...'
  })

  const columns = computed(() => {
    const label =
      activeTab.value === 'student' ? 'Student'
        : activeTab.value === 'accommodation_manager' ? 'Accommodation Manager'
          : 'Accommodation'
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
      const usersSelectEnriched = `
        id, full_name, email, role, status, created_at,
        student_profiles ( school_id_url, assessment_of_fees_url, extracted_name, extracted_school_id ),
        accommodation_manager_profiles ( government_id_url, extracted_name, extracted_gov_id )
      `
      const usersSelectBase = `
        id, full_name, email, role, status, created_at,
        student_profiles ( school_id_url, assessment_of_fees_url ),
        accommodation_manager_profiles ( government_id_url )
      `
      let usersResult: any = await supabase
        .from('users')
        .select(usersSelectEnriched)
        .in('status', ['pending', 'reviewing'])
        .order('created_at', { ascending: false })
      // Fall back when the OCR columns (added by the verification_workflow
      // migration) are not present yet, so the page still loads.
      if (usersResult.error && /does not exist/.test(usersResult.error.message)) {
        usersResult = await supabase
          .from('users')
          .select(usersSelectBase)
          .in('status', ['pending', 'reviewing'])
          .order('created_at', { ascending: false })
      }
      const users = usersResult.data
      const userError = usersResult.error

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
              extractedName: profile.extracted_name || '',
              extractedSchoolId: profile.extracted_school_id || '',
            }
          })

        accommodationManagerRequests.value = users
          .filter((u: any) => u.role?.toLowerCase() === 'accommodation_manager')
          .map((l: any) => {
            const profile = Array.isArray(l.accommodation_manager_profiles) ? l.accommodation_manager_profiles[0] : l.accommodation_manager_profiles || {}
            const actualFiles: { name: string; url: string }[] = []
            if (profile.government_id_url) actualFiles.push({ name: 'Government ID', url: profile.government_id_url })
            return {
              id: `REQ-AM${l.id.substring(0, 4).toUpperCase()}`,
              rawId: l.id,
              name: l.full_name || 'Unknown Accommodation Manager',
              email: l.email,
              owner: '',
              initials: getInitials(l.full_name),
              type: 'Accommodation Manager Identity',
              files: actualFiles,
              status: capitalize(l.status),
              statusStyle: getStatusStyle(l.status),
              submitted: getTimeAgo(l.created_at),
              avatarColor: 'teal-7',
              extractedName: profile.extracted_name || '',
              extractedGovId: profile.extracted_gov_id || '',
            }
          })
      }

      const { data: accommodations, error: accommodationError } = await supabase
        .from('accommodations')
        .select(`id, name, status, accommodation_manager_id, manager:accommodation_manager_id ( full_name )`)
        .in('status', ['pending', 'reviewing'])

      if (accommodationError) {
        console.warn('Could not fetch accommodations:', accommodationError.message)
      } else if (accommodations) {
        accommodationRequests.value = (accommodations as any[]).map((p: any) => {
          const ownerName = Array.isArray(p.manager) ? p.manager[0]?.full_name : (p.manager as any)?.full_name || 'Unknown Accommodation Manager'
          return {
            id: `REQ-AC${p.id.substring(0, 4).toUpperCase()}`,
            rawId: p.id,
            name: p.name || 'Unnamed Accommodation',
            email: '',
            owner: ownerName,
            ownerId: p.accommodation_manager_id,
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
    if (activeTab.value === 'accommodation_manager') return accommodationManagerRequests.value
    return accommodationRequests.value
  })

  const filteredRows = computed(() => filterArr(currentDataArray.value))

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
    const activeStatus = activeFilters.value.status
    if (activeStatus && activeStatus.length) {
      result = result.filter((row) =>
        activeStatus.some((v) => String(v).toLowerCase() === String(row.status).toLowerCase()),
      )
    }
    return result
  }
  function paginateArr(arr: VerificationRequest[]) {
    const start = (currentPage.value - 1) * 10
    return arr.slice(start, start + 10)
  }

  const studentFiltered = computed(() => filterArr(studentRequests.value))
  const accommodationManagerFiltered = computed(() => filterArr(accommodationManagerRequests.value))
  const accommodationFiltered = computed(() => filterArr(accommodationRequests.value))

  const studentPaginated = computed(() => paginateArr(studentFiltered.value))
  const accommodationManagerPaginated = computed(() => paginateArr(accommodationManagerFiltered.value))
  const accommodationPaginated = computed(() => paginateArr(accommodationFiltered.value))

  const totalLabel = computed(
    () => `${filteredRows.value.length} total ${filteredRows.value.length === 1 ? 'request' : 'requests'}`,
  )

  const emptyTitle = computed(() => {
    if (activeTab.value === 'student') return 'All caught up!'
    if (activeTab.value === 'accommodation_manager') return 'All caught up!'
    return 'All caught up!'
  })
  const emptyMessage = computed(() => {
    if (activeTab.value === 'student') return 'No pending student verifications.'
    if (activeTab.value === 'accommodation_manager') return 'No pending accommodation-manager verifications.'
    return 'No pending accommodation accreditations.'
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
  watch([search, activeFilters], () => {
    currentPage.value = 1
  }, { deep: true })

  async function handleDecision(decisionPayload: any) {
    if (!selectedRequest.value) return
    loading.value = true
    try {
      const req = selectedRequest.value
      const isAccommodation = req.id.startsWith('REQ-AC')
      const decision = decisionPayload?.decision || 'approve'
      // Reject with "allow resubmission" is a soft reject (user can re-upload);
      // otherwise it's a hard reject.
      const allowResub = decision === 'reject' && decisionPayload?.allowResubmission === true

      let newStatus: 'pending' | 'reviewing' | 'accredited' | 'rejected' | 'verified'
      if (decision === 'approve') newStatus = isAccommodation ? 'accredited' : 'verified'
      else if (allowResub) newStatus = 'reviewing'
      else newStatus = 'rejected'

      const rawId = req.rawId
      const { data, error } = isAccommodation
        ? await supabase.from('accommodations').update({ status: newStatus as 'pending' | 'reviewing' | 'accredited' | 'rejected' }).eq('id', rawId).select()
        : await supabase.from('users').update({ status: newStatus as any }).eq('id', rawId).select()

      if (error) {
        notify.error('Database error', error.message)
        throw error
      }

      const verb =
        decision === 'approve'
          ? isAccommodation ? 'accredited' : 'verified'
          : allowResub ? 'sent back for resubmission' : 'rejected'

      if (!data || data.length === 0) {
        notify.warning('No rows updated', 'This is likely a Row Level Security (RLS) policy restriction.')
      } else {
        notify.success(isAccommodation ? 'Accommodation ' + verb : 'User ' + verb, `Status set to "${newStatus}".`)
      }

      // --- Close the loop: record the decision + notify (best-effort) -------
      const actorId = (await supabase.auth.getUser()).data.user?.id || null
      const entityType = isAccommodation ? 'accommodation' : 'user'
      const subjectUserId = isAccommodation ? (req as any).ownerId : rawId

      try {
        await supabase.from('audit_logs').insert({
          action: allowResub ? 'verification.resubmit' : `verification.${decision}`,
          actor_id: actorId,
          entity_id: rawId,
          entity_type: entityType,
          before_json: { status: req.status },
          after_json: {
            status: newStatus,
            decision,
            allow_resubmission: allowResub,
            tags: decisionPayload?.tags ?? null,
            notes: decisionPayload?.notes ?? null,
          },
        } as any)
      } catch (e: any) {
        console.warn('audit_logs insert failed (apply verification_workflow migration?):', e?.message)
      }

      try {
        const notifs: any[] = []
        if (subjectUserId) {
          const subjectBody =
            decision === 'approve'
              ? `Your ${isAccommodation ? 'accommodation' : 'account'} has been verified.`
              : allowResub
                ? `We need more information — please re-upload your documents.${decisionPayload?.notes ? ' Note: ' + decisionPayload.notes : ''}`
                : `Your ${isAccommodation ? 'accommodation' : 'account'} was rejected.${decisionPayload?.notes ? ' Reason: ' + decisionPayload.notes : ''}`
          notifs.push({
            user_id: subjectUserId,
            type: 'verification',
            title:
              decision === 'approve' ? 'Verification approved'
                : allowResub ? 'Resubmission requested' : 'Verification rejected',
            body: subjectBody,
            link_url: isAccommodation ? `/verifications?focus=verification:${rawId}` : '/profile',
          })
        }
        if (actorId) {
          notifs.push({
            user_id: actorId,
            type: 'system',
            title: 'Verification decision recorded',
            body: `You ${verb} ${req.name}.`,
            link_url: isAccommodation ? `/verifications?focus=verification:${rawId}` : `/users?user=${rawId}`,
          })
        }
        if (notifs.length) await supabase.from('notifications').insert(notifs as any)
      } catch (e: any) {
        console.warn('notifications insert failed (apply verification_workflow migration?):', e?.message)
      }

      try {
        await (supabase as any).from('verification_requests').insert({
          entity_type: entityType,
          entity_id: rawId,
          type: req.type,
          status:
            decision === 'approve' ? 'approved'
              : allowResub ? 'resubmission_requested'
                : 'rejected',
          reviewed_by: actorId,
          reviewed_at: new Date().toISOString(),
          rejection_reasons: decisionPayload?.tags ?? null,
          decision_notes: decisionPayload?.notes ?? null,
        })
      } catch (e: any) {
        console.warn('verification_requests insert failed (apply verification_workflow migration?):', e?.message)
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
    activeFilters,
    filterConfig,
    clearFilters,
    currentPage,
    selectedRequest,
    tabs,
    columns,
    studentRequests,
    accommodationManagerRequests,
    accommodationRequests,
    filteredRows,
    paginatedRows,
    studentFiltered,
    accommodationManagerFiltered,
    accommodationFiltered,
    studentPaginated,
    accommodationManagerPaginated,
    accommodationPaginated,
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
