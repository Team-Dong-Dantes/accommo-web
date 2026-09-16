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
            <q-input
              v-model="form.version"
              class="q-mt-md"
              outlined
              label="Version"
              placeholder="e.g. v1.0"
              hint="Optional. Add a version when this updates an existing policy."
              persistent-hint
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
              hint="Optional. A future date keeps the policy in draft status until it takes effect."
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
            <div v-if="kind === 'policies'" class="review-row">
              <dt>Version</dt>
              <dd>{{ form.version.trim() || 'No version' }}</dd>
            </div>
            <div v-if="kind === 'policies'" class="review-row">
              <dt>Effective date</dt>
              <dd>{{ form.effectiveDate ? fmtDate(dateToIso(form.effectiveDate)) : 'Not specified' }}</dd>
            </div>
          </dl>

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
import { dateInput, dateToIso, fmtDate } from './shared'

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
  audience: 'all' | 'students' | 'accommodation_managers'
  expiresAt: string | null
  version: string
  effectiveDate: string | null
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
const errors = ref({ title: '', body: '' })

const form = ref<ComposerForm>(emptyForm())

const audienceOptions = [
  { label: 'All users', value: 'all' },
  { label: 'Students', value: 'students' },
  { label: 'Accommodation Managers', value: 'accommodation_managers' },
]

const steps = computed<FormStep[]>(() => props.kind === 'announcements'
  ? [
      { label: 'Message', heading: 'Write the announcement', description: 'Start with the message people need to receive.', guidance: 'Keep it specific and easy to act on.' },
      { label: 'Audience', heading: 'Set the audience', description: 'Decide who will receive it and how long it remains relevant.', guidance: 'Choose the narrowest group that needs this update.' },
      { label: 'Review', heading: 'Review the announcement', description: 'Confirm the details before saving your draft.', guidance: 'You can return to any previous step before saving.' },
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
  if (mode.value === 'edit') return 'Save changes'
  return props.kind === 'announcements' ? 'Save draft' : 'Create policy'
})
const saveNote = computed(() => {
  if (props.kind === 'announcements') {
    return mode.value === 'create'
      ? 'This announcement will be saved as a draft. You can publish it from the announcements list.'
      : 'Saving updates this announcement without changing its current publish status.'
  }

  return mode.value === 'create'
    ? 'The policy status will reflect its effective date after it is created.'
    : 'Saving updates this policy without changing its effective date.'
})

function emptyForm(): ComposerForm {
  return {
    title: '',
    body: '',
    audience: 'all',
    expiresAt: null,
    version: '',
    effectiveDate: dateInput(new Date().toISOString()),
  }
}

function resetProgress() {
  step.value = 1
  stepError.value = ''
  errors.value = { title: '', body: '' }
}

function clearFieldError(field: 'title' | 'body') {
  errors.value[field] = ''
  stepError.value = ''
}

function audienceLabel(audience: ComposerForm['audience']) {
  return audienceOptions.find((option) => option.value === audience)?.label ?? audience
}

function validateCurrentStep(): boolean {
  errors.value = { title: '', body: '' }
  stepError.value = ''

  if (step.value === 1 && !form.value.title.trim()) {
    errors.value.title = 'Enter a title before continuing.'
  }
  if ((props.kind === 'announcements' && step.value === 1 || props.kind === 'policies' && step.value === 2) && !form.value.body.trim()) {
    errors.value.body = props.kind === 'announcements'
      ? 'Enter the message before continuing.'
      : 'Add the policy content before continuing.'
  }

  if (errors.value.title || errors.value.body) {
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
    if (props.kind === 'announcements') {
      form.value = {
        title: row.title,
        body: row.body,
        audience: row.audience ?? 'all',
        expiresAt: dateInput(row.expires_at),
        version: '',
        effectiveDate: null,
      }
    } else {
      form.value = {
        title: row.title,
        body: row.body,
        audience: 'all',
        expiresAt: null,
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
      const payload: Record<string, any> = {
        title: form.value.title.trim(),
        body: form.value.body.trim(),
        audience: form.value.audience,
        expires_at: dateToIso(form.value.expiresAt),
      }
      let error: any = null
      if (mode.value === 'create') {
        if (!userId) throw new Error('Not signed in')
        ;({ error } = await supabase.from('announcements').insert({ ...payload, author_id: userId } as any))
      } else {
        ;({ error } = await supabase.from('announcements').update(payload as any).eq('id', editingId.value!))
      }
      if (error) throw error
      notify.success(mode.value === 'create' ? 'Announcement created as draft.' : 'Announcement updated.')
    } else {
      const payload: Record<string, any> = {
        title: form.value.title.trim(),
        body: form.value.body.trim(),
        version: form.value.version.trim() || null,
        effective_date: dateToIso(form.value.effectiveDate),
      }
      let error: any = null
      if (mode.value === 'create') {
        if (!userId) throw new Error('Not signed in')
        ;({ error } = await supabase.from('policies').insert({ ...payload, created_by: userId } as any))
      } else {
        ;({ error } = await supabase.from('policies').update(payload as any).eq('id', editingId.value!))
      }
      if (error) throw error
      notify.success(mode.value === 'create' ? 'Policy created.' : 'Policy updated.')
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
