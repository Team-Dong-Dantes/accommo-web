<template>
  <span :class="classes">
    <Icon v-if="resolvedIcon" :icon="resolvedIcon" width="14" height="14" class="q-mr-xs" />
    {{ resolvedLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getStatus, type StatusTone } from '@/utils/status.config'

const props = defineProps({
  bg: { type: String, default: '' },
  textColor: { type: String, default: '' },
  tone: { type: String as () => StatusTone, default: '' },
  status: { type: String, default: '' },
  icon: { type: String, default: '' },
  label: { type: String, default: '' }
})

const resolved = computed(() => {
  if (props.tone || props.status) {
    const def = props.status ? getStatus(props.status) : null
    const tone = (props.tone || def?.tone || 'neutral') as StatusTone
    return {
      cls: [`bg-${tone}-soft`, `text-${tone}`],
      icon: props.icon || def?.icon || '',
      label: props.label || def?.label || props.status || ''
    }
  }
  return {
    cls: [`bg-${props.bg}`, `text-${props.textColor}`],
    icon: props.icon,
    label: props.label
  }
})

const classes = computed(() => ['pill', ...resolved.value.cls])
const resolvedIcon = computed(() => resolved.value.icon)
const resolvedLabel = computed(() => resolved.value.label)
</script>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
</style>
