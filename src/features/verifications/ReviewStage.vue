<template>
    <div class="tw-stage">
      <article v-if="view === 'map'" class="tw-sheet">
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
  
      <article v-else-if="file" class="tw-sheet">
        <header class="tw-sheet-head">
          <Icon :icon="fileIcon(file.name)" width="15" height="15" />
          <span class="tw-sheet-name">{{ file.name }}</span>
        </header>
        <DocumentViewer
          :files="[file]"
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
</template>

<script setup lang="ts">
// The sheet beside the rail: the open document, or the property on the map.
import { Icon } from '@iconify/vue'
import DocumentViewer from '@/features/verifications/DocumentViewer.vue'
import PropertyMap from '@/features/verifications/PropertyMap.vue'
import { fileIcon } from '@/features/verifications/fileUtils'

defineProps<{
  request: Record<string, any> | null
  view: 'doc' | 'map'
  file: any
  activeDoc: number
  isAccommodation: boolean
}>()
</script>

<style scoped src="./reviewRail.css"></style>

<style scoped>
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
@media (max-width: 900px) {
  .tw-stage { padding: 12px; }
}
</style>
