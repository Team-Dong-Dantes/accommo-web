<template>
  <div class="usr-empty text-muted">
    <Icon :icon="icon" width="15" height="15" class="q-mr-xs" />
    {{ message }}
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps({
  icon: { type: String, default: 'mdi:information-outline' },
  message: { type: String, required: true },
})
</script>

<style scoped>
.usr-empty {
  font-size: 13px;
  font-weight: 500;
  padding: 6px 0;
  display: flex;
  align-items: center;
}
</style>
