<template>
  <div :class="`pill bg-${bg} text-${textColor}`">
    <Icon v-if="icon" :icon="icon" width="14" height="14" class="q-mr-xs" />
    {{ label }}
  </div>
</template>

<script setup lang="ts">
defineProps({
  bg: { type: String, required: true },
  textColor: { type: String, required: true },
  icon: { type: String, default: '' },
  label: { type: String, required: true }
})
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
