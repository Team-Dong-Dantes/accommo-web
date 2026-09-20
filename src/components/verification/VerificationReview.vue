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
          <header class="tw-bar">
            <button type="button" class="tw-icon-btn" aria-label="Back" @click="closeWindow">
              <Icon icon="lucide:arrow-left" width="19" height="19" />
            </button>

            <span class="tw-av" :style="{ background: request?.avatarColor || 'var(--c-primary)' }">
              <img v-if="request?.avatarUrl" :src="request.avatarUrl" :alt="request.name" />
              <template v-else>{{ request?.initials }}</template>
            </span>
            <span class="tw-who-text">
              <span class="tw-name">{{ request?.name }}</span>
              <span class="tw-sub">{{ request?.type }} · {{ request?.email || request?.owner || 'No contact info' }}</span>
            </span>

            <span class="tw-spacer" />

            <span v-if="request?.status" class="tw-state" :class="`is-${String(request.statusStyle?.tone ?? 'neutral')}`">
              {{ request.status }}
            </span>
            <span class="tw-age" :class="{ 'is-late': isLate }">
              <Icon icon="lucide:clock" width="14" height="14" />
              {{ request?.submitted || 'Unknown' }}
            </span>

            <span v-if="queueCount > 1" class="tw-pos">{{ queueIndex + 1 }} <i>/</i> {{ queueCount }}</span>

            <button type="button" class="tw-icon-btn" aria-label="Close" @click="closeWindow">
              <Icon icon="lucide:x" width="19" height="19" />
            </button>
          </header>

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
          <div class="tw-stage">
            <article v-if="stageView === 'map'" class="tw-sheet">
              <header class="tw-sheet-head">
                <Icon icon="lucide:map-pin" width="15" height="15" />
                <span class="tw-sheet-name">Location</span>
              </header>
              <PropertyMap
                :key="request?.rawId ?? ''"
                :lat="request?.accommodation?.lat ?? null"
                :lng="request?.accommodation?.lng ?? null"
                :name="request?.name ?? 'This property'"
                :self-id="request?.rawId ?? ''"
              />
            </article>

            <article v-else-if="activeFile" class="tw-sheet">
              <header class="tw-sheet-head">
                <Icon :icon="fileIcon(activeFile.name)" width="15" height="15" />
                <span class="tw-sheet-name">{{ activeFile.name }}</span>
              </header>
              <DocumentViewer
                :files="[activeFile]"
                :index="0"
                :request-key="`${request?.id ?? ''}-${activeDoc}`"
                empty-caption=""
              />
            </article>

            <p v-else class="tw-nofiles">
              <Icon icon="lucide:file-x" width="46" height="46" />
              <b>No documents attached</b>
              <span>{{ isAccommodation
                ? 'Sanitary, fire safety, business and building permits are all required for accreditation.'
                : 'This applicant submitted no files.' }}</span>
            </p>
          </div>


          <!-- What the documents are checked against, beside them rather than
               beneath — the reviewer compares, so both sides stay on screen. -->
          <aside class="tw-rail">
            <!-- The switcher for the sheet beside it, so it sits at the top of
                 the rail rather than under the record it is not part of. -->
            <section v-if="files.length" class="tw-sec">
              <h3 class="tw-sec-head">
                <Icon icon="lucide:files" width="15" height="15" />
                Documents
                <span class="tw-count">{{ files.length }}</span>
              </h3>
              <ul class="tw-docs">
                <li v-for="(f, i) in files" :key="i">
                  <button
                    type="button"
                    class="tw-doc"
                    :class="{ 'is-active': isOpen('doc', i) }"
                    :aria-current="isOpen('doc', i) ? 'true' : undefined"
                    :title="f.name"
                    @click="show('doc', i)"
                  >
                    <Icon :icon="fileIcon(f.name)" width="15" height="15" />
                    <span class="tw-doc-name">{{ f.name }}</span>
                    <Icon
                      :icon="isOpen('doc', i) ? 'lucide:eye' : 'lucide:eye'"
                      width="16"
                      height="16"
                      class="tw-doc-eye"
                    />
                  </button>
                </li>
              </ul>
            </section>

            <section v-for="group in infoGroups" :key="group.title" class="tw-sec">
              <h3 class="tw-sec-head">
                <Icon :icon="group.icon" width="15" height="15" />
                {{ group.title }}
                <button
                  v-if="group.view"
                  type="button"
                  class="tw-sec-eye"
                  :class="{ 'is-active': isOpen(group.view) }"
                  :aria-current="isOpen(group.view) ? 'true' : undefined"
                  :title="isOpen(group.view) ? 'Showing the map' : 'Show on the map'"
                  @click="show(group.view)"
                >
                  <Icon :icon="isOpen(group.view) ? 'lucide:eye' : 'lucide:eye'" width="16" height="16" />
                </button>
              </h3>
              <dl class="tw-facts">
                <div v-for="row in group.rows" :key="row.label" :class="{ 'is-block': row.block }">
                  <dt>{{ row.label }}</dt>
                  <dd :class="{ 'is-empty': !row.value }" :title="row.value">{{ row.value || 'Not set' }}</dd>
                </div>
              </dl>
            </section>

            <section class="tw-sec">
              <h3 class="tw-sec-head">
                <Icon icon="lucide:shield-question" width="15" height="15" />
                Checks
              </h3>
              <div class="tw-checks">
                <span
                  v-for="c in checksRef?.checks ?? []"
                  :key="c.label"
                  class="tw-chip"
                  :class="`is-${c.status}`"
                  :title="c.detail"
                >
                  <Icon :icon="c.status === 'pass' ? 'lucide:check' : c.status === 'warn' ? 'lucide:triangle-alert' : 'lucide:x'" width="13" height="13" />
                  {{ c.label }}
                </span>
                <span v-if="!(checksRef?.checks ?? []).length" class="tw-chip is-muted">No automated checks</span>
              </div>
            </section>

            <footer class="tw-decide">
              <div class="tw-verdict" :class="`is-${checksRef?.verdict.tone ?? 'success'}`">
                <b><i class="tw-dot" />{{ checksRef?.verdict.label ?? 'Ready to verify' }}</b>
                <span v-if="checksRef?.verdict.detail">{{ checksRef.verdict.detail }}</span>
              </div>
              <DecisionForm
                ref="decisionRef"
                :has-blocking-fail="checksRef?.hasBlockingFail ?? false"
                :allow-override="true"
                :request-key="request?.id ?? null"
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
import { ref, computed, watch, onMounted, onUnmounted, type PropType } from 'vue'
import { Icon } from '@iconify/vue'
import DocumentViewer from '@/features/verifications/DocumentViewer.vue'
import PropertyMap from '@/features/verifications/PropertyMap.vue'
import DecisionForm from '@/features/verifications/DecisionForm.vue'
import VerificationChecks from '@/features/verifications/VerificationChecks.vue'
import { fileIcon } from '@/features/verifications/fileUtils'

