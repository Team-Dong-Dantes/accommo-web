<template>
  <!-- accommo-mobile's EmptyState in its compact variant, which is what its own
       tab panels use: a grey disc, a short title, one line of explanation. The
       drawer's tabs each had their own dashed one-line box instead. -->
  <section class="tes" aria-live="polite" role="status">
    <span class="tes-icon" aria-hidden="true">
      <Icon :icon="icon" width="22" height="22" />
    </span>
    <p class="tes-title">{{ title }}</p>
    <p v-if="message" class="tes-text">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

withDefaults(
  defineProps<{ icon?: string; title: string; message?: string }>(),
  { icon: 'lucide:inbox', message: '' },
)
</script>

<style scoped>
.tes {
  display: flex;
  flex: 1 1 auto;
  min-height: 200px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 28px 16px;
  text-align: center;
}
/* Deliberately grey rather than the brand tint: an empty tab is a neutral
   state, not something to draw the eye. */
.tes-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  margin-bottom: 4px;
  border-radius: 999px;
  background: var(--c-border);
  color: var(--c-muted);
}
.tes-title {
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: 14.5px;
  font-weight: 700;
}
.tes-text {
  max-width: 280px;
  margin: 0;
  color: var(--c-muted);
  font-size: 12.5px;
  line-height: 1.45;
}
</style>
