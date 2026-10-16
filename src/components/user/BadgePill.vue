<template>
  <span :class="classes">
    <Icon v-if="resolvedIcon" :icon="resolvedIcon" width="14" height="14" class="q-mr-xs" />
    {{ resolvedLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getStatus, type StatusTone } from '@/utils/status.config'

const props = withDefaults(
  defineProps<{ bg?: string; textColor?: string; tone?: StatusTone | ''; status?: string; icon?: string; label?: string }>(),
  { bg: '', textColor: '', tone: '', status: '', icon: '', label: '' },
)

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
  /* A two-word state ("Needs Resubmission", "Under maintenance") stays one capsule. */
  white-space: nowrap;
}
/* In a tight cell the label shrank the icon to nothing before it clipped. */
.pill > svg { flex-shrink: 0; }
</style>
