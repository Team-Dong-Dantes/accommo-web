<template>
  <q-input
    outlined
    dense
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :placeholder="placeholder"
    class="bg-white rounded-input"
    style="width: 300px;"
  >
    <template v-slot:prepend>
      <Icon icon="mdi:magnify" width="20" height="20" color="#757575" />
    </template>
  </q-input>
</template>

<script setup lang="ts">
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search...' }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.rounded-input :deep(.q-field__control) {
  border-radius: 12px;
}
</style>
