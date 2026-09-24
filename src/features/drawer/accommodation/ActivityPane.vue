<template>
  <div v-if="preview.activity?.length" class="ac">
    <div v-for="(a, i) in preview.activity" :key="i" class="ac-item">
      <div class="ac-rail">
        <span class="ac-icon" :style="activityIconStyle(a)"><Icon :icon="a.icon || 'lucide:circle'" width="14" height="14" /></span>
        <span v-if="i < preview.activity.length - 1" class="ac-line"></span>
      </div>
      <div class="ac-body" :class="{ 'ac-body--last': i === preview.activity.length - 1 }">
        <!-- Built from the audit trail with every spliced value escaped (see PropertyHub). -->
        <div class="ac-text" v-html="a.text"></div>
        <div v-if="a.time" class="ac-time">{{ a.time }}</div>
      </div>
    </div>
  </div>
  <TabEmptyState v-else icon="lucide:history" title="No activity" message="Nothing has happened here yet that we keep a record of." />
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import TabEmptyState from '../TabEmptyState.vue'
import { activityIconStyle, type DrawerPreview } from '../preview'

defineProps<{ preview: DrawerPreview }>()
</script>

<style scoped>
.ac { display: flex; flex-direction: column; }
.ac-item { display: flex; gap: 12px; }
.ac-rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 28px; }
.ac-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 50%;
}
.ac-line { flex: 1; width: 1px; margin-top: 4px; background: var(--ar-border); }
.ac-body { padding: 4px 0 18px; min-width: 0; }
.ac-body--last { padding-bottom: 0; }
.ac-text { color: var(--ar-ink); font-size: 13px; }
.ac-text :deep(strong) { font-weight: 700; }
.ac-time { margin-top: 3px; color: var(--ar-muted); font-size: 11px; }
</style>
