<template>
  <div v-if="preview.files?.length" class="dd-files">
    <!-- A row opens the document in the viewer rather than navigating away.
         `DocumentViewer` is the same panel the Verifications page reviews with,
         so images zoom and rotate in place instead of becoming a browser tab. -->
    <button
      v-for="(f, i) in preview.files"
      :key="i"
      type="button"
      class="dd-file"
      @click="open(i)"
    >
      <span class="dd-file-iconwrap">
        <Icon :icon="fileIcon(f.filename || f.name)" width="22" height="22" />
      </span>
      <span class="col min-width-0 text-left">
        <span class="dd-file-name">{{ f.name }}</span>
        <span class="dd-file-meta">Open in viewer</span>
      </span>
      <span class="dd-file-eye" aria-hidden="true">
        <Icon icon="lucide:eye" width="18" height="18" />
      </span>
    </button>
  </div>
  <TabEmptyState v-else icon="lucide:file-text" title="No documents" message="Nothing has been uploaded for this account yet." />

  <!-- The X is the only way out: a stray click outside or a reflexive Esc
       should not throw away the document being reviewed. -->
  <q-dialog v-model="viewerOpen" persistent no-esc-dismiss no-backdrop-dismiss>
    <q-card class="dd-viewer-card">
      <header class="dd-viewer-head">
        <h2 class="dd-viewer-title">Documents</h2>
        <q-btn v-close-popup flat dense round aria-label="Close viewer">
          <Icon icon="lucide:x" width="20" height="20" />
        </q-btn>
      </header>
      <div v-if="signing" class="dd-viewer-wait column flex-center">
        <q-spinner-dots color="primary" size="42px" />
        <div class="text-muted text-caption q-mt-sm">Preparing document…</div>
      </div>
      <div v-else-if="signError" class="dd-viewer-wait column flex-center text-center q-pa-lg">
        <Icon icon="lucide:file-warning" width="52" height="52" color="var(--c-border-strong)" />
        <div class="text-ink text-weight-bold q-mt-sm">Document unavailable</div>
        <div class="text-muted text-caption q-mt-xs" style="max-width: 44ch">{{ signError }}</div>
      </div>
      <DocumentViewer
        v-else
        v-model:index="viewerIndex"
        :files="signedFiles"
        empty-caption="Nothing has been uploaded for this account yet."
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { signDocUrl } from '@/utils/docUrl'
import TabEmptyState from './TabEmptyState.vue'
import DocumentViewer from '@/features/verifications/DocumentViewer.vue'
import { fileIcon } from '@/features/verifications/fileUtils'
import { Icon } from '@iconify/vue'
import type { DrawerPreview } from './preview'

const props = defineProps<{ preview: DrawerPreview }>()

const viewerOpen = ref(false)
const viewerIndex = ref(0)
const signing = ref(false)
const signedFiles = ref<{ name: string; url: string }[]>([])
const signError = ref('')

/**
 * Documents are stored as `cld:` references under Cloudinary's authenticated
 * delivery — a browser cannot open one. They are signed on open rather than when
 * the drawer loads, because the signature is short-lived and most drawers are
 * never opened on this tab. A reference that cannot be signed is passed through
 * so the viewer shows its own error instead of a blank tab.
 */
async function open(index: number) {
  const files = props.preview.files ?? []
  viewerIndex.value = index
  viewerOpen.value = true
  signing.value = true
  signError.value = ''
  try {
    const signed = await Promise.all(
      files.map(async (f) => {
        if (!f.docId || !f.docTable) return { name: f.name, url: f.url, error: null as string | null }
        const result = await signDocUrl(f.docTable, f.docId)
        return { name: f.name, url: result.url || f.url, error: result.error }
      }),
    )
    signedFiles.value = signed.map(({ name, url }) => ({ name, url }))
    signError.value = signed[index]?.error ?? ''
  } finally {
    signing.value = false
  }
}
</script>

<style scoped>
/* The list had no gap, so the documents sat flush against each other. */
.dd-files {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dd-file {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-surface-2);
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  text-decoration: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.dd-file:hover {
  border-color: var(--c-primary);
  background: var(--c-surface);
}
.dd-file:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}
.dd-file-iconwrap {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  color: var(--c-primary);
}
.dd-file-name {
  display: block;
  font-weight: 700;
  font-size: 14px;
  color: var(--c-ink);
  line-height: 1.2;
}
.dd-file-meta {
  display: block;
  font-size: 12px;
  color: var(--c-muted);
  margin-top: 2px;
}
.dd-file-eye {
  display: grid;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  margin-left: auto;
  place-items: center;
  border-radius: 999px;
  color: var(--c-muted);
  transition: background 0.15s ease, color 0.15s ease;
}
.dd-file:hover .dd-file-eye {
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  color: var(--c-primary);
}

.dd-viewer-card {
  display: flex;
  width: 92vw;
  max-width: 900px;
  height: 86vh;
  flex-direction: column;
  background: var(--c-surface);
}
.dd-viewer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 10px 10px 16px;
  border-bottom: 1px solid var(--c-border);
}
.dd-viewer-title {
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
}
.dd-viewer-wait {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
}
.dd-viewer-card :deep(.rv-doc) {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
