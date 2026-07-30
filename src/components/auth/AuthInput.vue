<template>
  <q-input v-model="model" borderless hide-bottom-space dark color="teal-4" class="auth-input" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </q-input>
</template>

<script setup lang="ts">
const model = defineModel<string | number | null>();
</script>

<style scoped>
.auth-input {
  border-radius: 10px;
  padding-bottom: 2px;
}

.auth-input :deep(.q-field__control) {
  min-height: 44px;
  background: #272d37;
  border-radius: 10px;
  border: 1px solid #353c47;
  padding: 0 14px;
  transition: all 0.3s ease;
}

.auth-input :deep(.q-field__control:hover) {
  border-color: #4b5563;
}

.auth-input :deep(.q-field--focused .q-field__control) {
  border-color: #12c299;
  background: #1e232b;
}

.auth-input :deep(.q-field__native),
.auth-input :deep(.q-field__input) {
  color: #ffffff;
  font-size: 14px;
}

.auth-input :deep(.q-field__label) {
  color: #7b8390;
  font-size: 14px;
}
</style>
