<template>
  <q-input v-model="model" borderless hide-bottom-space color="primary" class="auth-input" v-bind="$attrs">
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

/* Glass: the field is a pane the campus photograph shows through, so it is a
   light tint over a blur rather than a filled box. Was dark slate with a neon
   mint focus ring — the only surface in the product wearing that palette. */
.auth-input :deep(.q-field__control) {
  min-height: 48px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  padding: 0 14px;
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
  backdrop-filter: blur(10px) saturate(1.2);
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.auth-input :deep(.q-field__control:hover) {
  background: rgba(255, 255, 255, 0.17);
  border-color: rgba(255, 255, 255, 0.4);
}

.auth-input :deep(.q-field--focused .q-field__control) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.14);
}

/* Light coral rather than the token --c-danger, which is tuned for dark text on
   a pale surface and disappears against the photograph. */
.auth-input :deep(.q-field--error .q-field__control) {
  border-color: #FFB4A2;
}
.auth-input :deep(.q-field__messages) {
  color: #FFC9BA;
}

.auth-input :deep(.q-field__native),
.auth-input :deep(.q-field__input) {
  color: #ffffff;
  font-size: 15px;
}
/* Chrome paints autofilled fields an opaque yellow, which would punch a solid
   block through the glass. */
.auth-input :deep(input:-webkit-autofill) {
  -webkit-text-fill-color: #ffffff;
  -webkit-box-shadow: 0 0 0 1000px rgba(12, 48, 42, 0.92) inset;
  caret-color: #ffffff;
}

.auth-input :deep(.q-field__prepend),
.auth-input :deep(.q-field__append) {
  color: rgba(255, 255, 255, 0.6);
}

.auth-input :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}
</style>
