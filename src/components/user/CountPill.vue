<template>
  <div class="count-pill">
    {{ count }} {{ label }}
  </div>
</template>

<script setup lang="ts">
defineProps({
  count: { type: Number, required: true },
  label: { type: String, default: 'items' }
})
</script>

<style scoped>
.count-pill {
  border: 1px solid var(--c-border-strong);
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 13px;
  color: var(--c-muted);
  background-color: white;
  font-weight: 600;
  white-space: nowrap;
}
</style>
