<template>
  <div class="page-head" :class="{ 'page-head--bar': variant === 'bar' }">
    <div class="page-head-top">
      <div class="page-head-lead">
        <div v-if="eyebrow" class="text-caption text-muted q-mb-xs uptag">{{ eyebrow }}</div>
        <h1 class="page-title">{{ resolvedTitle }}</h1>
        <p v-if="resolvedSubtitle" class="page-sub text-muted">{{ resolvedSubtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="page-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  variant: { type: String as () => 'page' | 'bar', default: 'page' },
})

const route = useRoute()
const resolvedTitle = computed(
  () => props.title || (route.meta.title as string | undefined) || 'Accommo',
)
const resolvedSubtitle = computed(
  () => props.subtitle || (route.meta.subtitle as string | undefined) || '',
)
</script>

<style scoped>
.page-head {
  margin-bottom: var(--sp-4);
}
.page-head-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
  flex-wrap: wrap;
}
.page-title {
  font-family: var(--font-display);
  font-size: var(--fs-h1);
  font-weight: 700;
  color: var(--c-ink);
  margin: 0;
  line-height: 1.15;
}
.page-sub {
  font-size: var(--fs-sm);
  margin: 4px 0 0;
  max-width: 720px;
}
.uptag {
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Compact, inline variant for the global app header bar */
.page-head--bar {
  margin-bottom: 0;
}
.page-head--bar .page-head-top {
  align-items: baseline;
}
.page-head--bar .page-title {
  font-size: var(--fs-h2);
}
.page-head--bar .page-sub {
  margin: 0 0 0 10px;
  display: inline;
}
</style>
