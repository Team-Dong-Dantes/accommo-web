<template>
  <section class="usr-card">
    <div class="usr-card-label">{{ title }}</div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps({
  title: { type: String, required: true },
})
</script>

<style scoped>
.usr-card {
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.usr-card-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--c-muted);
  margin-bottom: 6px;
}
</style>
