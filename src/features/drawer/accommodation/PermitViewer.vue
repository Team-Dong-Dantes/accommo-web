<template>
  <div ref="root" class="pv" role="dialog" aria-modal="true" tabindex="-1" :aria-label="file.name" @click.self="$emit('close')" @keydown.esc.stop="$emit('close')">
    <div class="pv-card">
      <div class="pv-doc">
        <div v-if="signing" class="pv-wait"><q-spinner-dots color="primary" size="38px" /></div>
        <div v-else-if="signError" class="pv-wait pv-err">
          <Icon icon="lucide:file-warning" width="40" height="40" />
          <div>{{ signError }}</div>
        </div>
        <DocumentViewer v-else v-model:index="docIndex" :files="[{ name: file.name, url: signedUrl }]" />
      </div>

      <div class="pv-side">
        <div class="pv-head">
          <div class="pv-title">{{ file.name }}</div>
          <button type="button" class="pv-close" aria-label="Close document" @click="$emit('close')">
            <Icon icon="lucide:x" width="14" height="14" />
          </button>
        </div>
        <span v-if="file.status" class="pv-pill" :class="`pv-pill--${file.statusTone ?? 'neutral'}`">{{ file.status }}</span>
        <div class="pv-rows">
          <div v-for="r in rows" :key="r.label" class="pv-row">
            <span class="pv-lbl">{{ r.label }}</span>
            <span class="pv-val">{{ r.value }}</span>
          </div>
        </div>
        <div class="pv-actions">
          <button v-if="needsRenewal" type="button" class="pv-btn pv-btn--accent" :disabled="sending" @click="notifyLandlord('renew')">Remind landlord to renew</button>
          <button type="button" class="pv-btn" :disabled="sending" @click="notifyLandlord('reupload')">Request re-upload</button>
          <button type="button" class="pv-btn pv-btn--solid" :disabled="!signedUrl" @click="download">Download</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import DocumentViewer from '@/features/verifications/DocumentViewer.vue'
import { signDocUrl } from '@/utils/docUrl'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import type { PreviewFile } from '../preview'

const props = defineProps<{ file: PreviewFile; landlordId: string; accommodationName: string }>()
defineEmits<{ (e: 'close'): void }>()

const notify = useNotify()

// Focused on open so Escape closes this viewer rather than the whole drawer behind it.
const root = ref<HTMLElement | null>(null)
onMounted(() => root.value?.focus())
const docIndex = ref(0)
const signing = ref(false)
const signError = ref('')
const signedUrl = ref('')
const sending = ref(false)

// Permits sit behind Cloudinary's authenticated delivery; a URL is signed for
// the one being opened, and only when it is opened.
watch(
  () => props.file,
  async (f) => {
    signing.value = true
    signError.value = ''
    signedUrl.value = ''
    try {
      if (f.docId && f.docTable) {
        const res = await signDocUrl(f.docTable, f.docId)
        signedUrl.value = res.url || ''
        signError.value = res.error ?? ''
      } else {
        signedUrl.value = f.url
      }
    } finally {
      signing.value = false
    }
  },
  { immediate: true },
)

const rows = computed(() => [
  { label: 'Expires', value: props.file.expiry || 'No expiry recorded' },
  { label: 'Issued', value: props.file.issued || '—' },
  { label: 'Uploaded', value: props.file.uploaded || '—' },
  { label: 'Version', value: props.file.version != null ? String(props.file.version) : '—' },
])

const needsRenewal = computed(() => props.file.statusTone === 'warning' || props.file.statusTone === 'danger')

/**
 * Both requests reach the landlord/landlady as a notification. Admins may write
 * to another user's feed (`notifications_insert_admin`), the same path the
 * verification decisions already use.
 */
async function notifyLandlord(kind: 'renew' | 'reupload') {
  if (!props.landlordId) {
    notify.warning('No landlord/landlady on file to notify.')
    return
  }
  sending.value = true
  const renew = kind === 'renew'
  const { error } = await supabase.from('notifications').insert({
    user_id: props.landlordId,
    type: 'system',
    title: renew ? `Renew your ${props.file.name}` : `Upload your ${props.file.name} again`,
    body: renew
      ? `OSAS: the ${props.file.name} for ${props.accommodationName} needs renewing (${props.file.expiry || 'no expiry recorded'}). Please upload the renewed permit.`
      : `OSAS asks you to upload the ${props.file.name} for ${props.accommodationName} again.`,
  } as never)
  sending.value = false
  if (error) notify.error('Could not notify the landlord/landlady', error.message)
  else notify.success(renew ? 'Renewal reminder sent.' : 'Re-upload requested.')
}

function download() {
  if (signedUrl.value) window.open(signedUrl.value, '_blank', 'noopener')
}
</script>

<style scoped>
.pv {
  outline: none;
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(20, 20, 19, 0.72);
}
.pv-card {
  display: flex;
  width: 820px;
  max-width: calc(100% - 32px);
  height: 580px;
  max-height: calc(100% - 32px);
  overflow: hidden;
  border-radius: 14px;
  background: var(--ar-surface);
  box-shadow: 0 24px 60px rgba(20, 20, 19, 0.3);
}
.pv-doc { display: flex; flex: 1; flex-direction: column; min-width: 0; background: var(--ar-soft); }
.pv-doc :deep(.rv-doc) { flex: 1; min-height: 0; }
.pv-wait { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
.pv-err { padding: 24px; color: var(--ar-muted); font-size: 12.5px; text-align: center; }
.pv-side { display: flex; flex-direction: column; gap: 14px; width: 300px; flex-shrink: 0; padding: 22px 22px 20px; box-sizing: border-box; }
.pv-head { display: flex; align-items: flex-start; gap: 10px; }
.pv-title { flex: 1; min-width: 0; color: var(--ar-ink); font-size: 16px; font-weight: 700; line-height: 1.3; }
.pv-close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--ar-border);
  border-radius: 50%;
  background: var(--ar-surface);
  color: var(--ar-text);
  cursor: pointer;
}
.pv-pill { align-self: flex-start; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.pv-pill--success { background: color-mix(in srgb, var(--c-success) 14%, var(--ar-surface)); color: var(--c-success); }
.pv-pill--warning { background: color-mix(in srgb, var(--c-warning) 15%, var(--ar-surface)); color: var(--c-warning); }
.pv-pill--danger { background: color-mix(in srgb, var(--c-danger) 13%, var(--ar-surface)); color: var(--c-danger); }
.pv-pill--neutral,
.pv-pill--primary,
.pv-pill--info { background: var(--ar-soft); color: var(--ar-text); }
.pv-rows { display: flex; flex-direction: column; border-top: 1px solid var(--ar-border); }
.pv-row { display: flex; flex-direction: column; gap: 2px; padding: 9px 0; border-bottom: 1px solid var(--ar-border); }
.pv-lbl { color: var(--ar-muted); font-size: 11px; }
.pv-val { color: var(--ar-ink); font-size: 13px; font-weight: 500; }
.pv-actions { display: flex; flex-direction: column; gap: 8px; margin-top: auto; }
.pv-btn {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--ar-border);
  border-radius: 8px;
  background: var(--ar-surface);
  color: var(--ar-ink);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.pv-btn:disabled { opacity: 0.55; cursor: default; }
.pv-btn--accent { border-color: var(--ar-accent-line); color: var(--ar-accent); }
.pv-btn--solid { border-color: var(--ar-ink); background: var(--ar-ink); color: var(--ar-surface); }
</style>
