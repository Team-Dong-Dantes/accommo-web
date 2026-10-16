<template>
  <section class="tw-sec">
    <h3 class="tw-sec-head">
      <Icon icon="lucide:history" width="15" height="15" />
      {{ roundTitle }}
    </h3>
    <p v-if="round.live" class="tw-round-line">
      Still listed for students while you decide{{ round.expiresAt ? ' · accredited until ' + stamp(round.expiresAt) : '' }}.
    </p>
    <div v-if="round.message" class="tw-quote">
      <b>{{ round.kind === 'appeal' ? 'Their appeal' : 'Their note' }}</b>
      <span>{{ round.message }}</span>
    </div>
    <dl v-if="changeRows.length" class="tw-facts">
      <div v-for="row in changeRows" :key="row.label" class="is-block">
        <dt>{{ row.label }}</dt>
        <dd class="tw-change"><s>{{ row.from || 'Not set' }}</s> → {{ row.to }}</dd>
      </div>
    </dl>
    <div v-if="round.previous" class="tw-prev">
      <span class="tw-prev-head">
        Last decision: <b>{{ PREVIOUS_LABEL[round.previous.decision] }}</b> · {{ stamp(round.previous.decidedAt) }}
      </span>
      <span v-if="round.previous.flaggedDocs.length" class="tw-prev-line">
        Flagged: {{ round.previous.flaggedDocs.map(permitName).join(', ') }}
      </span>
      <span v-if="round.previous.tags.length" class="tw-prev-line">{{ round.previous.tags.join(' · ') }}</span>
      <span v-if="round.previous.note" class="tw-prev-line">“{{ round.previous.note }}”</span>
    </div>
  </section>
</template>

<script setup lang="ts">
// What this request is asking for, and what OSAS said last time. A
// resubmission is judged against the previous decision, an appeal against its
// own message, a change against the values it would replace.
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { PREVIOUS_LABEL, changeRowsOf, permitName, roundTitleOf, stamp } from '@/features/verifications/reviewInfo'
import type { RoundInfo } from '@/features/verifications/queue'

const props = defineProps<{ round: RoundInfo; request: Record<string, any> | null }>()

const roundTitle = computed(() => roundTitleOf(props.round))
const changeRows = computed(() => changeRowsOf(props.request, props.round))
</script>

<style scoped src="./reviewRail.css"></style>

<style scoped>
/* ── the round: what is asked, and what was said last time ── */
.tw-round-line { margin: 0; padding: 0 14px 6px; color: var(--c-muted); font-size: 12px; }
.tw-quote {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 4px 14px 8px;
  padding: 8px 10px;
  border-left: 3px solid var(--c-primary);
  border-radius: 0 8px 8px 0;
  background: var(--c-surface-2);
  font-size: 12.5px;
}
.tw-quote b { color: var(--c-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
.tw-change s { color: var(--c-muted); font-weight: 500; }
.tw-prev {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 4px 14px 8px;
  padding: 8px 10px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  font-size: 12px;
}
.tw-prev-head { color: var(--c-ink); }
.tw-prev-line { color: var(--c-muted); }
</style>
