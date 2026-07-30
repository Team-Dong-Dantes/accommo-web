<template>
  <div class="row items-center no-wrap">

    <q-avatar size="48px" :color="avatarColor" text-color="white" class="text-weight-bold q-mr-md" style="font-size: 30px">
      {{ initials }}
    </q-avatar>

    <div class="column justify-center">
      <div class="text-weight-bold text-dark" style="font-size: 15px; line-height: 1.2">{{ name }}</div>
      <div class="text-grey-5 q-mt-xs" style="font-size: 12px">{{ email }}</div>
    </div>

  </div>
</template>

<script setup lang="ts">
defineProps({
  initials: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatarColor: { type: String, default: 'grey-5' }
})
</script>
