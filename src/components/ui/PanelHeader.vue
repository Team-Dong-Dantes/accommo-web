<template>
  <div class="panel-head" :class="{ 'panel-head--compact': compact }">
    <div class="row items-center no-wrap panel-head-top">
      <div v-if="icon" class="panel-head-ico">
        <Icon :icon="icon" :width="15" :height="15" />
      </div>
      <span class="panel-head-title text-weight-bold" :class="titleClass || 'text-ink'">{{ title }}</span>
      <slot name="actions" class="panel-head-actions" />
    </div>
    <span v-if="subtitle" class="panel-sub" :class="{ 'panel-sub--indent': icon }">{{ subtitle }}</span>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  icon: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  titleClass: { type: String, default: '' },
})
</script>

<style scoped>
.panel-head {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: var(--sp-2);
  flex: none;
}
.panel-head--compact {
  margin-bottom: 6px;
}
.panel-head-top {
  font-size: 14px;
  gap: 8px;
}
.panel-head-ico {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.panel-head-actions {
  margin-left: auto;
}
.panel-sub {
  font-size: 11.5px;
  color: var(--c-muted);
  font-weight: 500;
}
.panel-sub--indent {
  padding-left: 36px;
}
</style>
