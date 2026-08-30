<template>
  <div class="rv-actions">
    <div class="rv-btn-row">
      <button type="button" class="rv-btn rv-approve" :class="{ 'is-active': pendingDecision === 'approve' }" @click="setDecision('approve')">
        <Icon icon="mdi:check-circle-outline" width="16" height="16" /> Approve
      </button>
      <button type="button" class="rv-btn rv-reject" :class="{ 'is-active': pendingDecision === 'reject' }" @click="setDecision('reject')">
        <Icon icon="mdi:close-circle-outline" width="16" height="16" /> Reject
      </button>
    </div>

    <transition name="fade">
      <div v-if="pendingDecision" class="rv-confirm-block">
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
        <label v-if="pendingDecision === 'approve' && hasBlockingFail" class="rv-override">
          <q-checkbox v-model="overrideConfirm" dense style="color: var(--c-ink)" />
          Override mismatch — I verified the documents manually
        </label>
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

    <button type="button" class="rv-note-toggle" @click="noteOpen = !noteOpen">
      <Icon icon="mdi:note-text-outline" width="16" height="16" class="q-mr-xs" /> Note
    </button>
    <transition name="fade">
      <q-input
        v-if="noteOpen"
        v-model="notes"
        outlined
        dense
        type="textarea"
        rows="2"
        placeholder="Internal note (optional)…"
        class="note-input"
      />
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
}

const props = withDefaults(
  defineProps<{
    hasBlockingFail?: boolean
    /** Changes when the reviewed request changes — resets the form. */
    requestKey?: string | null
  }>(),
  {
    hasBlockingFail: false,
    requestKey: null,
  },
)

const emit = defineEmits<{ (e: 'submit', payload: DecisionPayload): void }>()

const pendingDecision = ref<'approve' | 'reject' | null>(null)
const notes = ref('')
const selectedTags = ref<string[]>([])
const overrideConfirm = ref(false)
const noteOpen = ref(false)

const availableTags = [
  'Name Mismatch',
  'Missing Document',
  'Blurry Image',
  'Expired Document',
  'Wrong Document Type',
]

function setDecision(val: 'approve' | 'reject') {
  pendingDecision.value = val
  overrideConfirm.value = false
  if (val !== 'reject') selectedTags.value = []
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
    allowResubmission: false,
  })
}

const canSubmit = computed(() => {
  if (!pendingDecision.value) return false
  if (pendingDecision.value === 'approve' && props.hasBlockingFail && !overrideConfirm.value) return false
  return true
})

// Reset form when the reviewed request changes (was the parent's
// request-id watcher resetting these fields).
watch(
  () => props.requestKey,
  () => {
    pendingDecision.value = null
    overrideConfirm.value = false
    selectedTags.value = []
    notes.value = ''
    noteOpen.value = false
  },
)
</script>

<style scoped>
/* Decision actions (sidebar) */
.rv-actions { display: flex; flex-direction: column; gap: 10px; }
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
.rv-approve.is-active { box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-success) 32%, transparent); }
.rv-reject { background: transparent; border-color: var(--c-danger); color: var(--c-danger); }
.rv-reject:hover { background: color-mix(in srgb, var(--c-danger) 8%, transparent); }
.rv-reject.is-active { background: var(--c-danger); color: #fff; }

.rv-confirm-block { display: flex; flex-direction: column; gap: 10px; }
.reason-row { display: flex; flex-wrap: wrap; gap: 6px; }
.rv-override { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--c-ink); }
.rv-note-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  border: none;
  background: transparent;
  color: var(--c-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 0;
  transition: color 0.15s ease;
}
.rv-note-toggle:hover { color: var(--c-ink); }
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
