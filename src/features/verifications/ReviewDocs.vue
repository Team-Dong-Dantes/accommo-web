<template>
  <section class="tw-sec">
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
          :class="{ 'is-active': active === i }"
          :aria-current="active === i ? 'true' : undefined"
          :title="f.name"
          @click="emit('show', i)"
        >
          <Icon :icon="fileIcon(f.name)" width="15" height="15" />
          <span class="tw-doc-text">
            <span class="tw-doc-name">{{ f.name }}</span>
            <span v-if="isAccommodation" class="tw-doc-meta" :class="{ 'is-bad': expiryTone(f) === 'bad' }">
              {{ expiryText(f) }}<template v-if="(f.version ?? 1) > 1"> · v{{ f.version }}</template>
            </span>
          </span>
          <span v-if="f.replaced" class="tw-chip is-pass">Replaced</span>
          <Icon
            :icon="active === i ? 'lucide:eye' : 'lucide:eye'"
            width="16"
            height="16"
            class="tw-doc-eye"
          />
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
// The switcher for the sheet beside the rail, so it sits at the top of the
// rail rather than under the record it is not part of.
import { Icon } from '@iconify/vue'
import { fileIcon } from '@/features/verifications/fileUtils'
import { expiryText, expiryTone } from '@/features/verifications/reviewInfo'

defineProps<{
  files: any[]
  isAccommodation: boolean
  /** The document the sheet is showing, or null while it shows the map. */
  active: number | null
}>()
const emit = defineEmits<{ show: [index: number] }>()
</script>

<style scoped src="./reviewRail.css"></style>

<style scoped>
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
.tw-doc-text { display: flex; flex: 1; min-width: 0; flex-direction: column; }
.tw-doc-meta { color: var(--c-muted); font-size: 11px; }
.tw-doc-meta.is-bad { color: var(--c-danger); font-weight: 700; }
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
</style>