const props = defineProps({
  request: {
    type: Object as PropType<Record<string, any> | null>,
    default: null,
  },
  queueIndex: { type: Number, default: -1 },
  queueCount: { type: Number, default: 0 },
  hasPrev: { type: Boolean, default: false },
  hasNext: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submit', 'prev', 'next'])

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
const profile = computed<Record<string, any>>(() => props.request?.profile ?? {})

/** Birth date with the age beside it, which is what a reviewer reads for. */
function birthLine(value: string | null | undefined): string {
  const shown = stamp(value)
  if (!shown) return ''
  const born = new Date(String(value))
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())
  if (beforeBirthday) age -= 1
  return age >= 0 && age < 130 ? `${shown} · ${age}` : shown
}

function stamp(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
}

const SEX_LABEL: Record<string, string> = { F: 'Female', M: 'Male', O: 'Other' }

/** Enum columns ('bedspace', 'mixed_gender') read as words; typed text is left
 *  exactly as the manager entered it. */
function label(value: string | null | undefined): string {
  if (!value) return ''
  const words = String(value).replace(/_/g, ' ')
  return /^[a-z ]+$/.test(words) ? words.charAt(0).toUpperCase() + words.slice(1) : words
}

interface InfoRow {
  label: string
  value: string
  /** A sentence or a list, which reads left-aligned under its label rather
   *  than squeezed into the right-hand half of the row. */
  block?: boolean
}
interface InfoGroup {
  title: string
  icon: string
  rows: InfoRow[]
  /** Set when the group has something to look at, opened from its heading. */
  view?: 'map'
}

/**
 * An accreditation request is about a property, not a person, so it gets its
 * own record: what it is, where it is, who runs it, and where its accreditation
 * stands. The account groups below would be entirely blank for one.
 *
 * Only what the manager submits with the property belongs here. Its size —
 * rooms, floors, per-room types, the capacity summed from them — is built after
 * accreditation, so those fields are empty at exactly the moment this panel is
 * read, and nothing in either app ever writes `business_name` or `address`.
 */
/** A house rule is a yes or a no, and an unanswered one is neither. */
function allowed(value: boolean | null | undefined): string {
  return value == null ? '' : value ? 'Allowed' : 'Not allowed'
}

const accommodationGroups = computed<InfoGroup[]>(() => {
  const a = props.request?.accommodation ?? {}
  const rules = a.extras?.policies
  return [
    {
      title: 'Property',
      icon: 'lucide:building-2',
      rows: [
        { label: 'Name', value: props.request?.name || '' },
        { label: 'Type', value: label(a.accommodation_type) },
        { label: 'Gender policy', value: label(a.gender_policy) },
        { label: 'Description', value: a.description || '', block: true },
      ],
    },
    {
      title: 'Location',
      icon: 'lucide:map-pin',
      // No street address is collected — the listing shows "Barangay, City", and
      // where the property really sits is a question for the map, not for a pair
      // of coordinates nobody can read.
      ...(a.lat != null && a.lng != null ? { view: 'map' as const } : {}),
      rows: [
        { label: 'Barangay', value: a.barangay || '' },
        { label: 'City', value: a.city || '' },
      ],
    },
    {
      title: 'House rules',
      icon: 'lucide:scroll-text',
      rows: [
        { label: 'Curfew', value: rules?.curfew_time || '' },
        { label: 'Quiet hours', value: rules?.quiet_hours || '' },
        { label: 'Cooking', value: allowed(rules?.cooking) },
        { label: 'Laundry', value: allowed(rules?.laundry) },
        { label: 'Pets', value: allowed(rules?.pets) },
        { label: 'Visitors', value: rules?.visitor_policy || '', block: true },
      ],
    },
    {
      title: 'Amenities',
      icon: 'lucide:list-checks',
      rows: [
        {
          label: 'Offered',
          value: (a.extras?.amenities ?? []).map(label).join(' · '),
          block: true,
        },
      ],
    },
    {
      title: 'Manager',
      icon: 'lucide:user-round',
      rows: [
        { label: 'Name', value: props.request?.owner || '' },
        { label: 'Email', value: a.manager_email || '' },
        { label: 'Phone', value: a.manager_phone || '' },
        { label: 'Account', value: label(a.manager_status) },
      ],
    },
  ]
})

/**
 * Grouped by the question each answers: who are they, are they really a student,
 * and what has the account itself done. All of it was already stored — the queue
 * function just never returned it.
 */
const infoGroups = computed(() => {
  if (isAccommodation.value) return accommodationGroups.value
  const p = profile.value
  const groups: InfoGroup[] = []

  groups.push({
    title: 'Applicant',
    icon: 'lucide:user',
    rows: [
      { label: 'Name', value: props.request?.name || '' },
      { label: 'Email', value: props.request?.email || '' },
      { label: 'Phone', value: p.phone || '' },
      { label: 'Sex', value: SEX_LABEL[String(p.sex ?? '').trim().toUpperCase()] || '' },
      // The field the ID is checked against: a school or government ID prints a
      // birth date, so this is the one comparable fact besides the name.
      { label: 'Date of birth', value: birthLine(p.date_of_birth) },
    ],
  })

  if (!isManager.value) {
    groups.push({
      title: 'Academic',
      icon: 'lucide:graduation-cap',
      rows: [
        { label: 'Student no.', value: p.student_id || '' },
        { label: 'College', value: p.college || '' },
        { label: 'Program', value: p.program || '' },
        { label: 'Year level', value: p.year_level != null ? String(p.year_level) : '' },
      ],
    })
  }

  groups.push({
    title: 'Account',
    icon: 'lucide:shield-user',
    rows: [
      { label: 'Registered', value: stamp(p.registered_at || p.created_at) },
      { label: 'Email confirmed', value: stamp(p.email_verified_at) },
      { label: 'Terms accepted', value: stamp(p.terms_accepted_at) },
      { label: 'Privacy notice', value: stamp(p.privacy_accepted_at) },
      {
        label: 'Sign-up',
        value: p.onboarding_complete == null ? '' : p.onboarding_complete ? 'Complete' : 'Incomplete',
      },
      { label: 'Last sign-in', value: stamp(p.last_login_at) },
    ],
  })

  return groups
})

const isManager = computed(() => props.request?.id?.startsWith('REQ-AM'))
const isAccommodation = computed(() => props.request?.id?.startsWith('REQ-AC'))

/** 97% of this queue is past the 3-day target, so the wait is worth colouring. */
const isLate = computed(() => {
  const text = String(props.request?.submitted ?? '')
  const days = /(\d+)\s*d/.exec(text)
  const months = /month|year/.test(text)
  return months || (days ? Number(days[1]) > 3 : false)
})

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
  inset: clamp(10px, 2vh, 24px) clamp(10px, 2vw, 26px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-surface);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
}

