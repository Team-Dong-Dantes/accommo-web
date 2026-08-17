<template>
  <div class="usr-stats">
    <slot />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.usr-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
</style>
