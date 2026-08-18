<template>
  <div class="row items-center no-wrap">

    <q-avatar :size="size" :color="avatarColor" text-color="white" class="text-weight-bold q-mr-md" :style="{ fontSize: fontSize }">
      {{ initials }}
    </q-avatar>

    <div class="column justify-center" style="min-width: 0;">
      <div class="text-weight-bold text-ink ellipsis" style="font-size: 15px; line-height: 1.2">{{ name }}</div>
      <div class="text-muted q-mt-xs ellipsis" style="font-size: 12px">{{ subtitle || email }}</div>
    </div>

  </div>
</template>

<script setup lang="ts">
defineProps({
  initials: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  avatarColor: { type: String, default: 'grey-5' },
  size: { type: String, default: '48px' },
  fontSize: { type: String, default: '18px' }
})
</script>
