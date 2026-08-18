<template>
  <div class="q-pa-md full-width bg-surface" style="border-radius: 0 12px 12px 12px;">

    <div class="row items-center justify-between q-mb-md">
      <q-btn
        flat
        dense
        color="primary"
        no-caps
        class="text-weight-bold"
        @click="$emit('close')"
      >
        <Icon icon="mdi:arrow-left" class="on-left" width="18" height="18" />Back to List
      </q-btn>

      <div class="row items-center q-gutter-x-sm">
        <span class="text-muted text-weight-medium text-caption">Request ID: {{ request?.id || 'REQ-L102' }}</span>
        <div class="bg-warning-soft text-warning text-caption text-weight-bold q-px-sm q-py-xs rounded-borders">
          Pending Review
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-md">

      <div class="col-12 col-md-8">
        <q-card flat bordered class="bg-surface document-container">

          <div class="row justify-between items-center q-pa-sm border-bottom">
            <div class="text-weight-bold text-ink q-ml-sm">
              Attached_Document.pdf
            </div>
            <div class="row q-gutter-x-xs">
              <q-btn flat dense color="grey-7" size="sm"><Icon icon="mdi:rotate-right" width="18" height="18" /></q-btn>
              <q-btn flat dense color="grey-7" size="sm"><Icon icon="mdi:tune-vertical" width="18" height="18" /></q-btn>
              <q-separator vertical class="q-mx-xs" />
              <q-btn flat dense color="grey-7" size="sm"><Icon icon="mdi:magnify-plus" width="18" height="18" /></q-btn>
              <q-btn flat dense color="grey-7" size="sm"><Icon icon="mdi:magnify-minus" width="18" height="18" /></q-btn>
            </div>
          </div>

          <div class="col bg-surface-2 flex flex-center relative-position">
            <Icon icon="mdi:file-document-outline" width="64" height="64" color="var(--c-border-strong)" />
            <div class="absolute-bottom text-center q-pb-md text-muted text-caption">
              Simulated Document Viewer
            </div>
          </div>

        </q-card>
      </div>

      <div class="col-12 col-md-4 column q-gutter-y-md">

        <q-card flat bordered class="q-pa-md panel-card">
          <div class="text-caption text-muted text-weight-bold q-mb-md text-uppercase">Applicant</div>

          <div class="row items-center no-wrap">
            <q-avatar size="48px" :color="request?.avatarColor || 'teal-6'" text-color="white" class="text-weight-bold q-mr-md">
              {{ request?.initials || '??' }}
            </q-avatar>
            <div class="column">
              <div class="text-weight-bold text-ink" style="font-size: 16px">{{ request?.name || 'Applicant Name' }}</div>
              <div class="text-muted" style="font-size: 13px">{{ request?.email || request?.owner || 'Contact Info' }}</div>
            </div>
          </div>
        </q-card>

        <q-card flat bordered class="q-pa-md panel-card">
          <div class="row justify-between items-center q-mb-md">
            <div class="text-caption text-muted text-weight-bold text-uppercase">System Match Verification</div>
            <div class="text-caption text-primary text-weight-bold bg-primary-soft q-px-sm q-py-xs rounded-borders">
              Auto-Checked
            </div>
          </div>

          <div class="column q-gutter-y-sm">

            <div class="row items-center justify-between bg-surface-2 q-pa-sm rounded-borders">
              <div class="column">
                <span class="text-caption text-muted">Registered Name</span>
                <span class="text-weight-bold text-ink" style="font-size: 13px">{{ request?.name }}</span>
              </div>
              <Icon icon="mdi:check-circle" color="#66bb6a" width="18" height="18" />
            </div>

            <div class="row items-center justify-between bg-surface-2 q-pa-sm rounded-borders">
              <div class="column">
                <span class="text-caption text-muted">Document Status</span>
                <span class="text-weight-bold text-ink" style="font-size: 13px">Valid until Dec 2026</span>
              </div>
              <Icon icon="mdi:check-circle" color="#66bb6a" width="18" height="18" />
            </div>

          </div>
        </q-card>

        <q-card flat bordered class="q-pa-md col flex column panel-card">
          <div class="text-caption text-muted text-weight-bold q-mb-md text-uppercase">Decision</div>

          <div class="row q-gutter-x-sm q-mb-md">
            <q-btn
              outline
              :color="decision === 'approve' ? 'primary' : 'grey-5'"
              :class="{'bg-primary-soft': decision === 'approve'}"
              label="Approve"
              class="col text-weight-bold"
              no-caps
              @click="setDecision('approve')"
            />
            <q-btn
              outline
              :color="decision === 'reject' ? 'negative' : 'grey-5'"
              :class="{'bg-danger-soft': decision === 'reject'}"
              label="Reject"
              class="col text-weight-bold"
              no-caps
              @click="setDecision('reject')"
            />
          </div>

          <div v-if="decision === 'reject'" class="q-mb-md">
            <div class="text-caption text-ink q-mb-sm text-weight-medium">Select Rejection Reasons</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="tag in availableTags"
                :key="tag"
                clickable
                :color="selectedTags.includes(tag) ? 'red-5' : 'grey-2'"
                :text-color="selectedTags.includes(tag) ? 'white' : 'dark'"
                @click="toggleTag(tag)"
                class="text-weight-medium"
              >
                {{ tag }}
              </q-chip>
            </div>
          </div>

          <div v-if="decision" class="q-mb-md">
            <div class="text-caption text-ink q-mb-sm text-weight-medium">Additional Notes</div>
            <q-input
              v-model="notes"
              outlined
              type="textarea"
              dense
              placeholder="Leave an internal note regarding this decision..."
              rows="2"
            />
          </div>

          <q-space />

          <q-btn
            unelevated
            :color="decision ? 'primary' : 'grey-4'"
            :text-color="decision ? 'white' : 'grey-6'"
            :disable="!decision"
            label="Submit Verification"
            class="full-width text-weight-bold submit-btn"
            no-caps
            @click="$emit('submit', { decision, notes, tags: selectedTags })"
          />
        </q-card>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  request: {
    type: Object,
    default: null
  }
})

defineEmits(['close', 'submit'])

const decision = ref<string | null>(null)
const notes = ref('')
const selectedTags = ref<string[]>([])

const availableTags = [
  'Blurry Image',
  'Name Mismatch',
  'Expired Document',
  'Missing Signature',
  'Wrong Document Type'
]

function setDecision(val: string) {
  decision.value = val
  if (val === 'approve') {
    selectedTags.value = []
  }
}

function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}
</script>

<style scoped>
.document-container {
  border-radius: 12px;
  height: calc(95vh - 180px);
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.panel-card {
  border-radius: 12px;
}

.border-bottom {
  border-bottom: 1px solid var(--c-border);
}

.rounded-borders {
  border-radius: var(--radius-sm);
}

.submit-btn {
  border-radius: 8px;
  height: 44px;
}
</style>
