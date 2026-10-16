<template>
  <ol
    class="step-list"
    :style="{ '--step-progress': `${((step - 1) / (steps.length - 1)) * 100}%` }"
    aria-label="Form steps"
  >
    <li
      v-for="(item, index) in steps"
      :key="item.label"
      class="step-item"
      :class="{ 'is-current': step === index + 1, 'is-complete': step > index + 1 }"
      :aria-current="step === index + 1 ? 'step' : undefined"
    >
      <span class="step-marker" aria-hidden="true">
        <Icon v-if="step > index + 1" icon="lucide:check" width="15" height="15" />
        <span v-else>{{ index + 1 }}</span>
      </span>
      <span class="step-copy">
        <span class="step-label">{{ item.label }}</span>
      </span>
    </li>
  </ol>
</template>

<script setup lang="ts">
// The composer's step tracker: done steps get a check, the line fills to the
// current one.
import { Icon } from '@iconify/vue'
import type { FormStep } from './composer'

defineProps<{ steps: FormStep[]; step: number }>()
</script>

<style scoped>
.step-list {
  display: grid;
  gap: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  list-style: none;
  padding: 0;
  position: relative;
}
.step-list::before {
  background: linear-gradient(
    to right,
    var(--c-primary) 0 var(--step-progress),
    var(--c-border-strong) var(--step-progress) 100%
  );
  content: '';
  height: 2px;
  left: calc(100% / 6);
  position: absolute;
  right: calc(100% / 6);
  top: 15px;
  z-index: 0;
}
.step-item {
  align-items: center;
  color: var(--c-muted);
  display: flex;
  flex-direction: column;
  font-size: var(--fs-sm);
  font-weight: 600;
  gap: var(--sp-2);
  min-width: 0;
  position: relative;
  z-index: 1;
}
.step-marker {
  align-items: center;
  background: var(--c-surface);
  border: 2px solid var(--c-border-strong);
  border-radius: 50%;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: var(--fs-xs);
  font-weight: 750;
  height: 30px;
  justify-content: center;
  transition: background var(--t), border-color var(--t), box-shadow var(--t), color var(--t);
  width: 30px;
}
.step-copy {
  min-width: 0;
  text-align: center;
}
.step-label {
  color: var(--c-text);
  font-size: var(--fs-xs);
  font-weight: 650;
  line-height: 1.25;
}
.step-item.is-current {
  color: var(--c-primary-ink);
}
.step-item.is-current .step-marker,
.step-item.is-complete .step-marker {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: white;
}
.step-item.is-complete {
  color: var(--c-text);
}
.step-item.is-current .step-label {
  color: var(--c-primary-ink);
  font-weight: 750;
}
@media (max-width: 599px) {
  .step-list {
      gap: 0;
    }
  .step-label {
      font-size: 0.6875rem;
    }
  .step-list::before {
      left: calc(100% / 6);
      right: calc(100% / 6);
      top: 15px;
    }
}
</style>
