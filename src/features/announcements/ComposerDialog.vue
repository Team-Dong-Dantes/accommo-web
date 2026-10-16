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

        <ComposerSteps class="q-mb-none q-mt-lg" :steps="steps" :step="step" />
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
        </section>

        <section v-else-if="step === 2" class="composer-panel" aria-labelledby="composer-step-title">
          <h3 id="composer-step-title" class="panel-title">{{ currentStep.heading }}</h3>
          <p class="panel-copy">{{ currentStep.guidance }}</p>

          <AppSelect
            v-model="form.audience"
            outlined
            label="Audience"
            :options="audienceOptions"
            hint="Only the selected group will see this announcement."
            persistent-hint
          />

          <DateTimeField
            v-model="form.expiresAt"
            class="q-mt-md"
            outlined
            label="Expiry date"
            clearable
            hint="Optional. Leave blank to keep the announcement visible until it is archived."
            persistent-hint
          />

          <q-separator class="q-my-lg" />
          <AnnouncementDetailsFields v-model="form.details" />
        </section>

        <section v-else class="composer-panel" aria-labelledby="composer-step-title">
          <h3 id="composer-step-title" class="panel-title">Review {{ entityLabel }}</h3>
          <p class="panel-copy">Check the details below. You can return to an earlier step to make changes.</p>

          <ComposerReview :form="form" />

          <div v-if="!editingLive" class="publish-choice q-mt-md">
            <div class="panel-title">When should it go out?</div>
            <q-option-group v-model="form.publishMode" :options="publishOptions" color="primary" inline />
            <DateTimeField
              v-if="form.publishMode === 'schedule'"
              v-model="form.publishAt"
              mode="datetime"
              class="q-mt-sm"
              outlined
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
import { Icon } from '@iconify/vue'
import DateTimeField from '@/components/ui/DateTimeField.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AnnouncementDetailsFields from './AnnouncementDetailsFields.vue'
import ComposerSteps from './ComposerSteps.vue'
import ComposerReview from './ComposerReview.vue'
import { audienceOptions, publishOptions, steps } from './composer'
import { useComposer } from './useComposer'

const props = defineProps<{
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

const {
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
} = useComposer(props, () => emit('saved'))
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
.publish-choice {
  border-top: 1px solid var(--c-border);
  padding-top: var(--sp-3, 12px);
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
  .step-list::before {
      left: calc(100% / 6);
      right: calc(100% / 6);
      top: 15px;
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
</style>
