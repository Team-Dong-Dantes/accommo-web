<template>
  <teleport to="body">
    <transition name="tw" :duration="450">
      <div class="ticket-window" v-if="request">
        <div class="tw-scrim" @click="closeWindow"></div>

        <!-- LEFT: status + decision -->
        <aside class="tw-side">
          <div class="tw-side-meta">
            <div class="side-sec-title"><Icon icon="mdi:clipboard-text-outline" width="14" height="14" /> Overview</div>

            <div class="ov-card">
              <div class="ov-row">
                <span class="ov-cap"><Icon icon="mdi:circle-medium" width="10" height="10" /> Status</span>
                <BadgePill :tone="(request?.statusStyle?.tone as any)" :icon="request?.statusStyle?.icon ?? ''" :label="request?.status || 'Unknown'" />
              </div>
              <div class="ov-row">
                <span class="ov-cap"><Icon icon="mdi:gavel" width="13" height="13" /> Verdict</span>
                <BadgePill :tone="checksRef?.verdict.tone ?? 'success'" :icon="checksRef?.verdict.icon ?? 'mdi:shield-check'" :label="checksRef?.verdict.label ?? 'Ready to verify'" />
              </div>
            </div>

            <div class="side-sec-title side-sec-gap"><Icon icon="mdi:scale-balance" width="14" height="14" /> Decision</div>

              <DecisionForm
                :has-blocking-fail="checksRef?.hasBlockingFail ?? false"
                :allow-override="true"
                :request-key="request?.id ?? null"
              @submit="(payload) => emit('submit', payload)"
            />
          </div>
        </aside>

        <!-- CENTER: document under review -->
        <div class="tw-panel">
          <div class="tw-body">
            <section class="tw-conv">
              <header class="conv-profile">
                <button type="button" class="tw-back" @click="closeWindow" aria-label="Back"><Icon icon="mdi:arrow-left" width="20" height="20" /></button>
                <div class="cp-av" :style="{ background: request?.avatarColor || 'teal-6' }">{{ request?.initials }}</div>
                <div class="cp-meta">
                  <div class="cp-name">{{ request?.name }}</div>
                  <div class="cp-sub">{{ request?.type }} · {{ request?.email || request?.owner || 'No contact info' }}</div>
                </div>
              </header>

              <DocumentViewer
                v-model:index="currentFile"
                :files="files"
                :request-key="request?.id ?? null"
                :empty-caption="isAccommodation ? 'Accommodation accreditation is verified from OSAS records, not uploads.' : 'No files were attached to this request.'"
              />
            </section>

            <!-- RIGHT: request details + automated evidence -->
            <aside class="tw-details">
              <div class="tw-details-head">Request Details</div>

              <div class="rd-card">
                <div class="rd-row"><span class="rd-key">{{ isAccommodation ? 'Accommodation' : 'Applicant' }}</span><span class="rd-val">{{ request?.name || '—' }}</span></div>
                <div class="rd-row" v-if="request?.email"><span class="rd-key">Email</span><span class="rd-val">{{ request?.email }}</span></div>
                <div class="rd-row"><span class="rd-key">Type</span><span class="rd-val">{{ request?.type || '—' }}</span></div>
                <div class="rd-row"><span class="rd-key">Received</span><span class="rd-val">{{ request?.submitted || '—' }}</span></div>
                <div class="rd-row" v-if="isAccommodation && request?.owner"><span class="rd-key">Accommodation Manager</span><span class="rd-val">{{ request?.owner }}</span></div>
              </div>

              <div class="rd-card">
                <div class="rd-card-title">Documents</div>
                <div v-if="files.length" class="doc-list">
                  <div v-for="(f, i) in files" :key="i" class="doc-item" :class="{ 'doc-item--active': i === currentFile }">
                    <Icon :icon="fileIcon(f.name)" width="18" height="18" class="doc-item-ico" />
                    <div class="doc-item-name ellipsis">{{ f.name }}</div>
                    <button type="button" class="doc-eye" @click="openDoc(i)" aria-label="Preview document"><Icon icon="mdi:eye-outline" width="18" height="18" /></button>
                    <a class="doc-ext" :href="f.url" target="_blank" rel="noopener" aria-label="Open in new tab"><Icon icon="mdi:open-in-new" width="18" height="18" /></a>
                  </div>
                </div>
                <div v-else class="text-caption text-muted q-py-xs">{{ isAccommodation ? 'Accommodation accreditation is verified from OSAS records.' : 'No documents attached.' }}</div>
              </div>

              <div class="rd-card" v-if="extractedName || docId">
                <div class="rd-card-title">OCR Extracted</div>
                <div class="rd-row"><span class="rd-key">Name</span><span class="rd-val">{{ extractedName || '—' }}</span></div>
                <div class="rd-row"><span class="rd-key">ID</span><span class="rd-val">{{ docId || '—' }}</span></div>
              </div>

              <VerificationChecks
                ref="checksRef"
                :request="request"
                :is-accommodation="isAccommodation"
                :extracted-name="extractedName"
                :doc-id="docId"
                :request-key="request?.id ?? null"
              />
            </aside>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'
