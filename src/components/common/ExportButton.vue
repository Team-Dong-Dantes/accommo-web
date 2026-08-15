<template>
  <q-btn color="teal-7" class="text-weight-bold rounded-button" no-caps @click="$emit('export')">
    <Icon icon="mdi:download" class="on-left" width="18" height="18" />Export
  </q-btn>
</template>

<script setup lang="ts">
defineEmits(['export'])
</script>

<style scoped>
.rounded-button {
  border-radius: 10px;
  height: 40px;
  padding: 0 16px;
}
</style>
