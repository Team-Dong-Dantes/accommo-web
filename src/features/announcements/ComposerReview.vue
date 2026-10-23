<template>
  <dl class="review-list">
    <div class="review-row review-row-title">
      <dt>Title</dt>
      <dd>{{ form.title || 'Untitled' }}</dd>
    </div>
    <div class="review-row review-row-message">
      <dt>{{ kind === 'announcements' ? 'Message' : 'Policy content' }}</dt>
      <dd>{{ form.body || 'No content added' }}</dd>
    </div>
    <template v-if="kind === 'announcements'">
    <div class="review-row">
      <dt>Audience</dt>
      <dd>{{ audienceLabel(form.audience) }}</dd>
    </div>
    <div class="review-row">
      <dt>Expiry</dt>
      <dd>{{ form.expiresAt ? fmtDate(dateToIso(form.expiresAt)) : 'No expiry date' }}</dd>
    </div>
    <div v-if="form.summary.trim()" class="review-row">
      <dt>Summary</dt>
      <dd>{{ form.summary }}</dd>
    </div>
    <div v-if="form.details.eventAt" class="review-row">
      <dt>Event</dt>
      <dd>{{ formatDateTime(dateToIso(form.details.eventAt)!) }}{{ form.details.eventEnd ? ' – ' + formatDateTime(dateToIso(form.details.eventEnd)!) : '' }}</dd>
    </div>
    <div v-if="form.details.deadlineAt" class="review-row">
      <dt>Deadline</dt>
      <dd>{{ formatDateTime(dateToIso(form.details.deadlineAt)!) }}</dd>
    </div>
    <div v-if="form.details.location.trim()" class="review-row">
      <dt>Location</dt>
      <dd>{{ form.details.location }}</dd>
    </div>
    <div v-if="form.details.imageUrl" class="review-row">
      <dt>Poster</dt>
      <dd><img :src="form.details.imageUrl" alt="" class="review-poster" /></dd>
    </div>
    </template>
    <template v-else>
      <div class="review-row">
        <dt>Version</dt>
        <dd>{{ form.version.trim() || 'No version' }}</dd>
      </div>
      <div class="review-row">
        <dt>Effective date</dt>
        <dd>{{ form.effectiveDate ? fmtDate(dateToIso(form.effectiveDate)) : 'Not specified' }}</dd>
      </div>
    </template>
  </dl>
</template>

<script setup lang="ts">
// The last step's read-back of everything the composer will save.
import { formatDateTime } from '@/utils/format'
import { dateToIso, fmtDate } from './shared'
import { audienceLabel, type AnnouncementKind, type ComposerForm } from './composer'

defineProps<{ form: ComposerForm; kind: AnnouncementKind }>()
</script>

<style scoped>
.review-list {
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  margin: 0;
  overflow: hidden;
}
.review-row {
  align-items: start;
  background: var(--c-surface);
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: minmax(105px, 0.3fr) minmax(0, 1fr);
  padding: 13px var(--sp-4);
}
.review-row + .review-row {
  border-top: 1px solid var(--c-border);
}
.review-row dt {
  color: var(--c-muted);
  font-size: var(--fs-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.review-row dd {
  color: var(--c-text);
  font-size: var(--fs-sm);
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}
.review-row-title dd {
  color: var(--c-ink);
  font-size: var(--fs-body);
  font-weight: 700;
}
.review-row-message dd {
  max-height: 9.2em;
  overflow: auto;
}
.review-poster {
  max-width: 200px;
  max-height: 120px;
  object-fit: cover;
  border-radius: 8px;
}
@media (max-width: 599px) {
  .review-row {
      gap: var(--sp-2);
      grid-template-columns: 1fr;
    }
}
</style>
