<template>
  <q-dialog v-model="dialogOpen" persistent>
    <q-card class="dialog-card composer-card">
      <q-card-section class="composer-heading q-px-lg q-pt-lg q-pb-md">
        <div class="row items-start no-wrap q-col-gutter-md">
          <div class="col">
            <h2 class="composer-title q-my-none">{{ dialogTitle }}</h2>
            <p class="composer-intro q-mb-none">{{ currentStep.description }}</p>
          </div>
          <q-btn
            flat
            round
            dense
            color="grey-7"
            aria-label="Close composer"
            :disable="saving"
            @click="close"
          >
            <Icon icon="lucide:x" width="20" height="20" aria-hidden="true" />
          </q-btn>
        </div>

        <ol
          class="step-list q-mb-none q-mt-lg"
          :style="{ '--step-progress': `${((step - 1) / (steps.length - 1)) * 100}%` }"
          aria-label="Form steps"
        >
          <li
            v-for="(item, index) in steps"
            :key="item.label"
            class="step-item"
            :class="{ 'is-current': step === index + 1, 'is-complete': step > index + 1 }"
            :aria-current="step === index + 1 ? 'step' : undefined"
          >
            <span class="step-marker" aria-hidden="true">
              <Icon v-if="step > index + 1" icon="lucide:check" width="15" height="15" />
              <span v-else>{{ index + 1 }}</span>
            </span>
            <span class="step-copy">
              <span class="step-label">{{ item.label }}</span>
            </span>
          </li>
        </ol>
      </q-card-section>

      <q-separator />

      <q-card-section class="composer-body q-px-lg q-py-lg">
        <div v-if="stepError" class="step-error" role="alert">
          <Icon icon="lucide:circle-alert" width="18" height="18" aria-hidden="true" />
          <span>{{ stepError }}</span>
        </div>

        <section v-if="step === 1" class="composer-panel" aria-labelledby="composer-step-title">
          <h3 id="composer-step-title" class="panel-title">{{ currentStep.heading }}</h3>
          <p class="panel-copy">{{ currentStep.guidance }}</p>

          <q-input
            v-model="form.title"
            outlined
            label="Title"
            placeholder="e.g. Scheduled water interruption"
            :error="Boolean(errors.title)"
            :error-message="errors.title"
            hint="Use a short title people can recognize at a glance."
            persistent-hint
            autofocus
            aria-required="true"
            @update:model-value="clearFieldError('title')"
          />

          <template v-if="kind === 'announcements'">
            <q-input
              v-model="form.summary"
              class="q-mt-md"
              outlined
              label="Summary"
              maxlength="200"
              counter
              placeholder="One line people see in their notification and at the top of the notice."
              hint="Optional. Without it, the notification shows the start of the message."
              persistent-hint
            />
            <q-input
              v-model="form.body"
              class="q-mt-md"
              outlined
              type="textarea"
              autogrow
              label="Message"
              placeholder="Explain what is happening, who is affected, and what they need to do."
              :error="Boolean(errors.body)"
              :error-message="errors.body"
              hint="Include the essential action or timing in the first sentence."
              persistent-hint
              aria-required="true"
              @update:model-value="clearFieldError('body')"
            />
          </template>

          <template v-else>
            <div v-if="editingLive" class="new-version q-mt-md">
              <q-toggle v-model="form.newVersion" color="primary" label="Publish as a new version" />
              <div class="panel-copy">
                {{ form.newVersion
                  ? 'Everyone is notified and must accept this policy again. The current text is kept in its version history.'
                  : 'Off: a correction such as a typo fix. Nobody is notified and existing acceptances stay valid.' }}
              </div>
            </div>
            <q-input
              v-model="form.version"
              class="q-mt-md"
              outlined
              label="Version"
              placeholder="e.g. v1.0"
              :error="Boolean(errors.version)"
              :error-message="errors.version"
              :hint="form.newVersion ? 'Required. Give the new version its own label.' : 'Optional. A label such as v1.0.'"
              persistent-hint
              @update:model-value="errors.version = ''"
            />
          </template>
        </section>

        <section v-else-if="step === 2" class="composer-panel" aria-labelledby="composer-step-title">
          <h3 id="composer-step-title" class="panel-title">{{ currentStep.heading }}</h3>
          <p class="panel-copy">{{ currentStep.guidance }}</p>

          <template v-if="kind === 'announcements'">
            <q-select
              v-model="form.audience"
              outlined
              label="Audience"
              :options="audienceOptions"
              emit-value
              map-options
              hint="Only the selected group will see this announcement."
              persistent-hint
            />

            <q-input
              v-model="form.expiresAt"
              class="q-mt-md"
              outlined
              type="date"
              label="Expiry date"
              clearable
              hint="Optional. Leave blank to keep the announcement visible until it is archived."
              persistent-hint
            />

            <q-separator class="q-my-lg" />
            <AnnouncementDetailsFields v-model="form.details" />
          </template>

          <template v-else>
            <q-input
              v-model="form.body"
              outlined
              type="textarea"
              autogrow
              label="Policy content"
              placeholder="State the policy, who it applies to, and any required actions or exceptions."
              :error="Boolean(errors.body)"
              :error-message="errors.body"
              hint="Write the policy in clear, complete language."
              persistent-hint
              aria-required="true"
              @update:model-value="clearFieldError('body')"
            />

            <q-input
              v-model="form.effectiveDate"
              class="q-mt-md"
              outlined
              type="date"
              label="Effective date"
              hint="A future date schedules the policy; nobody sees it until that day."
              persistent-hint
            />
          </template>
        </section>

        <section v-else class="composer-panel" aria-labelledby="composer-step-title">
          <h3 id="composer-step-title" class="panel-title">Review {{ entityLabel }}</h3>
          <p class="panel-copy">Check the details below. You can return to an earlier step to make changes.</p>

          <dl class="review-list">
            <div class="review-row review-row-title">
              <dt>Title</dt>
              <dd>{{ form.title || 'Untitled' }}</dd>
            </div>
            <div class="review-row review-row-message">
              <dt>{{ kind === 'announcements' ? 'Message' : 'Policy content' }}</dt>
              <dd>{{ form.body || 'No content added' }}</dd>
            </div>
            <div v-if="kind === 'announcements'" class="review-row">
              <dt>Audience</dt>
              <dd>{{ audienceLabel(form.audience) }}</dd>
            </div>
            <div v-if="kind === 'announcements'" class="review-row">
              <dt>Expiry</dt>
              <dd>{{ form.expiresAt ? fmtDate(dateToIso(form.expiresAt)) : 'No expiry date' }}</dd>
            </div>
            <div v-if="kind === 'announcements' && form.summary.trim()" class="review-row">
              <dt>Summary</dt>
              <dd>{{ form.summary }}</dd>
            </div>
            <div v-if="kind === 'announcements' && form.details.eventAt" class="review-row">
              <dt>Event</dt>
              <dd>{{ formatDateTime(dateToIso(form.details.eventAt)!) }}{{ form.details.eventEnd ? ' – ' + formatDateTime(dateToIso(form.details.eventEnd)!) : '' }}</dd>
            </div>
            <div v-if="kind === 'announcements' && form.details.deadlineAt" class="review-row">
              <dt>Deadline</dt>
              <dd>{{ formatDateTime(dateToIso(form.details.deadlineAt)!) }}</dd>
            </div>
            <div v-if="kind === 'announcements' && form.details.location.trim()" class="review-row">
              <dt>Location</dt>
              <dd>{{ form.details.location }}</dd>
            </div>
            <div v-if="kind === 'announcements' && form.details.imageUrl" class="review-row">
              <dt>Poster</dt>
              <dd><img :src="form.details.imageUrl" alt="" class="review-poster" /></dd>
            </div>
            <div v-if="kind === 'policies'" class="review-row">
              <dt>Version</dt>
              <dd>{{ form.version.trim() || 'No version' }}</dd>
            </div>
            <div v-if="kind === 'policies'" class="review-row">
              <dt>Effective date</dt>
              <dd>{{ form.effectiveDate ? fmtDate(dateToIso(form.effectiveDate)) : 'Not specified' }}</dd>
            </div>
          </dl>

          <div v-if="kind === 'announcements' && !editingLive" class="publish-choice q-mt-md">
            <div class="panel-title">When should it go out?</div>
            <q-option-group v-model="form.publishMode" :options="publishOptions" color="primary" inline />
            <q-input
              v-if="form.publishMode === 'schedule'"
              v-model="form.publishAt"
              class="q-mt-sm"
              outlined
              type="datetime-local"
              label="Publish at"
              stack-label
              :error="Boolean(errors.publishAt)"
              :error-message="errors.publishAt"
              @update:model-value="errors.publishAt = ''"
            />
          </div>

          <div class="save-note">
            <Icon :icon="noteIcon" width="19" height="19" aria-hidden="true" />
            <span>{{ saveNote }}</span>
          </div>
        </section>
      </q-card-section>

      <q-separator />

      <q-card-actions class="composer-actions q-px-lg q-py-md">
        <q-space />
        <q-btn
          v-if="step > 1"
          flat
          no-caps
          color="primary"
          label="Back"
          class="rounded-button"
          :disable="saving"
          @click="previousStep"
        />
        <q-btn
          v-if="step < steps.length"
          unelevated
          no-caps
          color="primary"
          label="Continue"
          class="rounded-button"
          @click="nextStep"
        />
        <q-btn
          v-else
          unelevated
          no-caps
          color="primary"
          :label="saveLabel"
          :loading="saving"
          class="rounded-button"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { formatDateTime } from '@/utils/format'
