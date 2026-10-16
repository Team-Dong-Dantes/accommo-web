<template>
  <section class="tw-sec">
    <h3 class="tw-sec-head">
      <Icon :icon="group.icon" width="15" height="15" />
      {{ group.title }}
      <button
        v-if="group.view"
        type="button"
        class="tw-sec-eye"
        :class="{ 'is-active': open }"
        :aria-current="open ? 'true' : undefined"
        :title="open ? 'Showing the map' : 'Show on the map'"
        @click="emit('show')"
      >
        <Icon :icon="open ? 'lucide:eye' : 'lucide:eye'" width="16" height="16" />
      </button>
    </h3>
    <dl class="tw-facts">
      <div v-for="row in group.rows" :key="row.label" :class="{ 'is-block': row.block }">
        <dt>{{ row.label }}</dt>
        <dd :class="{ 'is-empty': !row.value }" :title="row.value">{{ row.value || 'Not set' }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
// One group of facts in the review rail, with an eye on its heading when the
// group has something to show on the sheet.
import { Icon } from '@iconify/vue'
import type { InfoGroup } from '@/features/verifications/reviewInfo'

defineProps<{ group: InfoGroup; open: boolean }>()
const emit = defineEmits<{ show: [] }>()
</script>

<style scoped src="./reviewRail.css"></style>

<style scoped>
/* On the heading, at the far right, where the document count sits on its own
   section — the map belongs to the whole group, not to one line of it. */
.tw-sec-eye {
  display: inline-flex;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
  opacity: 0.5;
}
.tw-sec-eye:hover { opacity: 1; }
.tw-sec-eye.is-active { opacity: 1; color: var(--c-ink); }
</style>