/* ── bar ── */
.tw-bar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--c-border);
}

.tw-state {
  flex: 0 0 auto;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--c-surface-2);
  color: var(--c-muted);
  font-size: 11.5px;
  font-weight: 700;
}
.tw-state.is-warning { background: var(--c-warning-soft); color: var(--c-warning); }
.tw-state.is-primary,
.tw-state.is-info { background: var(--c-primary-soft); color: var(--c-primary); }
.tw-state.is-danger { background: var(--c-danger-soft); color: var(--c-danger); }
.tw-state.is-success { background: var(--c-success-soft); color: var(--c-success); }
.tw-spacer { flex: 1 1 auto; }
.tw-icon-btn {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--c-border);
  border-radius: 10px;
  background: var(--c-surface-2);
  color: var(--c-muted);
  cursor: pointer;
}
.tw-icon-btn:hover { border-color: var(--c-primary); color: var(--c-primary); }
.tw-icon-btn:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }

.tw-av img {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
}
.tw-av {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  font-size: 12.5px;
  font-weight: 700;
}
.tw-who-text { display: flex; min-width: 0; flex-direction: column; }
.tw-name {
  overflow: hidden;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tw-sub { overflow: hidden; color: var(--c-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }

.tw-age {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--c-surface-2);
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 700;
}
.tw-age.is-late { background: var(--c-danger-soft); color: var(--c-danger); }

.tw-pos {
  flex: 0 0 auto;
  padding-left: 4px;
  color: var(--c-ink);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
}
.tw-pos i { color: var(--c-muted); font-style: normal; font-weight: 500; }

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
.tw-stage {
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  padding: 10px;
  overflow-y: auto;
  background: var(--c-bg);
}
.tw-sheet {
  display: flex;
  min-height: 260px;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface);
}
.tw-sheet-head {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--c-border);
  color: var(--c-muted);
}
.tw-sheet-name {
  overflow: hidden;
  color: var(--c-ink);
  font-size: 12.5px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tw-nofiles {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 0;
  color: var(--c-muted);
  text-align: center;
}
.tw-nofiles b { color: var(--c-ink); font-family: var(--font-display); font-size: 15px; }
.tw-nofiles span { max-width: 44ch; font-size: 12.5px; line-height: 1.5; }

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
/* The group title is a real heading rather than another micro-caption: at the
   same size and weight as the field labels the two read as peers, so the rail
   had no top level. Space above separates the groups — no rules needed. */
.tw-sec-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  padding: 16px 14px 4px;
  color: var(--c-ink);
  font-size: 12.5px;
  font-weight: 700;
}
.tw-sec-head :deep(svg) { flex: 0 0 auto; color: var(--c-muted); }

