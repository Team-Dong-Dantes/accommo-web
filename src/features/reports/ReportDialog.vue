<template>
  <!-- A report opened from the page whose data it covers, in a floating window.
       When the page offers more than one report they are folder tabs on the
       window's top edge; below, the settings on the left and the printed page
       previewed live on the right. -->
  <q-dialog :model-value="modelValue" transition-show="scale" transition-hide="scale" @update:model-value="$emit('update:modelValue', $event)">
    <div class="rd-wrap">
      <div v-if="reports.length > 1" class="rd-tabs">
        <TabNav v-model="current" :tabs="reports.map((id) => ({ name: id, label: SHORT[id] }))" />
      </div>

      <div class="rd">
        <header class="rd-bar">
          <Icon icon="lucide:file-chart-column" width="20" height="20" class="rd-bar-icon" />
          <div class="rd-bar-title">
            <span class="rd-kicker">Report</span>
            <span class="rd-name">{{ def.title }}</span>
          </div>
          <q-space />
          <q-btn unelevated no-caps color="primary" class="rd-print" :disabled="!ready" @click="print">
            <Icon icon="lucide:printer" width="16" height="16" class="on-left" />Print / Save as PDF
          </q-btn>
          <button type="button" class="rd-close" aria-label="Close report" @click="$emit('update:modelValue', false)">
            <Icon icon="lucide:x" width="18" height="18" />
          </button>
        </header>

        <div class="rd-body">
          <aside class="rd-side">
            <p class="rd-blurb">{{ def.blurb }}</p>

            <div v-if="def.fields.length" class="rd-group">
              <div class="rd-group-title">Include</div>
              <div v-for="f in def.fields" :key="f.key" class="rd-row" :class="{ 'rd-row--toggle': f.kind === 'toggle' }">
                <template v-if="f.kind === 'toggle'">
                  <span class="rd-label">
                    {{ f.label }}
                    <span v-if="f.personal" class="rd-personal" title="Personal information (RA 10173)">
                      <Icon icon="lucide:shield-alert" width="12" height="12" />Personal
                    </span>
                  </span>
                  <q-toggle v-model="params[current]![f.key]" dense color="primary" />
                </template>
                <template v-else>
                  <span class="rd-label">{{ f.label }}</span>
                  <q-input
                    v-if="f.kind === 'date'"
                    :model-value="String(params[current]![f.key] || '')"
                    type="date"
                    dense
                    outlined
                    class="rd-input"
                    @update:model-value="(v) => (params[current]![f.key] = String(v ?? ''))"
                  />
                  <q-select
                    v-else
                    v-model="params[current]![f.key]"
                    :options="optionsFor(f)"
                    emit-value
                    map-options
                    dense
                    outlined
                    options-dense
                    class="rd-input"
                  />
                </template>
              </div>
            </div>

            <div class="rd-group">
              <div class="rd-group-title">Page</div>
              <div class="rd-page">
                <q-select v-model="paper" :options="PAPERS" emit-value map-options dense outlined label="Paper" class="rd-input" />
                <q-select v-model="orientation" :options="ORIENTATIONS" emit-value map-options dense outlined label="Orientation" class="rd-input" />
              </div>
            </div>

            <div class="rd-group">
              <div class="rd-group-title rd-group-title--link">
                Signatories
                <router-link to="/settings?section=reports" class="rd-link">Change</router-link>
              </div>
              <div class="rd-sign"><span>Prepared by</span><b>{{ signatories.preparedBy || '—' }}</b></div>
              <div class="rd-sign"><span>Noted by</span><b>{{ signatories.notedBy?.name || 'Blank line' }}</b></div>
              <div v-if="signatories.approvedBy?.name" class="rd-sign"><span>Approved by</span><b>{{ signatories.approvedBy.name }}</b></div>
            </div>
          </aside>

          <section class="rd-preview">
            <div v-if="loadError" class="rd-state rd-state--error">{{ loadError }}</div>
            <div v-else-if="!ready" class="rd-state"><q-spinner size="28px" color="primary" /><span>Loading…</span></div>
            <iframe v-else ref="frame" class="rd-frame" :srcdoc="html" sandbox="allow-modals allow-same-origin" title="Report preview" @load="fitPreview"></iframe>
          </section>
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import TabNav from '@/components/ui/TabNav.vue'
import { useAuthStore } from '@/stores/auth'
import { fetchBoarders, fetchLandlords, reportSignatories, type BoarderRow, type LandlordRow } from '@/api/reports'
import type { RealAccommodation } from '@/composables/useAccommodations'
import type { DrawerPreview } from '@/features/drawer/preview'
import { renderReport, printWhenReady, sealUrl, type Orientation, type Paper, type Signatories } from './document'
import { REPORTS, type ReportField, type ReportId, type ReportInput } from './reports'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** The reports this page offers, first is the default. */
    reports: ReportId[]
    /** Which to open on. */
    initial?: ReportId | undefined
    accommodations?: RealAccommodation[]
    /** Describes the page's own filters when they narrowed `accommodations`. */
    scopeNote?: string | undefined
    /** The open record, for a report about one accommodation. */
    preview?: DrawerPreview | undefined
    /** Its id, for the reference number. */
    recordId?: string | undefined
  }>(),
  { initial: undefined, accommodations: () => [], scopeNote: undefined, preview: undefined, recordId: undefined },
)
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const SHORT: Record<ReportId, string> = { masterlist: 'Masterlist', renewals: 'Renewals', occupancy: 'Occupancy', boarders: 'Boarders', landlords: 'Landlords/Landladies', status: 'Status' }
const PAPERS = [{ value: 'a4', label: 'A4' }, { value: 'long', label: 'Long bond (8.5 × 13 in)' }]
const ORIENTATIONS = [{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]

const current = ref<ReportId>(props.initial ?? props.reports[0]!)
const def = computed(() => REPORTS[current.value])
const params = reactive(Object.fromEntries(Object.values(REPORTS).map((r) => [r.id, { ...r.defaults }])) as Record<ReportId, Record<string, string | boolean>>)
const paper = ref<Paper>('a4')
// Wide listings read better across the page.
const orientation = ref<Orientation>('portrait')
watch(current, (id) => { orientation.value = id === 'renewals' || id === 'boarders' ? 'landscape' : 'portrait' }, { immediate: true })

// ── Data ────────────────────────────────────────────────────────────────────
const auth = useAuthStore()
const boarders = ref<BoarderRow[] | null>(null)
const landlords = ref<LandlordRow[] | null>(null)
const signatories = ref<Signatories>({ preparedBy: auth.user?.full_name })
const loadError = ref('')

watch(() => props.modelValue, async (open) => {
  if (!open) return
  current.value = props.initial ?? props.reports[0]!
  loadError.value = ''
  signatories.value = await reportSignatories(auth.user?.full_name)
}, { immediate: true })

// People are loaded the first time a report about them is chosen.
watch([() => props.modelValue, current], async ([open]) => {
  if (!open) return
  loadError.value = ''
  try {
    if (def.value.needs === 'boarders' && !boarders.value) boarders.value = await fetchBoarders()
    if (def.value.needs === 'landlords' && !landlords.value) landlords.value = await fetchLandlords()
  } catch (err) {
    loadError.value = `Could not load the report's data: ${err instanceof Error ? err.message : String(err)}`
  }
}, { immediate: true })

const ready = computed(() =>
  def.value.needs === 'boarders' ? boarders.value !== null
    : def.value.needs === 'landlords' ? landlords.value !== null
    : def.value.needs === 'record' ? !!props.preview
    : true)
const input = computed<ReportInput>(() => ({ accommodations: props.accommodations, boarders: boarders.value ?? [], landlords: landlords.value ?? [], scopeNote: props.scopeNote, preview: props.preview }))

function optionsFor(f: ReportField) {
  return typeof f.options === 'function' ? f.options(input.value) : f.options ?? []
}

const html = computed(() => {
  if (!ready.value) return ''
  const { bodyHtml } = def.value.build(input.value, params[current.value])
  return renderReport({
    code: def.value.code,
    title: def.value.title,
    bodyHtml,
    recordId: props.recordId,
    paper: paper.value,
    orientation: orientation.value,
    signatories: signatories.value,
    sealUrl: sealUrl(),
  })
})

// ── Print ───────────────────────────────────────────────────────────────────
const frame = ref<HTMLIFrameElement | null>(null)
/**
 * Shrinks the previewed page to the preview's width, so a landscape or long-bond
 * page never scrolls sideways. The report's print styles reset the zoom, so the
 * printed page keeps its real size.
 */
function fitPreview() {
  const doc = frame.value?.contentDocument
  const page = doc?.querySelector<HTMLElement>('.page')
  if (!doc || !page || !frame.value) return
  doc.documentElement.style.zoom = ''
  const scale = Math.min(1, (frame.value.clientWidth - 32) / page.offsetWidth)
  doc.documentElement.style.zoom = String(scale)
}
onMounted(() => window.addEventListener('resize', fitPreview))
onBeforeUnmount(() => window.removeEventListener('resize', fitPreview))

function print() {
  const win = frame.value?.contentWindow
  if (win) printWhenReady(win)
}
</script>

<style scoped>
/* A floating window over the page: all but a 16px margin of the viewport,
   with the page's reports as folder tabs on its top edge. */
.rd-wrap {
  display: flex;
  flex-direction: column;
  width: calc(100vw - 32px);
  max-width: none !important;
  height: calc(100vh - 32px);
  max-height: none !important;
}
.rd-tabs { position: relative; z-index: 1; flex-shrink: 0; margin-bottom: -1px; padding-left: 14px; }
.rd-tabs :deep(.q-tab--inactive) { opacity: 1; }
.rd {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--c-border);
  border-radius: 16px;
  background: var(--c-bg);
  box-shadow: 0 24px 64px rgba(10, 20, 18, 0.28);
  font-family: var(--font-body);
  color: var(--c-text);
}

