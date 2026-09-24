<template>
  <div role="menu" :aria-label="grouped ? 'Account actions' : 'Accommodation actions'" class="am">
    <template v-for="(a, i) in actions" :key="a.action">
      <!-- A person's record groups its actions under headings; an
           accommodation's keeps the single rule after Export. -->
      <div v-if="grouped && a.group !== actions[i - 1]?.group" class="am-group" :class="{ 'am-group--rule': i > 0 }">{{ a.group }}</div>
      <div v-else-if="!grouped && a.action === dividerBefore" class="am-rule"></div>
      <button
        type="button"
        role="menuitem"
        class="am-item"
        :class="{ 'am-item--danger': a.danger }"
        @click="$emit('pick', a.action)"
      >
        <Icon :icon="a.icon ?? ICONS[a.action] ?? 'lucide:circle'" width="15" height="15" />{{ a.label }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{ actions: { label: string; action: string; danger?: boolean; icon?: string; group?: string }[] }>()
defineEmits<{ (e: 'pick', action: string): void }>()

const ICONS: Record<string, string> = {
  export: 'lucide:file-chart-column',
  hide: 'lucide:eye-off',
  unhide: 'lucide:eye',
  suspend: 'lucide:ban',
  restore: 'lucide:rotate-ccw',
}

const grouped = computed(() => props.actions.some((a) => a.group))

/** Export is housekeeping; everything after it changes what students see, so a rule separates them. */
const dividerBefore = computed(() => props.actions.find((a) => a.action !== 'export')?.action)
</script>
<style scoped>
.am {
  position: absolute;
  top: 50px;
  right: 20px;
  z-index: 41;
  display: flex;
  flex-direction: column;
  width: 240px;
  padding: 6px;
  border: 1px solid var(--ar-border);
  border-radius: 12px;
  background: var(--ar-surface);
  box-shadow: 0 12px 32px rgba(20, 20, 19, 0.16);
  box-sizing: border-box;
}
.am-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--ar-ink);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.am-item :deep(svg) { color: var(--ar-text); }
.am-item:hover { background: var(--ar-soft); }
.am-item--danger { color: var(--c-danger); font-weight: 600; }
.am-item--danger :deep(svg) { color: var(--c-danger); }
.am-rule { height: 1px; margin: 6px 4px; background: var(--ar-border); }
.am-group { padding: 6px 10px 4px; color: var(--ar-muted); font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.am-group--rule { margin-top: 6px; padding-top: 10px; border-top: 1px solid var(--ar-border); }
</style>
