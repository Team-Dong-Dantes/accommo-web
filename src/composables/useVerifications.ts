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
  files: { name: string; url: string; type?: string }[]
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

const ACCOMMODATION_PERMITS = [
  { type: 'sanitary_permit', label: 'Sanitary permit' },
  { type: 'fire_safety', label: 'Fire safety permit' },
  { type: 'business_permit', label: 'Business permit' },
  { type: 'building_permit', label: 'Building permit' },
]

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
      const { data: queueRows, error: queueError } = await (supabase as any)
        .rpc('get_verification_queue')

      if (!queueError && queueRows) {
        const grouped = new Map<string, any>()
        for (const row of queueRows as any[]) {
          const existing = grouped.get(row.user_id) ?? {
            id: row.user_id,
            full_name: row.full_name,
            email: row.email,
            role: row.role,
            status: row.user_status,
            created_at: row.created_at,
            documents: [],
          }
          if (row.file_url) {
            existing.documents.push({
              doc_type: row.doc_type,
              file_url: row.file_url,
              filename: row.filename,
            })
          }
          grouped.set(row.user_id, existing)
        }

        const queueUsers = Array.from(grouped.values())
        const mapRequest = (user: any, manager: boolean) => ({
          id: `REQ-${manager ? 'AM' : 'S'}${user.id.substring(0, 4).toUpperCase()}`,
          rawId: user.id,
          name: user.full_name || (manager ? 'Unknown Accommodation Manager' : 'Unknown Student'),
          email: user.email,
          owner: '',
          initials: getInitials(user.full_name),
          type: manager ? 'Accommodation Manager Identity' : 'Enrollment Form / COR',
          files: user.documents.map((document: any) => ({
            name: document.filename || document.doc_type || 'Verification document',
            url: document.file_url,
          })),
          status: capitalize(user.status),
          statusStyle: getStatusStyle(user.status),
          submitted: getTimeAgo(user.created_at),
          avatarColor: manager ? 'teal-7' : 'blue-6',
          extractedName: '',
          ...(manager ? { extractedGovId: '' } : { extractedSchoolId: '' }),
        })
        studentRequests.value = queueUsers
          .filter((user) => String(user.role).toLowerCase().trim() === 'student' || user.documents.some((document: any) =>
            ['school_id', 'assessment', 'assessment_of_fees', 'cor', 'id_card'].includes(String(document.doc_type).toLowerCase()),
          ))
          .map((user) => mapRequest(user, false))
        accommodationManagerRequests.value = queueUsers
          .filter((user) => !studentRequests.value.some((request) => request.rawId === user.id))
          .filter((user) => ['accommodation_manager', 'landlord'].includes(user.role))
          .map((user) => mapRequest(user, true))
      }

      if (!queueError && queueRows) {
        // The RPC is authoritative for users and documents. Continue below to
        // load accommodation requests, but do not overwrite these two lists.
      } else {
      // The mobile app stores submitted files in verification_documents. Keep
      // this queue independent from legacy profile tables so a valid upload is
      // still reviewable when those optional relations are empty or unavailable.
      const usersResult: any = await supabase
        .from('users')
        .select('id, full_name, email, role, status, created_at')
        .order('created_at', { ascending: false })
      const users = usersResult.data
      const userError = usersResult.error

      if (userError) {
        console.error('Error fetching users for verification:', userError.message)
      } else if (users) {
        // Mobile registration stores uploaded files in verification_documents.
        // The profile URL columns are legacy and are not populated by the mobile
        // flow, so load the authoritative document rows for this queue.
        const userIds = (users as any[]).map((user) => user.id)
        // Query all pending document rows independently. This avoids losing a
        // valid request when the user row has an old status or role label.
        const { data: verificationRows, error: verificationError } = await supabase
          .from('verification_documents')
          .select('user_id, doc_type, file_url, filename, status')
          .eq('status', 'pending')

        const [{ data: studentProfiles, error: studentProfileError }, { data: managerProfiles, error: managerProfileError }] = await Promise.all([
          userIds.length
            ? supabase.from('student_profiles').select('user_id, school_id_url, assessment_of_fees_url').in('user_id', userIds)
            : Promise.resolve({ data: [], error: null }),
          userIds.length
            ? supabase.from('accommodation_manager_profiles').select('user_id, government_id_url').in('user_id', userIds)
            : Promise.resolve({ data: [], error: null }),
        ])

        if (verificationError) {
          console.error('Could not fetch verification documents:', verificationError.message)
          notify.error('Verification documents unavailable', 'Apply the verification_documents admin RLS migration in Supabase.')
        }

        const documentsByUser = new Map<string, Array<{ doc_type: string | null; file_url: string | null; filename: string | null }>>()
        for (const document of verificationRows ?? []) {
          if (!document.user_id || !document.file_url) continue
          documentsByUser.set(document.user_id, [
            ...(documentsByUser.get(document.user_id) ?? []),
            document,
          ])
        }

        // Older mobile accounts saved URLs on their profile row before the
        // verification_documents table became authoritative.
        for (const profile of studentProfiles ?? []) {
          if (profile.school_id_url) {
            documentsByUser.set(profile.user_id, [
              ...(documentsByUser.get(profile.user_id) ?? []),
              { doc_type: 'school_id', file_url: profile.school_id_url, filename: 'School ID' },
            ])
          }
          if (profile.assessment_of_fees_url) {
            documentsByUser.set(profile.user_id, [
              ...(documentsByUser.get(profile.user_id) ?? []),
              { doc_type: 'assessment_of_fees', file_url: profile.assessment_of_fees_url, filename: 'Assessment of Fees' },
            ])
          }
        }
        for (const profile of managerProfiles ?? []) {
          if (!profile.government_id_url) continue
          documentsByUser.set(profile.user_id, [
            ...(documentsByUser.get(profile.user_id) ?? []),
            { doc_type: 'government_id', file_url: profile.government_id_url, filename: 'Government ID' },
          ])
        }

        if (studentProfileError) console.warn('Could not fetch student profile documents:', studentProfileError.message)
        if (managerProfileError) console.warn('Could not fetch manager profile documents:', managerProfileError.message)

        const usersWithDocuments = new Set(documentsByUser.keys())
        const userById = new Map((users as any[]).map((user) => [user.id, user]))
        const studentDocumentUsers = new Set(
          Array.from(documentsByUser.entries())
            .filter(([, documents]) => documents.some((document) =>
              ['school_id', 'assessment', 'assessment_of_fees', 'cor', 'id_card'].includes(
                String(document.doc_type).toLowerCase().trim(),
              ),
            ))
            .map(([userId]) => userId),
        )
        // If document rows are visible but the corresponding user query is
        // filtered by an old role/status, retain that user in the queue. The
        // role is normalized below for legacy landlord rows.
        const documentUsers = Array.from(usersWithDocuments)
          .map((id) => userById.get(id))
          .filter(Boolean)
        const pendingUsers = [...(users as any[]).filter((user) =>
          ['pending', 'reviewing'].includes(String(user.status).toLowerCase()) || usersWithDocuments.has(user.id),
        ), ...documentUsers.filter((user) => !usersWithDocuments.has(user.id))]

        studentRequests.value = pendingUsers
          .filter((u: any) => String(u.role).toLowerCase().trim() === 'student' || studentDocumentUsers.has(u.id))
          .map((s: any) => {
            const uploadedDocuments = documentsByUser.get(s.id) ?? []
            const actualFiles: { name: string; url: string }[] = uploadedDocuments.map((document) => ({
              name: document.filename || document.doc_type || 'Verification document',
              url: document.file_url!,
            }))
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
              extractedName: '',
              extractedSchoolId: '',
            }
          })

        accommodationManagerRequests.value = pendingUsers
          .filter((u: any) => !studentDocumentUsers.has(u.id) && ['accommodation_manager', 'landlord'].includes(String(u.role).toLowerCase().trim()))
          .map((l: any) => {
            const uploadedDocuments = documentsByUser.get(l.id) ?? []
            const actualFiles: { name: string; url: string }[] = uploadedDocuments.map((document) => ({
              name: document.filename || document.doc_type || 'Verification document',
              url: document.file_url!,
            }))
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
              extractedName: '',
              extractedGovId: '',
            }
          })
      }
      }

      const { data: accommodations, error: accommodationError } = await supabase
        .from('accommodations')
        .select(`id, name, status, accommodation_manager_id, manager:accommodation_manager_id ( full_name )`)
        .in('status', ['pending', 'reviewing'])

      if (accommodationError) {
        console.warn('Could not fetch accommodations:', accommodationError.message)
      } else if (accommodations) {
        const accommodationIds = (accommodations as any[]).map((accommodation) => accommodation.id)
        const { data: documents, error: documentError } = accommodationIds.length
          ? await supabase
            .from('accommodation_documents')
            .select('accommodation_id, doc_type, file_url')
            .in('accommodation_id', accommodationIds)
          : { data: [], error: null }
        if (documentError) console.warn('Could not fetch accommodation permits:', documentError.message)
        const documentsByAccommodation = new Map<string, any[]>()
        for (const document of documents ?? []) {
          if (!document.accommodation_id) continue
          documentsByAccommodation.set(document.accommodation_id, [
            ...(documentsByAccommodation.get(document.accommodation_id) ?? []),
            document,
          ])
        }
        accommodationRequests.value = (accommodations as any[]).map((p: any) => {
          const ownerName = Array.isArray(p.manager) ? p.manager[0]?.full_name : (p.manager as any)?.full_name || 'Unknown Accommodation Manager'
          const files = (documentsByAccommodation.get(p.id) ?? []).map((document) => ({
            name: ACCOMMODATION_PERMITS.find((permit) => permit.type === document.doc_type)?.label ?? document.doc_type,
            type: document.doc_type,
            url: document.file_url,
          }))
          return {
            id: `REQ-AC${p.id.substring(0, 4).toUpperCase()}`,
            rawId: p.id,
            name: p.name || 'Unnamed Accommodation',
            email: '',
            owner: ownerName,
            ownerId: p.accommodation_manager_id,
            initials: getInitials(p.name),
            type: 'OSAS Accreditation',
            files,
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

      // When a STUDENT is approved/verified, stamp student_profiles.osas_verified_at.
      // The mobile app gates the student QR on that field (not users.status), so a
      // user could read 'verified' yet never get a QR. Rejecting does not un-stamp —
      // the field is cleared only if the row is later invalidated by OSAS.
      if (!isAccommodation && decision === 'approve') {
        try {
          const { error: stampErr } = await supabase.from('student_profiles').update({ osas_verified_at: new Date().toISOString() }).eq('user_id', rawId)
          // Some approved profiles may not exist yet (e.g. Google-OAuth signups with no
          // ISU enrollment row). Upsert so the stamp is never silently dropped.
          if (stampErr && String(stampErr.code || '').match(/PGRST(116|117)/)) {
            await supabase.from('student_profiles').upsert({ user_id: rawId, osas_verified_at: new Date().toISOString() })
          }
        } catch { /* non-critical; primary status update already succeeded */ }
      }

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
            override: decisionPayload?.override === true,
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
