<template>
  <!-- The one card every dashboard panel wears, after accommo-mobile's detail
       card: a single bordered surface with no padding of its own, a header
       strip, hairline-separated sections, and an optional one-line footer. -->
  <section class="dc" :aria-labelledby="titleId">
    <header class="dc-head">
      <span class="dc-icon" :class="`is-${tone}`" aria-hidden="true">
        <Icon :icon="icon" width="16" height="16" />
      </span>
      <div class="dc-titles">
        <h2 :id="titleId">{{ title }}</h2>
        <p v-if="summary" :title="summary">{{ summary }}</p>
      </div>
      <slot name="actions">
        <router-link v-if="link" :to="link.to" class="dc-link">
          {{ link.label }}
          <Icon icon="lucide:chevron-right" width="14" height="14" aria-hidden="true" />
        </router-link>
      </slot>
    </header>

    <div class="dc-body">
      <slot />
    </div>

    <p v-if="$slots.foot" class="dc-foot">
      <slot name="foot" />
    </p>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { Icon } from '@iconify/vue'

withDefaults(
  defineProps<{
    icon: string
    title: string
    summary?: string
    link?: { to: string; label: string }
    /** Tints the icon chip: `work` for the queues OSAS acts on, `context` for the figures that describe the term. */
    tone?: 'work' | 'context'
  }>(),
  { summary: '', tone: 'context' },
)

const titleId = useId()
</script>

<style scoped>
.dc {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-surface);
  overflow: hidden;
}

.dc-head {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--c-border);
}
.dc-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: calc(3.5 * var(--ut));
  height: calc(3.5 * var(--ut));
  border-radius: var(--radius-sm);
}
.dc-icon.is-work { background: var(--c-primary-soft); color: var(--c-primary); }
.dc-icon.is-context { background: var(--c-surface-2); color: var(--c-muted); }

.dc-titles { flex: 1; min-width: 0; }
.dc-titles h2 {
  margin: 0;
  color: var(--c-ink);
  font-family: var(--font-display);
  font-size: calc(1.875 * var(--ut));
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.dc-titles p {
  margin: 1px 0 0;
  overflow: hidden;
  color: var(--c-muted);
  font-size: var(--fs-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dc-link {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 2px;
  color: var(--c-primary);
  font-size: var(--fs-xs);
  font-weight: 700;
  text-decoration: none;
}
.dc-link:hover { text-decoration: underline; }
.dc-link:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; border-radius: 4px; }

.dc-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.dc-foot {
  margin: 0;
  padding: var(--sp-2) var(--sp-4);
  border-top: 1px solid var(--c-border);
  background: var(--c-surface-2);
  color: var(--c-text);
  font-size: var(--fs-xs);
}
.dc-foot :deep(b) { color: var(--c-ink); }

/* ── Shared body parts, used by every panel through :deep so the six cards
   keep one type scale and one rhythm. ── */

/* A section: padded block separated from the next by a full-bleed hairline.
   `.dc-fill` is the one section per card that takes the leftover height. */
.dc-body :deep(.dc-sec) { padding: var(--sp-3) var(--sp-4); }
.dc-body :deep(.dc-sec + .dc-sec),
.dc-body :deep(.dc-sec + .dc-rows),
.dc-body :deep(.dc-rows + .dc-sec) { border-top: 1px solid var(--c-border); }
.dc-body :deep(.dc-fill) { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dc-body :deep(.dc-label) { margin: 0 0 var(--sp-2); color: var(--c-muted); font-size: var(--fs-xs); font-weight: 600; }

/* Edge-to-edge rows, mobile's ProfileField: label left, value right. */
.dc-body :deep(.dc-rows) { margin: 0; padding: 0; list-style: none; }
.dc-body :deep(.dc-row) {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  min-height: calc(4.25 * var(--ut));
  padding: 0 var(--sp-4);
  border-top: 1px solid var(--c-border);
  font-size: var(--fs-xs);
}
.dc-body :deep(.dc-row:first-child) { border-top: 0; }
.dc-body :deep(.dc-row-main) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--c-ink);
  font-size: calc(1.625 * var(--ut));
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dc-body :deep(.dc-row-meta) { flex: none; color: var(--c-muted); font-variant-numeric: tabular-nums; }
.dc-body :deep(.dc-row-meta.is-late) { color: var(--c-warning); font-weight: 700; }
.dc-body :deep(.dc-row-act) {
  flex: none;
  color: var(--c-primary);
  font-weight: 700;
  text-decoration: none;
}
.dc-body :deep(.dc-row-act:hover) { text-decoration: underline; }
.dc-body :deep(.dc-row-act:focus-visible) { outline: 2px solid var(--c-primary); outline-offset: 2px; border-radius: 4px; }

/* A proportional band: segments sized by count, each naming itself. */
.dc-body :deep(.dc-band) {
  display: flex;
  gap: 3px;
  height: calc(3.5 * var(--ut));
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.dc-body :deep(.dc-band > span) {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 0 var(--sp-2);
  overflow: hidden;
  background: var(--c-surface-2);
  color: var(--c-text);
  font-size: var(--fs-xs);
  white-space: nowrap;
}
.dc-body :deep(.dc-band b) { color: var(--c-ink); font-variant-numeric: tabular-nums; }
.dc-body :deep(.dc-band em) { overflow: hidden; font-style: normal; text-overflow: ellipsis; }
.dc-body :deep(.dc-band .is-good) { background: var(--c-primary-soft); }
.dc-body :deep(.dc-band .is-good b) { color: var(--c-primary); }
.dc-body :deep(.dc-band .is-late) { background: var(--c-warning-soft); }
.dc-body :deep(.dc-band .is-late b) { color: var(--c-warning); }

.dc-body :deep(.dc-empty) {
  display: grid;
  flex: 1;
  place-items: center;
  margin: 0;
  padding: var(--sp-4);
  color: var(--c-muted);
  font-size: var(--fs-xs);
  text-align: center;
}
</style>