import AnnouncementDetailsFields, { type AnnouncementDetails } from './AnnouncementDetailsFields.vue'
import { announcementStatus, dateInput, dateTimeInput, dateToIso, fmtDate, policyStatus } from './shared'

export type AnnouncementKind = 'announcements' | 'policies'

const props = defineProps<{
  /** Which entity the dialog creates/edits. */
  kind: AnnouncementKind
  /**
   * Row being edited (null = create). Re-passing a row opens the dialog in
   * edit mode; pass `open-create` (a token that changes) to open for a new
   * item — see the page's openCreate().
   */
  editRow: any | null
  /** Bumped by the parent to open the dialog in create mode. */
  createToken: number
}>()

const emit = defineEmits<{
  (e: 'saved'): void
}>()

type ComposerForm = {
  title: string
  body: string
  audience: 'all' | 'students' | 'landlords'
  expiresAt: string | null
  version: string
  effectiveDate: string | null
  summary: string
  details: AnnouncementDetails
  publishMode: 'draft' | 'now' | 'schedule'
  publishAt: string | null
  /** Policies: bump the revision so everyone must accept again. */
  newVersion: boolean
}

type FormStep = {
  label: string
  heading: string
  description: string
  guidance: string
}

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

/**
 * Editing something readers can already see. A live announcement keeps its
 * publish state (unpublish from the list); an in-effect policy offers a new version.
 */
