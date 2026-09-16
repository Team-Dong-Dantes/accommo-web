<template>
  <div class="row items-center no-wrap">

    <q-avatar :color="avatarColor" text-color="white" class="text-weight-bold q-mr-md">
      <img v-if="avatarUrl && !broken" :src="avatarUrl" :alt="name" @error="broken = true" />
      <template v-else>{{ initials }}</template>
    </q-avatar>

    <div class="column justify-center" style="min-width: 0;">
      <div class="uic-name text-weight-bold text-ink ellipsis">{{ name }}</div>
      <div class="uic-sub text-muted q-mt-xs ellipsis">{{ subtitle || email }}</div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  initials: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  avatarColor: { type: String, default: 'grey-5' },
  /** A profile photo, when the person has one. Falls back to the initials. */
  avatarUrl: { type: String, default: '' }
})

// Avatars are third-party URLs (a Google account photo) that can disappear, and
// a q-table recycles this component across rows — so the failure has to reset
// when the row it belongs to changes, or one dead photo blanks every avatar
// that scrolls through the same cell.
const broken = ref(false)
watch(() => props.avatarUrl, () => { broken.value = false })
</script>

<style scoped>
/* Multiples of the fluid units in css/tokens.css: the commented pixel value is
   what these resolve to at 1440px and up. QAvatar takes its size from its own
   font-size, so that is what scales here; its inner content div carries the
   initials and is sized separately. */
.uic-name { font-size: calc(1.875 * var(--ut)); line-height: 1.2; }  /* 15px */
.uic-sub { font-size: calc(1.5 * var(--ut)); }                       /* 12px */
.q-avatar { font-size: calc(6 * var(--ut)); }                        /* 48px */
.q-avatar :deep(.q-avatar__content) { font-size: calc(2.25 * var(--ut)); }  /* 18px */
</style>