/* One column, label left and value right, with a hairline between rows only.
   The two-column grid boxed every fact in its own cell and left a dead half
   cell whenever a group held an odd number of them. */
.tw-facts { margin: 0; padding: 0; }
.tw-facts > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  padding: 7px 14px;
  border-top: 1px solid var(--c-border);
}
.tw-facts > div:first-child { border-top: 0; }
/* Prose under its label, full width and left-aligned: a description or a
   visitor policy is a sentence, and a sentence right-aligned in half a rail is
   unreadable. */
.tw-facts > div.is-block {
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
}
.tw-facts > div.is-block dd { text-align: left; }
.tw-facts dt {
  flex: 0 0 auto;
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 500;
}
/* Values wrap rather than truncate — a programme or college name is the field
   being compared against the document, so half of it is worse than two lines. */
.tw-facts dd {
  min-width: 0;
  margin: 0;
  color: var(--c-ink);
  font-size: 12.5px;
  font-weight: 600;
  overflow-wrap: anywhere;
  text-align: right;
}
/* A missing field is a fact about the request, so it is shown, not hidden. */
.tw-facts dd.is-empty { color: var(--c-muted); font-style: italic; font-weight: 500; }

/* One row per document, on the same rhythm as the facts below them. Weight and
   a solid eye say which one is open — a tinted row would be a fourth thing
   competing for the reviewer's attention with the checks and the verdict. */
