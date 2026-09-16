<template>
  <div class="rv-actions">
    <transition name="fade" mode="out-in">
      <!-- Resting: the two decisions, and nothing else. -->
      <div v-if="!pendingDecision" class="rv-btn-row">
        <button type="button" class="rv-btn rv-approve" @click="setDecision('approve')">
          <Icon icon="lucide:circle-check" width="16" height="16" /> Approve
        </button>
        <button type="button" class="rv-btn rv-reject" @click="setDecision('reject')">
          <Icon icon="lucide:circle-x" width="16" height="16" /> Reject
        </button>
      </div>

      <!-- Staged: the decision being made replaces the choice rather than
           stacking a tray beneath it. One Approve on screen at a time, the
           confirm stays on the footer's floor, and the note is the reason
           field of this step instead of an unlabelled icon. -->
      <div v-else class="rv-stage">
        <header class="rv-stage-head">
          <button type="button" class="rv-back" aria-label="Back to the decision" @click="reset">
            <Icon icon="lucide:arrow-left" width="16" height="16" />
          </button>
          <b>{{ pendingDecision === 'approve' ? 'Approving' : 'Rejecting' }}</b>
        </header>

        <div v-if="pendingDecision === 'reject'" class="reason-row">
          <q-chip
            v-for="tag in availableTags"
            :key="tag"
            clickable
            dense
            :color="selectedTags.includes(tag) ? 'red-5' : 'grey-2'"
            :text-color="selectedTags.includes(tag) ? 'white' : 'dark'"
            @click="toggleTag(tag)"
            class="text-weight-medium"
          >
            {{ tag }}
          </q-chip>
        </div>

        <q-input
          v-model="notes"
          outlined
          dense
          type="textarea"
          rows="2"
          :placeholder="notePlaceholder"
          class="note-input"
        />

        <label v-if="pendingDecision === 'approve' && hasBlockingFail && allowOverride" class="rv-override">
          <q-checkbox v-model="overrideConfirm" dense style="color: var(--c-ink)" />
          Override failed requirements - I verified this manually
        </label>
        <label v-if="pendingDecision === 'reject'" class="rv-override">
          <q-checkbox v-model="allowResubmission" dense style="color: var(--c-ink)" />
          Let them fix it and re-upload
        </label>
        <!-- An override is a judgement call that has to survive in the audit log,
             so it can't be a bare checkbox. -->
        <p v-if="pendingDecision === 'approve' && hasBlockingFail && overrideConfirm && !notes.trim()" class="rv-hint">
          Add a note explaining the override before confirming.
        </p>

        <button
          type="button"
          class="btn-resolve"
          :class="pendingDecision === 'approve' ? 'rv-c-approve' : 'rv-c-reject'"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ pendingDecision === 'approve' ? 'Confirm Approve' : 'Confirm Reject' }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'

export interface DecisionPayload {
  decision: 'approve' | 'reject'
  notes: string
  tags: string[]
  allowResubmission: boolean
  override: boolean
}

const props = withDefaults(
  defineProps<{
    hasBlockingFail?: boolean
    allowOverride?: boolean
    /** Changes when the reviewed request changes — resets the form. */
    requestKey?: string | null
  }>(),
  {
    hasBlockingFail: false,
    allowOverride: true,
    requestKey: null,
  },
)

const emit = defineEmits<{ (e: 'submit', payload: DecisionPayload): void }>()

const pendingDecision = ref<'approve' | 'reject' | null>(null)
const notes = ref('')
const selectedTags = ref<string[]>([])
const overrideConfirm = ref(false)
// A reject that lets the applicant try again is the common case; a permanent
// rejection should be the deliberate choice, so this defaults on.
const allowResubmission = ref(true)

const availableTags = [
  'Name Mismatch',
  'Missing Document',
  'Blurry Image',
  'Expired Document',
  'Wrong Document Type',
]

/** The note means something different on each side of the decision. */
const notePlaceholder = computed(() => {
  if (pendingDecision.value === 'reject') return 'Reason shown to the applicant (optional)…'
  return props.hasBlockingFail && overrideConfirm.value
    ? 'Explain the override — required'
    : 'Note for the record (optional)…'
})

// Exposed so the review window's A / R shortcuts stage a decision without
// reaching into the form's internals.
defineExpose({ stage: (val: 'approve' | 'reject') => setDecision(val) })

function setDecision(val: 'approve' | 'reject') {
  pendingDecision.value = val
  overrideConfirm.value = false
  allowResubmission.value = true
  if (val !== 'reject') selectedTags.value = []
}
function reset() {
  pendingDecision.value = null
  overrideConfirm.value = false
  allowResubmission.value = true
  selectedTags.value = []
  notes.value = ''
}
function toggleTag(tag: string) {
  const i = selectedTags.value.indexOf(tag)
  if (i > -1) selectedTags.value.splice(i, 1)
  else selectedTags.value.push(tag)
}
function submit() {
  if (!canSubmit.value) return
  emit('submit', {
    decision: pendingDecision.value!,
    notes: notes.value.trim(),
    tags: selectedTags.value,
    allowResubmission: pendingDecision.value === 'reject' && allowResubmission.value,
    override: overrideConfirm.value,
  })
}

const canSubmit = computed(() => {
  if (!pendingDecision.value) return false
  if (pendingDecision.value === 'approve' && props.hasBlockingFail) {
    if (!props.allowOverride || !overrideConfirm.value) return false
    // The override reason lands in audit_logs, so it can't be blank.
    if (!notes.value.trim()) return false
  }
  return true
})

// Reset form when the reviewed request changes (was the parent's
// request-id watcher resetting these fields).
watch(() => props.requestKey, reset)
</script>

<style scoped>
.rv-actions { display: flex; flex-direction: column; }
.rv-hint { font-size: 11px; color: var(--c-warning); margin: 0; }
.rv-btn-row { display: flex; gap: 8px; }
.rv-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: var(--radius-btn);
  padding: 10px 14px;
  font-weight: 700;
  font-size: 13px;
  font-family: var(--font-body);
  cursor: pointer;
  border: 1px solid transparent;
  transition: filter 0.15s ease, transform 0.1s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.rv-btn:active { transform: scale(0.98); }
.rv-approve { background: var(--c-success); color: #fff; }
.rv-approve:hover { filter: brightness(1.05); }
.rv-reject { background: transparent; border-color: var(--c-danger); color: var(--c-danger); }
.rv-reject:hover { background: color-mix(in srgb, var(--c-danger) 8%, transparent); }

/* The staged step is a plain column on the footer, not a framed tray — the
   footer is already a panel inside a panel. */
.rv-stage { display: flex; flex-direction: column; gap: 9px; }
.rv-stage-head {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--c-ink);
  font-size: 13px;
}
.rv-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.rv-back:hover { border-color: var(--c-ink); color: var(--c-ink); }

.reason-row { display: flex; flex-wrap: wrap; gap: 6px; }
.rv-override { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--c-ink); }
.note-input { width: 100%; }

/* Primary confirm button (mirrors ticket Resolve) */
.btn-resolve {
  margin-left: 0;
  width: 100%;
  justify-content: center;
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--c-success);
  color: #fff;
  font-weight: 700; font-size: 13px;
  border: none; border-radius: var(--radius-btn);
  padding: 11px 16px; cursor: pointer;
  transition: filter var(--t-fast), transform var(--t-fast);
}
.btn-resolve:hover { filter: brightness(1.05); transform: translateY(-1px); }
.btn-resolve:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.btn-resolve.rv-c-approve { background: var(--c-primary); }
.btn-resolve.rv-c-reject { background: var(--c-danger); }

/* Transitions */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