import { Icon } from '@iconify/vue'
import BadgePill from '@/components/user/BadgePill.vue'
import DocumentViewer from '@/features/verifications/DocumentViewer.vue'
import DecisionForm from '@/features/verifications/DecisionForm.vue'
import VerificationChecks from '@/features/verifications/VerificationChecks.vue'
import type { DecisionPayload } from '@/features/verifications/DecisionForm.vue'
import { fileIcon } from '@/features/verifications/fileUtils'

const props = defineProps({
  request: {
    type: Object as PropType<Record<string, any> | null>,
    default: null,
  },
})
const emit = defineEmits(['close', 'submit'])

// Checks panel (verdict + blocking-fail state live there now).
const checksRef = ref<InstanceType<typeof VerificationChecks> | null>(null)

function closeWindow() {
  emit('close')
}

/* ---- Document viewer wiring --------------------------------------------- */
const files = computed<any[]>(() => props.request?.files ?? [])
const currentFile = ref(0)

const isAccommodation = computed(() => props.request?.id?.startsWith('REQ-AC'))
const extractedName = computed(() => (props.request as any)?.extractedName || '')
const docId = computed(() => (props.request as any)?.extractedSchoolId || (props.request as any)?.extractedGovId || '')

function openDoc(i: number) {
  if (i >= 0 && i < files.value.length) currentFile.value = i
}

// Reset the active file when the reviewed request changes (children reset
// their own state via the requestKey prop).
watch(
  () => props.request?.id,
  () => {
    currentFile.value = 0
  },
)
</script>

<style scoped>
/* ===== Ticket-window LAYOUT (mirrors SupportTickets.vue shell) ===== */
.ticket-window {
  position: fixed;
  inset: 0;
  z-index: 4000;
  overflow: hidden;
}
.tw-scrim {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}
.tw-panel {
  position: absolute;
  top: var(--sp-6);
  right: var(--sp-6);
  bottom: var(--sp-6);
  left: calc(var(--sp-6) + 320px + var(--sp-4));
  border-radius: var(--radius);
  background: var(--c-surface);
  box-shadow: -24px 0 60px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tw-side {
  position: absolute;
  top: var(--sp-6);
  left: var(--sp-6);
  bottom: var(--sp-6);
  width: 320px;
  border-radius: var(--radius);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow-sm);
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  overflow-y: auto;
  z-index: 1;
}
.tw-side-meta { display: flex; flex-direction: column; gap: var(--sp-3); }
.side-sec-title { display: flex; align-items: center; gap: 6px; font-family: var(--font-display); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-muted); padding: 0 2px; }
.side-sec-title .iconify { opacity: 0.85; }
.side-sec-gap { margin-top: var(--sp-2); }
.ov-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 2px 12px; display: flex; flex-direction: column; }
.ov-row { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); padding: 11px 0; border-bottom: 1px solid var(--c-border); }
.ov-row:last-child { border-bottom: none; }
.ov-cap { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--c-muted); }
.ov-cap .iconify { color: var(--c-border-strong); }