const editingLive = computed(() => {
  const row = original.value
  if (!row) return false
  return props.kind === 'announcements' ? announcementStatus(row) === 'live' : policyStatus(row) === 'in_effect'
})

const publishOptions = [
  { label: 'Save as draft', value: 'draft' },
  { label: 'Publish now', value: 'now' },
  { label: 'Schedule', value: 'schedule' },
]

const audienceOptions = [
  { label: 'All users', value: 'all' },
  { label: 'Students', value: 'students' },
  { label: 'Landlords/Landladies', value: 'landlords' },
]

const steps = computed<FormStep[]>(() => props.kind === 'announcements'
  ? [
      { label: 'Message', heading: 'Write the announcement', description: 'Start with the message people need to receive.', guidance: 'Keep it specific and easy to act on.' },
      { label: 'Audience & details', heading: 'Audience and details', description: 'Decide who receives it, and add any date, deadline, place or poster.', guidance: 'Choose the narrowest group that needs this update.' },
      { label: 'Publish', heading: 'Review and publish', description: 'Confirm the details and choose when it goes out.', guidance: 'You can return to any previous step before saving.' },
    ]
  : [
      { label: 'Details', heading: 'Name the policy', description: 'Give this policy a clear name and optional version.', guidance: 'Use a name staff and residents will recognize later.' },
      { label: 'Content', heading: 'Add policy content', description: 'Write the policy and set when it becomes effective.', guidance: 'State the requirements in clear, complete language.' },
      { label: 'Review', heading: 'Review the policy', description: 'Confirm the details before creating the policy.', guidance: 'You can return to any previous step before saving.' },
    ],
)