.rd-bar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface);
}
.rd-bar-icon { color: var(--c-primary); }
.rd-bar-title { display: flex; flex-direction: column; line-height: 1.2; }
.rd-kicker { color: var(--c-muted); font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.rd-name { color: var(--c-ink); font-family: var(--font-display); font-size: 17px; font-weight: 700; }
.rd-print { border-radius: 8px; font-weight: 600; }
.rd-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--c-border);
  border-radius: 50%;
  background: var(--c-surface);
  color: var(--c-text);
  cursor: pointer;
}
.rd-close:hover { color: var(--c-primary); }

.rd-body { display: grid; flex: 1; grid-template-columns: 340px minmax(0, 1fr); min-height: 0; }

/* Settings: a flat grouped list, one line per setting — label left, control
   right — so the panel fits without scrolling. */
.rd-side { display: flex; flex-direction: column; gap: 10px; padding: 12px 20px; overflow: hidden; border-right: 1px solid var(--c-border); background: var(--c-surface); }
.rd-blurb { margin: 0; color: var(--c-text); font-size: 12.5px; }
.rd-group { display: flex; flex-direction: column; }
.rd-group-title { padding-bottom: 2px; color: var(--c-muted); font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.rd-row { display: grid; grid-template-columns: minmax(0, 1fr) 150px; align-items: center; gap: 10px; min-height: 38px; padding: 2px 0; border-bottom: 1px solid var(--c-border); }
.rd-group-title--link { display: flex; align-items: center; justify-content: space-between; }
.rd-group-title--link .rd-link { font-size: 11.5px; letter-spacing: 0; text-transform: none; }
.rd-page { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 6px 0 2px; }
.rd-row--toggle { grid-template-columns: minmax(0, 1fr) auto; }
.rd-label { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; color: var(--c-ink); font-size: 12.5px; font-weight: 500; line-height: 1.3; }
.rd-personal { display: inline-flex; align-items: center; gap: 3px; padding: 1px 6px; border-radius: 999px; background: var(--c-warning-soft); color: var(--c-warning); font-size: 10px; font-weight: 700; }
.rd-input { min-width: 0; font-size: 12.5px; }
.rd-sign { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; border-bottom: 1px solid var(--c-border); font-size: 12.5px; }
.rd-sign span { color: var(--c-muted); }
.rd-sign b { color: var(--c-ink); text-align: right; }
.rd-link { color: var(--c-primary); font-size: 12.5px; font-weight: 600; text-decoration: none; }
.rd-link:hover { text-decoration: underline; }

/* Preview: the printed page on a grey desk. */
.rd-preview { position: relative; min-height: 0; background: #d9d9d9; }
.rd-frame { width: 100%; height: 100%; border: none; }
.rd-state { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--c-text); }
.rd-state--error { color: var(--c-danger); }
</style>
