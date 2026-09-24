<template>
  <div class="rd-card">
    <div class="rd-card-head">
      <span class="rd-card-title">Automated Checks</span>
      <div class="row q-gutter-x-xs counts" v-if="!checksLoading && checks.length">
        <span class="count-chip count-chip--pass">{{ checkCounts.pass }} ok</span>
        <span class="count-chip count-chip--warn" v-if="checkCounts.warn">{{ checkCounts.warn }} review</span>
        <span class="count-chip count-chip--fail" v-if="checkCounts.fail">{{ checkCounts.fail }} fail</span>
      </div>
    </div>
    <q-linear-progress v-if="checksLoading" indeterminate color="primary" style="height: 3px" class="q-mb-xs" />
    <div class="column q-gutter-y-xs">
      <div v-for="c in sortedChecks" :key="c.label" class="check-row" :class="`check-row--${c.status}`">
        <Icon :icon="checkIcon(c.status)" width="18" height="18" class="check-ico" />
        <div class="col min-width-0">
          <div class="text-weight-medium" style="font-size: 13px; color: var(--c-ink)">{{ c.label }}</div>
          <div class="text-caption" style="color: var(--c-muted)">{{ c.detail }}</div>
        </div>
      </div>
      <div v-if="!checksLoading && !checks.length" class="text-caption text-muted q-py-xs">
        No automated checks available.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '@/utils/supabase'

export interface VerificationCheck {
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
}

const props = withDefaults(
  defineProps<{
    request: Record<string, any> | null
    isAccommodation?: boolean
    /** Changes when the reviewed request changes — re-runs the checks. */
    requestKey?: string | null
  }>(),
  {
    isAccommodation: false,
    requestKey: null,
  },
)

const checks = ref<VerificationCheck[]>([])
const checksLoading = ref(false)

const hasBlockingFail = computed(() => checks.value.some((c) => c.status === 'fail'))

const verdict = computed<{ tone: 'success' | 'warning' | 'danger'; label: string; icon: string; detail: string }>(() => {
  const fail = checks.value.find((c) => c.status === 'fail')
  if (fail) return { tone: 'danger', label: 'Not ready', icon: 'lucide:circle-alert', detail: fail.detail }
  const warn = checks.value.find((c) => c.status === 'warn')
  if (warn) return { tone: 'warning', label: 'Review manually', icon: 'lucide:shield-question', detail: 'Some checks need a human eye.' }
  return { tone: 'success', label: 'Ready to verify', icon: 'lucide:shield-check', detail: 'All automated checks passed.' }
})

const sortedChecks = computed(() => {
  const order: Record<string, number> = { fail: 0, warn: 1, pass: 2 }
  return [...checks.value].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3))
})
const checkCounts = computed(() => {
  const c = { pass: 0, warn: 0, fail: 0 }
  for (const x of checks.value) c[x.status]++
  return c
})
function checkIcon(status: string) {
  return status === 'pass' ? 'lucide:circle-check' : status === 'fail' ? 'lucide:circle-x' : 'lucide:circle-alert'
}

/* ---- Check computation (verbatim from VerificationReview.runAutoChecks) -- */