const entityLabel = computed(() => props.kind === 'announcements' ? 'announcement' : 'policy')
const dialogTitle = computed(() => `${mode.value === 'create' ? 'Create' : 'Edit'} ${entityLabel.value}`)
const currentStep = computed<FormStep>(() => steps.value[step.value - 1] ?? steps.value[0]!)
const noteIcon = computed(() => props.kind === 'announcements' ? 'lucide:file-pen' : 'lucide:calendar-check')
const saveLabel = computed(() => {
  if (props.kind === 'announcements' && !editingLive.value) {
    if (form.value.publishMode === 'now') return 'Publish now'
    if (form.value.publishMode === 'schedule') return 'Schedule'
    return mode.value === 'edit' ? 'Save changes' : 'Save draft'
  }
  if (form.value.newVersion) return 'Publish new version'
  return mode.value === 'edit' ? 'Save changes' : 'Create policy'
})
const saveNote = computed(() => {
  if (props.kind === 'announcements') {
    if (editingLive.value) return 'This announcement is live. Changes show immediately; readers are not notified again.'
    if (form.value.publishMode === 'now') return 'Everyone in the audience is notified as soon as you publish.'
    if (form.value.publishMode === 'schedule') return 'It stays hidden until the scheduled time, then the audience is notified.'
    return 'Saved as a draft. Nobody sees it until you publish it.'
  }
  if (form.value.newVersion) return 'Everyone is notified and must accept the new version. The current text moves to version history.'
  if (editingLive.value) return 'A correction: nobody is notified and existing acceptances stay valid.'
  return 'Students and landlords/landladies are notified and asked to accept it on its effective date.'
})

function emptyForm(): ComposerForm {
  return {
    title: '',
    body: '',
    audience: 'all',
    expiresAt: null,
    version: '',
    effectiveDate: dateInput(new Date().toISOString()),
    summary: '',
    details: { eventAt: null, eventEnd: null, deadlineAt: null, location: '', imageUrl: '' },
    publishMode: 'draft',
    publishAt: null,
    newVersion: false,
  }
}

function resetProgress() {
  step.value = 1
  stepError.value = ''
  errors.value = { title: '', body: '', version: '', publishAt: '' }
}

function clearFieldError(field: 'title' | 'body') {
  errors.value[field] = ''
  stepError.value = ''
}

