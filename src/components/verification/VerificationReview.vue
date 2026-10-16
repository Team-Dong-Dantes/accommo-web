<template>
  <teleport to="body">
    <transition name="tw" :duration="300">
      <div class="ticket-window" v-if="request">
        <div class="tw-scrim" @click="closeWindow"></div>

        <!-- A lightbox for one request rather than a console with a sidebar.
             Everything the reviewer needs runs down the middle in the order the
             decision is made: who → what they sent → what we know → decide. One
             document fills the sheet at a time; the rail lists them all and
             says which one is open. -->
        <section class="tw-shell" role="dialog" aria-modal="true" aria-label="Verification review">
          <ReviewHeader :request="request" :queue-index="queueIndex" :queue-count="queueCount" @close="closeWindow" />

          <!-- Queue arrows sit on the margins, out of the document's way. -->
          <button
            v-if="hasPrev"
            type="button"
            class="tw-step tw-step--prev"
            aria-label="Previous request"
            title="Previous (←)"
            @click="emit('prev')"
          >
            <Icon icon="lucide:chevron-left" width="26" height="26" />
          </button>
          <button
            v-if="hasNext"
            type="button"
            class="tw-step tw-step--next"
            aria-label="Next request"
            title="Next (→)"
            @click="emit('next')"
          >
            <Icon icon="lucide:chevron-right" width="26" height="26" />
          </button>

          <div class="tw-main">
          <ReviewStage
            :request="request"
            :view="stageView"
            :file="activeFile"
            :active-doc="activeDoc"
            :is-accommodation="!!isAccommodation"
          />


          <!-- What the documents are checked against, beside them rather than
               beneath — the reviewer compares, so both sides stay on screen. -->
          <aside class="tw-rail">
            <ReviewRound v-if="round" :round="round" :request="request" />

            <ReviewDocs
              v-if="files.length"
              :files="files"
              :is-accommodation="!!isAccommodation"
              :active="stageView === 'doc' ? activeDoc : null"
              @show="(i) => show('doc', i)"
            />

            <ReviewFacts
              v-for="group in infoGroups"
              :key="group.title"
              :group="group"
              :open="!!group.view && isOpen(group.view)"
              @show="group.view && show(group.view)"
            />

            <ReviewChecks
              :checks="checksRef?.checks ?? []"
              :can-read="checksRef?.canRead ?? false"
              :reading="checksRef?.reading ?? false"
              @read="checksRef?.readDocuments()"
            />

            <footer class="tw-decide">
              <div class="tw-verdict" :class="`is-${checksRef?.verdict.tone ?? 'success'}`">
                <b><i class="tw-dot" />{{ checksRef?.verdict.label ?? 'Ready to verify' }}</b>
                <span v-if="checksRef?.verdict.detail">{{ checksRef.verdict.detail }}</span>
              </div>
              <p v-if="!canDecide" class="tw-viewonly">
                <Icon icon="lucide:eye" width="15" height="15" />
                View only — your access doesn't include {{ isAccommodation ? 'accreditation' : 'verification' }} decisions.
              </p>
              <DecisionForm
                v-else
                ref="decisionRef"
                :has-blocking-fail="checksRef?.hasBlockingFail ?? false"
                :allow-override="true"
                :request-key="request?.id ?? null"
                :permits="isAccommodation ? PERMITS : []"
                :round-kind="round?.kind ?? null"
                :reason-required="!isAccommodation"
                @submit="(payload) => emit('submit', payload)"
              />
            </footer>
          </aside>
          </div>


          <!-- Off-screen: owns the checks, renders nothing of its own here. -->
          <VerificationChecks
            ref="checksRef"
            class="tw-checks-src"
            :request="request"
            :is-accommodation="isAccommodation"
            :request-key="request?.id ?? null"
          />
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import ReviewStage from '@/features/verifications/ReviewStage.vue'
import DecisionForm, { type DecisionPayload } from '@/features/verifications/DecisionForm.vue'
import VerificationChecks from '@/features/verifications/VerificationChecks.vue'
import { type RoundInfo } from '@/features/verifications/queue'
import { PERMITS, accommodationInfoGroups, accountInfoGroups } from '@/features/verifications/reviewInfo'
import ReviewHeader from '@/features/verifications/ReviewHeader.vue'
import ReviewChecks from '@/features/verifications/ReviewChecks.vue'
import ReviewRound from '@/features/verifications/ReviewRound.vue'
import ReviewDocs from '@/features/verifications/ReviewDocs.vue'
import ReviewFacts from '@/features/verifications/ReviewFacts.vue'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{
    request?: Record<string, any> | null
    queueIndex?: number
    queueCount?: number
    hasPrev?: boolean
    hasNext?: boolean
  }>(),
  { request: null, queueIndex: -1, queueCount: 0 },
)
const emit = defineEmits<{ close: []; submit: [payload: DecisionPayload]; prev: []; next: [] }>()