.tw-docs { margin: 0; padding: 0; list-style: none; }
.tw-doc {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 9px;
  padding: 8px 14px;
  border: 0;
  border-top: 1px solid var(--c-border);
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
  font: inherit;
  text-align: left;
}
.tw-docs li:first-child .tw-doc { border-top: 0; }
.tw-doc:hover { background: var(--c-surface-2); }
.tw-doc-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--c-ink);
  font-size: 12.5px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tw-doc-eye { flex: 0 0 auto; opacity: 0.5; }
/* On the heading, at the far right, where the document count sits on its own
   section — the map belongs to the whole group, not to one line of it. */
.tw-sec-eye {
  display: inline-flex;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
  opacity: 0.5;
}
.tw-sec-eye:hover { opacity: 1; }
.tw-sec-eye.is-active { opacity: 1; color: var(--c-ink); }
.tw-doc.is-active .tw-doc-name { font-weight: 700; }
.tw-doc.is-active .tw-doc-eye { opacity: 1; color: var(--c-ink); }

.tw-count {
  margin-left: auto;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--c-surface-2);
  color: var(--c-muted);
  font-size: 11px;
  font-weight: 700;
}
.tw-subs { margin: 0; padding: 0; list-style: none; }
.tw-subs li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--c-border);
  color: var(--c-text);
  font-size: 12.5px;
}
.tw-subs li:last-child { border-bottom: 0; }
.tw-subs li :deep(svg) { flex: 0 0 auto; color: var(--c-muted); }
.tw-subs span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tw-none { margin: 0; padding: 8px 12px; color: var(--c-muted); font-size: 12px; }

/* ── automated checks ── */
.tw-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 6px 14px 12px;
}
.tw-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.tw-chip.is-pass { background: var(--c-success-soft); color: var(--c-success); }
.tw-chip.is-warn { background: var(--c-warning-soft); color: var(--c-warning); }
.tw-chip.is-fail { background: var(--c-danger-soft); color: var(--c-danger); }
.tw-chip.is-muted { background: var(--c-surface-2); color: var(--c-muted); }
.tw-checks-src { display: none; }

/* ── decision ── */
/* Sits on the floor of the rail, under everything it is a judgement about. */
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
</style>