function audienceLabel(audience: ComposerForm['audience']) {
  return audienceOptions.find((option) => option.value === audience)?.label ?? audience
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
  if ((props.kind === 'announcements' && step.value === 1 || props.kind === 'policies' && step.value === 2) && !form.value.body.trim()) {
    errors.value.body = props.kind === 'announcements'
      ? 'Enter the message before continuing.'
      : 'Add the policy content before continuing.'
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
  () => props.createToken,
  () => {
    if (props.createToken === 0) return
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
  () => props.editRow,
  (row) => {
    if (!row) return
    mode.value = 'edit'
    editingId.value = row.id
    original.value = row
    const base = emptyForm()
    if (props.kind === 'announcements') {
      const status = announcementStatus(row)
      form.value = {
        ...base,
        title: row.title,
        body: row.body,
        audience: row.audience ?? 'all',
        expiresAt: dateInput(row.expires_at),
        summary: row.summary ?? '',
        details: {
          eventAt: dateTimeInput(row.event_at),
          eventEnd: dateTimeInput(row.event_end),
          deadlineAt: dateTimeInput(row.deadline_at),
          location: row.location ?? '',
          imageUrl: row.image_url ?? '',
        },
        publishMode: status === 'scheduled' ? 'schedule' : 'draft',
        publishAt: status === 'scheduled' ? dateTimeInput(row.published_at) : null,
      }
    } else {
      form.value = {
        ...base,
        title: row.title,
        body: row.body,
        version: row.version ?? '',
        effectiveDate: dateInput(row.effective_date),
      }
    }
    resetProgress()
    dialogOpen.value = true
  },
)

async function currentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

async function save() {
  if (!form.value.title.trim() || !form.value.body.trim()) {
    step.value = !form.value.title.trim() ? 1 : props.kind === 'announcements' ? 1 : 2
    validateCurrentStep()
    return
  }

  saving.value = true
  const userId = await currentUserId()

  try {
    if (props.kind === 'announcements') {
      const d = form.value.details
      const payload: Record<string, any> = {
        title: form.value.title.trim(),
        body: form.value.body.trim(),
        audience: form.value.audience,
        expires_at: dateToIso(form.value.expiresAt),
        summary: form.value.summary.trim() || null,
        event_at: dateToIso(d.eventAt),
        event_end: d.eventAt ? dateToIso(d.eventEnd) : null,
        deadline_at: dateToIso(d.deadlineAt),
        location: d.location.trim() || null,
        image_url: d.imageUrl || null,
      }
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
      let error: any = null
      if (mode.value === 'create') {
        if (!userId) throw new Error('Not signed in')
        ;({ error } = await supabase.from('announcements').insert({ ...payload, author_id: userId } as any))
      } else {
        ;({ error } = await supabase.from('announcements').update(payload as any).eq('id', editingId.value!))
      }
      if (error) throw error
      notify.success(
        editingLive.value ? 'Announcement updated.'
          : form.value.publishMode === 'now' ? 'Announcement published.'
          : form.value.publishMode === 'schedule' ? 'Announcement scheduled.'
          : 'Draft saved.',
      )
    } else {
      const payload: Record<string, any> = {
        title: form.value.title.trim(),
        body: form.value.body.trim(),
        version: form.value.version.trim() || null,
        // effective_date is a plain date column: send the day, not a UTC instant
        // that would land on the previous day in Manila.
        effective_date: form.value.effectiveDate,
      }
      if (form.value.newVersion) payload.revision = (original.value?.revision ?? 1) + 1
      let error: any = null
      if (mode.value === 'create') {
        if (!userId) throw new Error('Not signed in')
        ;({ error } = await supabase.from('policies').insert({ ...payload, created_by: userId } as any))
      } else {
        ;({ error } = await supabase.from('policies').update(payload as any).eq('id', editingId.value!))
      }
      if (error) throw error
      notify.success(form.value.newVersion ? 'New version published.' : mode.value === 'create' ? 'Policy created.' : 'Policy updated.')
    }

    dialogOpen.value = false
    emit('saved')
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save'
    console.error('Save failed:', e)
    notify.error(msg)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.dialog-card {
  border-radius: var(--radius-lg);
}

.composer-card {
  width: min(720px, calc(100vw - 24px));
  max-width: 720px;
  overflow: hidden;
}

.composer-heading {
  background: linear-gradient(135deg, var(--c-primary-soft), var(--c-surface) 68%);
}

.composer-title {
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: var(--fs-h1);
  font-weight: 650;
  line-height: 1.2;
  margin-top: var(--sp-1) !important;
}

.composer-intro,
.panel-copy {
  color: var(--c-muted);
  font-size: var(--fs-sm);
  line-height: 1.45;
}

.composer-intro {
  margin-top: var(--sp-2);
  max-width: 38rem;
}

.step-list {
  display: grid;
  gap: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  list-style: none;
  padding: 0;
  position: relative;
}

.step-list::before {
  background: linear-gradient(
    to right,
    var(--c-primary) 0 var(--step-progress),
    var(--c-border-strong) var(--step-progress) 100%
  );
  content: '';
  height: 2px;
  left: calc(100% / 6);
  position: absolute;
  right: calc(100% / 6);
  top: 15px;
  z-index: 0;
}

.step-item {
  align-items: center;
  color: var(--c-muted);
  display: flex;
  flex-direction: column;
  font-size: var(--fs-sm);
  font-weight: 600;
  gap: var(--sp-2);
  min-width: 0;
  position: relative;
  z-index: 1;
}

.step-marker {
  align-items: center;
  background: var(--c-surface);
  border: 2px solid var(--c-border-strong);
  border-radius: 50%;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: var(--fs-xs);
  font-weight: 750;
  height: 30px;
  justify-content: center;
  transition: background var(--t), border-color var(--t), box-shadow var(--t), color var(--t);
  width: 30px;
}

.step-copy {
  min-width: 0;
  text-align: center;
}

.step-label {
  color: var(--c-text);
  font-size: var(--fs-xs);
  font-weight: 650;
  line-height: 1.25;
}

.step-item.is-current {
  color: var(--c-primary-ink);
}

.step-item.is-current .step-marker,
.step-item.is-complete .step-marker {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: white;
}

.step-item.is-complete {
  color: var(--c-text);
}

.step-item.is-current .step-label {
  color: var(--c-primary-ink);
  font-weight: 750;
}

.composer-body {
  min-height: 330px;
}

.composer-panel {
  animation: panel-enter var(--t) both;
}

.panel-title {
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-weight: 650;
  line-height: 1.25;
  margin: 0;
}

.panel-copy {
  margin: var(--sp-1) 0 var(--sp-5);
}

.step-error {
  align-items: center;
  background: var(--c-danger-soft);
  border: 1px solid color-mix(in srgb, var(--c-danger) 25%, transparent);
  border-radius: var(--radius-sm);
  color: var(--c-danger);
  display: flex;
  font-size: var(--fs-sm);
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
  padding: 10px 12px;
}

.review-list {
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  margin: 0;
  overflow: hidden;
}

.review-row {
  align-items: start;
  background: var(--c-surface);
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: minmax(105px, 0.3fr) minmax(0, 1fr);
  padding: 13px var(--sp-4);
}

.review-row + .review-row {
  border-top: 1px solid var(--c-border);
}

.review-row dt {
  color: var(--c-muted);
  font-size: var(--fs-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.review-row dd {
  color: var(--c-text);
  font-size: var(--fs-sm);
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}

.review-row-title dd {
  color: var(--c-ink);
  font-size: var(--fs-body);
  font-weight: 700;
}

.review-row-message dd {
  max-height: 9.2em;
  overflow: auto;
}

.save-note {
  align-items: flex-start;
  background: var(--c-primary-soft);
  border-radius: var(--radius-sm);
  color: var(--c-primary-ink);
  display: flex;
  font-size: var(--fs-sm);
  gap: var(--sp-2);
  line-height: 1.45;
  margin-top: var(--sp-4);
  padding: 12px var(--sp-3);
}

.composer-actions {
  gap: var(--sp-2);
}

@keyframes panel-enter {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.new-version {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm, 10px);
  padding: var(--sp-2, 8px) var(--sp-3, 12px);
}

.publish-choice {
  border-top: 1px solid var(--c-border);
  padding-top: var(--sp-3, 12px);
}

.review-poster {
  max-width: 200px;
  max-height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

@media (max-width: 599px) {
  .composer-heading,
  .composer-body,
  .composer-actions {
    padding-left: var(--sp-4) !important;
    padding-right: var(--sp-4) !important;
  }

  .step-list {
    gap: 0;
  }

  .step-label {
    font-size: 0.6875rem;
  }

  .step-list::before {
    left: calc(100% / 6);
    right: calc(100% / 6);
    top: 15px;
  }

  .review-row {
    gap: var(--sp-2);
    grid-template-columns: 1fr;
  }

  .composer-actions .q-btn {
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .composer-panel {
    animation: none;
  }
}
</style>