const checksRef = ref<InstanceType<typeof VerificationChecks> | null>(null)
const decisionRef = ref<InstanceType<typeof DecisionForm> | null>(null)

function closeWindow() {
  emit('close')
}

const files = computed<any[]>(() => props.request?.files ?? [])
/** What the sheet is showing: a document, or the property on the map. */
const stageView = ref<'doc' | 'map'>('doc')
/** Which document the sheet is showing. The first one, until one is picked. */
const activeDoc = ref(0)

function show(view: 'doc' | 'map', index = 0) {
  stageView.value = view
  if (view === 'doc') activeDoc.value = index
}
/** Exactly one eye is solid, across the documents and the pin alike. */
function isOpen(view: 'doc' | 'map', index = 0) {
  return stageView.value === view && (view !== 'doc' || activeDoc.value === index)
}
const activeFile = computed(() => files.value[activeDoc.value] ?? files.value[0] ?? null)
const isLandlord = computed(() => props.request?.id?.startsWith('REQ-AM'))
const isAccommodation = computed(() => props.request?.id?.startsWith('REQ-AC'))
const authStore = useAuthStore()
const canDecide = computed(() => authStore.can(isAccommodation.value ? 'accreditation' : 'verification', 'edit'))
const infoGroups = computed(() =>
  isAccommodation.value ? accommodationInfoGroups(props.request) : accountInfoGroups(props.request, !!isLandlord.value),
)
const round = computed<RoundInfo | null>(() => (props.request?.round as RoundInfo | undefined) ?? null)

/**
 * A queue of 69 should not need the mouse. Ignored while a field has focus, so
 * typing a rejection note cannot approve the request.
 */
function onKey(e: KeyboardEvent) {
  if (!props.request) return
  const el = e.target as HTMLElement | null
  if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
  if (e.key === 'ArrowLeft') { e.preventDefault(); emit('prev') }
  else if (e.key === 'ArrowRight') { e.preventDefault(); emit('next') }
  else if (e.key === 'a' || e.key === 'A') { e.preventDefault(); decisionRef.value?.stage?.('approve') }
  else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); decisionRef.value?.stage?.('reject') }
  else if (e.key === 'Escape') { e.preventDefault(); closeWindow() }
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

watch(() => props.request?.id, () => { stageView.value = 'doc'; activeDoc.value = 0 })
</script>

<style scoped src="@/features/verifications/reviewRail.css"></style>

<style scoped>
.ticket-window { position: fixed; inset: 0; z-index: 4000; overflow: hidden; }
.tw-scrim {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(3px);
}
.tw-shell {
  --tw-rail-w: 420px;
  position: absolute;
  inset: clamp(10px, calc(2 * var(--vh, 1vh)), 24px) clamp(10px, calc(2 * var(--vw, 1vw)), 26px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-surface);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
}
/* ── queue arrows on the margins ── */
.tw-step {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid var(--c-border);
  border-radius: 999px;
  background: var(--c-surface);
  box-shadow: var(--shadow-sm);
  color: var(--c-muted);
  cursor: pointer;
  transform: translateY(-50%);
}
.tw-step:hover { border-color: var(--c-primary); color: var(--c-primary); }
.tw-step--prev { left: 10px; }
/* Clear of the rail: the arrows belong to the document area, not the window. */
.tw-step--next { right: calc(var(--tw-rail-w) + 10px); }
/* ── documents ── */
.tw-main {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr) var(--tw-rail-w);
}
/* ── the account's own facts, under the documents ── */
/* Everything at once: a reviewer comparing a document against an account should
   not have to scroll a panel to see what they are comparing against. The
   spacing below is set so the whole rail fits beside the document rather than
   being given a scrollbar. */
