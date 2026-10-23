// The composer's state for an announcement or a policy: which step it is on,
// the form, its validation, and the save. One instance per ComposerDialog.
import { computed, ref, watch } from 'vue'
import { errorMessage } from '@/utils/errors'
import { useNotify } from '@/utils/notify'
import { saveAnnouncement, savePolicy, sessionUserId } from '@/api/announcements'
import { announcementStatus, dateToIso, policyStatus } from './shared'
import { emptyForm, formFromRow, formPayload, policyPayload, stepsFor, type AnnouncementKind, type ComposerForm, type FormStep } from './composer'

export function useComposer(
  /** The dialog's props: what it edits, the row to edit, and the token bumped to create. */
  source: { kind: AnnouncementKind; editRow: any | null; createToken: number },
  onSaved: () => void,
) {
  const notify = useNotify()

  const dialogOpen = ref(false)
  const mode = ref<'create' | 'edit'>('create')
  const editingId = ref<string | null>(null)
  const saving = ref(false)
  const step = ref(1)
  const stepError = ref('')
  const errors = ref({ title: '', body: '', version: '', publishAt: '' })

  const form = ref<ComposerForm>(emptyForm())
  /** The row as it was when editing began (null when creating). */
  const original = ref<any | null>(null)

  const isAnn = computed(() => source.kind === 'announcements')

  /**
   * Editing something readers can already see. A live announcement keeps its
   * publish state (unpublish from the list); an in-effect policy offers a new version.
   */
  const editingLive = computed(() => {
    const row = original.value
    if (!row) return false
    return isAnn.value ? announcementStatus(row) === 'live' : policyStatus(row) === 'in_effect'
  })

  const steps = computed(() => stepsFor(source.kind))
  const entityLabel = computed(() => (isAnn.value ? 'announcement' : 'policy'))
  const dialogTitle = computed(() => `${mode.value === 'create' ? 'Create' : 'Edit'} ${entityLabel.value}`)
  const currentStep = computed<FormStep>(() => steps.value[step.value - 1] ?? steps.value[0]!)
  const noteIcon = computed(() => (isAnn.value ? 'lucide:file-pen' : 'lucide:calendar-check'))
  const saveLabel = computed(() => {
    if (!isAnn.value) {
      if (form.value.newVersion) return 'Publish new version'
      return mode.value === 'edit' ? 'Save changes' : 'Create policy'
    }
    if (editingLive.value) return 'Save changes'
    if (form.value.publishMode === 'now') return 'Publish now'
    if (form.value.publishMode === 'schedule') return 'Schedule'
    return mode.value === 'edit' ? 'Save changes' : 'Save draft'
  })
  const saveNote = computed(() => {
    if (!isAnn.value) {
      if (form.value.newVersion) return 'Everyone is notified and must accept the new version. The current text moves to version history.'
      if (editingLive.value) return 'A correction: nobody is notified and existing acceptances stay valid.'
      return 'Students and landlords/landladies are notified and asked to accept it on its effective date.'
    }
    if (editingLive.value) return 'This announcement is live. Changes show immediately; readers are not notified again.'
    if (form.value.publishMode === 'now') return 'Everyone in the audience is notified as soon as you publish.'
    if (form.value.publishMode === 'schedule') return 'It stays hidden until the scheduled time, then the audience is notified.'
    return 'Saved as a draft. Nobody sees it until you publish it.'
  })

  function resetProgress() {
    step.value = 1
    stepError.value = ''
    errors.value = { title: '', body: '', version: '', publishAt: '' }
  }

  function clearFieldError(field: 'title' | 'body') {
    errors.value[field] = ''
    stepError.value = ''
  }

  function validateCurrentStep(): boolean {
    errors.value = { title: '', body: '', version: '', publishAt: '' }
    stepError.value = ''

    if (step.value === 1 && !form.value.title.trim()) {
      errors.value.title = 'Enter a title before continuing.'
    }
    if (step.value === 1 && form.value.newVersion) {
      const label = form.value.version.trim()
      if (!label || label === (original.value?.version ?? '').trim()) {
        errors.value.version = 'Give the new version a label different from the current one.'
      }
    }
    // The message is on step 1 of an announcement, the content on step 2 of a policy.
    if (step.value === (isAnn.value ? 1 : 2) && !form.value.body.trim()) {
      errors.value.body = isAnn.value ? 'Enter the message before continuing.' : 'Add the policy content before continuing.'
    }

    if (errors.value.title || errors.value.body || errors.value.version) {
      stepError.value = 'Complete the required fields before continuing.'
      return false
    }
    return true
  }

  function previousStep() {
    if (step.value > 1) {
      step.value--
      stepError.value = ''
    }
  }

  function nextStep() {
    if (validateCurrentStep()) step.value++
  }

  function close() {
    dialogOpen.value = false
    resetProgress()
  }

  // Create mode: parent bumps createToken to open.
  watch(
    () => source.createToken,
    () => {
      if (source.createToken === 0) return
      mode.value = 'create'
      editingId.value = null
      original.value = null
      form.value = emptyForm()
      resetProgress()
      dialogOpen.value = true
    },
  )

  // Edit mode: parent passes the row.
  watch(
    () => source.editRow,
    (row) => {
      if (!row) return
      mode.value = 'edit'
      editingId.value = row.id
      original.value = row
      form.value = formFromRow(row, source.kind)
      resetProgress()
      dialogOpen.value = true
    },
  )

  async function save() {
    if (!form.value.title.trim() || !form.value.body.trim()) {
      step.value = !form.value.title.trim() || isAnn.value ? 1 : 2
      validateCurrentStep()
      return
    }

    saving.value = true
    const userId = await sessionUserId()

    try {
      if (!isAnn.value) {
        const payload = policyPayload(form.value, original.value?.revision)
        if (mode.value === 'create') {
          if (!userId) throw new Error('Not logged in')
          await savePolicy(null, { ...payload, created_by: userId })
        } else {
          await savePolicy(editingId.value!, payload)
        }
        notify.success(form.value.newVersion ? 'New version published.' : mode.value === 'create' ? 'Policy created.' : 'Policy updated.')
        dialogOpen.value = false
        onSaved()
        return
      }

      const payload = formPayload(form.value)
      // A live announcement keeps its publish state; otherwise the choice decides it.
      if (!editingLive.value) {
        if (form.value.publishMode === 'schedule') {
          const at = dateToIso(form.value.publishAt)
          if (!at || new Date(at).getTime() <= Date.now()) {
            errors.value.publishAt = 'Pick a time in the future.'
            return
          }
          payload.published_at = at
        } else {
          payload.published_at = form.value.publishMode === 'now' ? new Date().toISOString() : null
        }
        if (payload.published_at && userId) payload.author_id = userId
      }
      if (mode.value === 'create') {
        if (!userId) throw new Error('Not logged in')
        await saveAnnouncement(null, { ...payload, author_id: userId })
      } else {
        await saveAnnouncement(editingId.value!, payload)
      }
      notify.success(
        editingLive.value ? 'Announcement updated.'
          : form.value.publishMode === 'now' ? 'Announcement published.'
          : form.value.publishMode === 'schedule' ? 'Announcement scheduled.'
          : 'Draft saved.',
      )

      dialogOpen.value = false
      onSaved()
    } catch (e) {
      const msg = errorMessage(e, 'Failed to save')
      console.error('Save failed:', e)
      notify.error(msg)
    } finally {
      saving.value = false
    }
  }

  return {
    steps,
    dialogOpen,
    dialogTitle,
    currentStep,
    saving,
    close,
    step,
    stepError,
    form,
    errors,
    clearFieldError,
    entityLabel,
    editingLive,
    noteIcon,
    saveNote,
    saveLabel,
    previousStep,
    nextStep,
    save,
  }
}