async function runAutoChecks() {
  const r = props.request
  if (!r) return
  checksLoading.value = true
  const list: VerificationCheck[] = []

  const have = props.isAccommodation ? 0 : (r.files?.length ?? 0)
  const need = r.type?.includes('Landlord/Landlady') ? 1 : 2
  const docsOk = props.isAccommodation ? true : have >= need

  if (props.isAccommodation) {
    const requiredPermits = [
      { type: 'sanitary_permit', label: 'Sanitary permit' },
      { type: 'fire_safety', label: 'Fire safety permit' },
      { type: 'business_permit', label: 'Business permit' },
      { type: 'building_permit', label: 'Building permit' },
    ]
    const submitted = new Set((r.files ?? []).map((file: any) => file.type))
    const missing = requiredPermits.filter((permit) => !submitted.has(permit.type))
    list.push({
      label: 'Required accommodation permits',
      status: missing.length ? 'fail' : 'pass',
      detail: missing.length
        ? `Missing: ${missing.map((permit) => permit.label).join(', ')}.`
        : 'Sanitary, fire safety, business, and building permits are attached.',
    })
    if (r.files?.length) {
      // A signed URL comes back only when the row exists and this reviewer is
      // entitled to it, so an empty one is a real failure. (The old check fetched
      // the file with HEAD, which cannot work cross-origin against the signing
      // endpoint and would warn every time.)
      const unopenable = (r.files as any[]).filter((file) => !file.url).length
      list.push(unopenable
        ? { label: 'Permit files', status: 'fail', detail: `${unopenable} permit(s) could not be opened.` }
        : { label: 'Permit files', status: 'pass', detail: 'All permits opened for review.' })
    }
  } else {
    list.push({
      label: 'Required documents',
      status: docsOk ? 'pass' : 'fail',
      detail: docsOk ? `All ${need} required document(s) attached.` : `Missing ${need - have} of ${need} required document(s).`,
    })
    if (have) {
      const unopenable = (r.files as any[]).filter((f) => !f.url).length
      list.push(unopenable
        ? { label: 'Document files', status: 'fail', detail: `${unopenable} document(s) could not be opened.` }
        : { label: 'Document files', status: 'pass', detail: 'All documents opened for review.' })
    }
  }

  // There is no OCR anywhere in this system. This check used to read fields that
  // were hardcoded to '' and always degraded to a warn, which dressed up "nobody
  // looked" as "a check ran". Say what is actually true instead.
  if (!props.isAccommodation) {
    list.push({
      label: 'Name and ID on document',
      status: 'warn',
      detail: `Confirm the document names “${props.request?.name || 'the applicant'}” and the ID matches.`,
    })
  }

  try {
    if (!props.isAccommodation && r.email) {
      const { data } = await supabase.from('users').select('id, status').eq('email', r.email).neq('id', r.rawId)
      const dup = (data ?? []).find((u: any) => u.status === 'verified' || u.status === 'rejected')
      list.push(dup
        ? { label: 'Duplicate account', status: 'fail', detail: `Another account with this email is already ${dup.status}.` }
        : { label: 'Duplicate account', status: 'pass', detail: 'No conflicting account found.' })
    } else if (props.isAccommodation && r.name) {
       const { data } = await supabase.from('accommodations').select('id, status').eq('name', r.name).neq('id', r.rawId)
      const dup = (data ?? []).find((p: any) => p.status === 'accredited')
      list.push(dup
         ? { label: 'Duplicate accommodation', status: 'fail', detail: 'An accommodation with this name is already accredited.' }
         : { label: 'Duplicate accommodation', status: 'pass', detail: 'No duplicate accommodation found.' })
    }
  } catch {
    list.push({ label: 'Duplicate check', status: 'warn', detail: 'Could not run duplicate check.' })
  }

  const emailOk = !!r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)
  list.push({ label: 'Contact email', status: emailOk ? 'pass' : 'warn', detail: emailOk ? `Valid: ${r.email}` : 'No email on file.' })

  checks.value = list
  checksLoading.value = false
}

// `sortedChecks` is exposed so the review window can show the same checks as
// a compact row without owning the logic that produces them.
defineExpose({ hasBlockingFail, verdict, checks: sortedChecks, checksLoading })

// Signed document URLs are minted asynchronously and merged into the request
// after it opens, so keying only on the request id ran the checks against files
// whose `url` was still empty and reported every permit as unopenable. Re-run
// once the signing lands.
watch(
  () => `${props.requestKey}:${(props.request?.files ?? []).filter((f: any) => f.url).length}`,
  () => runAutoChecks(),
  { immediate: true },
)
</script>

<style scoped>
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
.rd-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.rd-card-head .rd-card-title { margin-bottom: 0; }

/* Automated checks */
.counts { flex-wrap: nowrap; }
.count-chip {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.2px;
  white-space: nowrap;
}
.count-chip--pass { background: color-mix(in srgb, var(--c-success) 14%, transparent); color: var(--c-success); }
.count-chip--warn { background: color-mix(in srgb, var(--c-warning) 16%, transparent); color: var(--c-warning); }
.count-chip--fail { background: color-mix(in srgb, var(--c-danger) 14%, transparent); color: var(--c-danger); }

.check-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
}
.check-ico { flex: 0 0 auto; margin-top: 1px; }
.check-row--pass .check-ico { color: var(--c-success); }
.check-row--fail .check-ico { color: var(--c-danger); }
.check-row--warn .check-ico { color: var(--c-warning); }

.min-width-0 { min-width: 0; }
</style>