.tw-rail {
  display: flex;
  min-height: 0;
  flex-direction: column;
  border-left: 1px solid var(--c-border);
  /* Nothing scrolls at rest — the whole record is on screen. Opening a confirm
     block adds ~130px, and a scrollbar appearing then is better than silently
     clipping the last facts, which is what hidden did. */
  overflow-y: auto;
  background: var(--c-surface);
}
.tw-checks-src { display: none; }
@media (prefers-reduced-motion: reduce) {
  .tw-read .is-spinning { animation: none; }
}
/* ── decision ── */
/* Sits on the floor of the rail, under everything it is a judgement about. */
.tw-viewonly {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--c-muted);
  font-size: 13px;
}
.tw-decide {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding: 12px 14px;
  border-top: 1px solid var(--c-border);
  background: var(--c-surface);
}
/* The verdict is the sentence that decides the request, so it is the largest
   line in the footer and the dot states its tone once. It was said three times
   over before — a tinted top border, a coloured icon and coloured text — which
   left the frame as loud as the sentence inside it. */
.tw-verdict { display: flex; flex-direction: column; gap: 2px; }
.tw-verdict b {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--c-ink);
  font-size: 14px;
}
.tw-dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--c-muted);
}
.tw-verdict span { padding-left: 16px; color: var(--c-muted); font-size: 12px; line-height: 1.45; }
.tw-verdict.is-success .tw-dot { background: var(--c-success); }
.tw-verdict.is-warning .tw-dot { background: var(--c-warning); }
.tw-verdict.is-danger .tw-dot { background: var(--c-danger); }
/* The form owns its own two states now; the rail only sizes what sits in it. */
.tw-decide :deep(.reason-row) {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.tw-decide :deep(.reason-row .q-chip) {
  margin: 0;
  font-size: 11px;
}
/* The checkbox and its sentence share a baseline instead of the label text
   wrapping under the box. */
.tw-decide :deep(.rv-override) {
  display: grid;
  align-items: start;
  gap: 2px;
  grid-template-columns: auto minmax(0, 1fr);
  color: var(--c-text);
  cursor: pointer;
  font-size: 12px;
  line-height: 1.4;
}
.tw-decide :deep(.rv-override .q-checkbox) { margin-top: -2px; }
.tw-decide :deep(.rv-hint) { margin: 0; font-size: 11.5px; line-height: 1.4; }
.tw-decide :deep(.btn-resolve) { width: 100%; padding: 9px 12px; font-size: 13px; }
/* ── transition ── */
.tw-enter-from .tw-shell,
.tw-leave-to .tw-shell { transform: scale(0.985); opacity: 0; }
.tw-enter-active .tw-shell,
.tw-leave-active .tw-shell { transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease; }
.tw-enter-from .tw-scrim,
.tw-leave-to .tw-scrim { opacity: 0; }
.tw-enter-active .tw-scrim,
.tw-leave-active .tw-scrim { transition: opacity 0.28s ease; }
@media (max-width: 1100px) {
  .tw-shell { --tw-rail-w: 0px; }
  .tw-main { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; }
  .tw-rail { max-height: 40%; overflow-y: auto; border-left: 0; border-top: 1px solid var(--c-border); }
}
@media (max-width: 900px) {
  .tw-stage { padding: 12px; }
  .tw-step { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .tw-enter-active .tw-shell,
    .tw-leave-active .tw-shell { transition: none; }
}
@keyframes tw-spin { to { transform: rotate(360deg); } }
</style>