.tw-enter-from .tw-panel,
.tw-leave-to .tw-panel { transform: translateX(100%); }
.tw-enter-active .tw-panel,
.tw-leave-active .tw-panel { transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1); }
.tw-enter-from .tw-side,
.tw-leave-to .tw-side { transform: translateX(-100%); opacity: 0; }
.tw-enter-active .tw-side,
.tw-leave-active .tw-side { transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease; }
.tw-enter-from .tw-scrim,
.tw-leave-to .tw-scrim { opacity: 0; }
.tw-enter-active .tw-scrim,
.tw-leave-active .tw-scrim { transition: opacity 0.42s ease; }
.tw-enter-from,
.tw-leave-to { opacity: 0; }
.tw-enter-active,
.tw-leave-active { transition: opacity 0.42s ease; }

.tw-back {
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  color: var(--c-muted);
  width: 34px; height: 34px;
  border-radius: 10px;
  display: grid; place-items: center;
  cursor: pointer;
  transition: all var(--t-fast);
  flex-shrink: 0;
}
.tw-back:hover { color: var(--c-ink); border-color: var(--c-border-strong); }

.tw-body { flex: 1 1 0; min-height: 0; display: flex; gap: var(--sp-4); padding: var(--sp-4); }
.tw-conv { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; background: var(--c-bg); border: 1px solid var(--c-border); border-radius: var(--radius); overflow: hidden; }
.conv-profile {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
}
.cp-av {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  flex-shrink: 0;
}
.cp-meta { min-width: 0; }
.cp-name { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-sub { font-size: 12px; color: var(--c-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tw-details { width: 380px; flex-shrink: 0; border: 1px solid var(--c-border); border-radius: var(--radius); background: var(--c-surface); overflow-y: auto; padding: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-4); }
.tw-details-head { font-family: var(--font-display); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-muted); margin-bottom: 10px; }
.tw-details, .tw-side { scrollbar-width: thin; scrollbar-color: var(--c-border-strong) transparent; }
.tw-details::-webkit-scrollbar, .tw-side::-webkit-scrollbar { width: 8px; }
.tw-details::-webkit-scrollbar-thumb, .tw-side::-webkit-scrollbar-thumb { background: var(--c-border-strong); border-radius: 999px; }
.tw-details::-webkit-scrollbar-track, .tw-side::-webkit-scrollbar-track { background: transparent; }

/* Clean admin detail cards (replaces the ticket receipt) */
.rd-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
}
.rd-card-title { font-size: 11px; font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.rd-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-3); padding: 7px 0; border-bottom: 1px solid var(--c-border); }
.rd-row:last-child { border-bottom: none; }
.rd-key { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-muted); flex-shrink: 0; }
.rd-val { font-size: 13px; color: var(--c-ink); text-align: right; word-break: break-word; }

/* Uploaded documents list */
.doc-list { display: flex; flex-direction: column; gap: 6px; }
.doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
  transition: border-color 0.15s ease, background 0.15s ease;
}
.doc-item--active { border-color: var(--c-primary); background: color-mix(in srgb, var(--c-primary) 10%, transparent); }
.doc-item-ico { flex: 0 0 auto; color: var(--c-muted); }
.doc-item-name { flex: 1 1 auto; min-width: 0; font-size: 13px; color: var(--c-ink); }
.doc-eye,
.doc-ext {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 30px; height: 30px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-muted);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.doc-eye:hover,
.doc-ext:hover { color: var(--c-primary); border-color: var(--c-primary); }
.doc-ext { text-decoration: none; }

.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 1100px) {
  .tw-panel {
    top: var(--sp-2);
    right: var(--sp-2);
    bottom: var(--sp-2);
    left: calc(var(--sp-2) + 260px + var(--sp-2));
    border-radius: var(--radius);
  }
  .tw-side { top: var(--sp-2); left: var(--sp-2); bottom: var(--sp-2); width: 260px; }
  .tw-details { display: none; }
}
</style>
