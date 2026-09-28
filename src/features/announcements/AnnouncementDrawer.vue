<template>
  <DetailDrawer :model-value="!!row" title="Announcement" close-on-backdrop @update:model-value="$emit('close')">
    <template v-if="row">
      <!-- Laid out like the mobile reader (AnnouncementPage.vue) so OSAS sees what readers see. -->
      <img v-if="row.image_url" :src="row.image_url" alt="" class="ann-poster" />
      <div class="row items-center q-gutter-x-sm q-mb-sm">
        <BadgePill :tone="STATUS_META[row.status as AnnouncementStatus].tone" :icon="STATUS_META[row.status as AnnouncementStatus].icon" :label="STATUS_META[row.status as AnnouncementStatus].label" />
        <BadgePill v-if="row.accommodation_id" tone="primary" icon="lucide:house" :label="row.accommodation?.name ?? 'Landlord notice'" />
        <BadgePill v-else :tone="audienceMeta(row.audience).tone" :label="audienceMeta(row.audience).label" />
      </div>
      <h2 class="ann-title">{{ row.title }}</h2>
      <p v-if="row.summary" class="ann-lede">{{ row.summary }}</p>

      <InfoCard v-if="row.event_at || row.deadline_at || row.location" title="Details">
        <InfoRow v-if="row.event_at" icon="lucide:calendar" label="When" :value="when" />
        <InfoRow v-if="row.deadline_at" icon="lucide:alarm-clock" label="Deadline" :value="formatDateTime(row.deadline_at)" />
        <InfoRow v-if="row.location" icon="lucide:map-pin" label="Where" :value="row.location" last />
      </InfoCard>

      <InfoCard title="Message">
        <div class="ann-body">{{ row.body }}</div>
      </InfoCard>

      <InfoCard title="Delivery">
        <InfoRow icon="lucide:user-pen" label="Posted by" :value="row.authorName" />
        <InfoRow icon="lucide:send" :label="row.status === 'scheduled' ? 'Goes live' : 'Published'" :value="row.published_at ? formatDateTime(utcIso(row.published_at)!) : 'Not yet'" />
        <InfoRow icon="lucide:calendar-x" label="Expires" :value="row.expires_at ? formatDateTime(utcIso(row.expires_at)!) : 'No expiry'" :last="!row.reach" />
        <template v-if="row.reach">
          <InfoRow icon="lucide:bell" label="Sent to" :value="row.reach.sent + ' people'" />
          <InfoRow icon="lucide:eye" label="Seen by" :value="row.reach.seen + ' (' + pct(row.reach.seen, row.reach.sent) + ')'" last />
        </template>
      </InfoCard>
    </template>

    <template v-if="row" #footer>
      <div class="row justify-end q-gutter-x-sm">
        <q-btn v-if="!row.archived" flat no-caps color="grey-7" label="Archive" @click="$emit('archive', row)" />
        <q-btn v-else flat no-caps color="primary" label="Restore" @click="$emit('restore', row)" />
        <template v-if="!row.accommodation_id">
          <q-btn flat no-caps color="primary" label="Edit" @click="$emit('edit', row)" />
          <q-btn v-if="row.status !== 'expired'" unelevated no-caps color="primary" class="rounded-button" :label="row.status === 'live' ? 'Unpublish' : 'Publish now'" @click="$emit('toggle-publish', row)" />
        </template>
      </div>
    </template>
  </DetailDrawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import InfoCard from '@/components/ui/InfoCard.vue'
import InfoRow from '@/components/ui/InfoRow.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import { formatDateTime } from '@/utils/format'
import { STATUS_META, audienceMeta, pct, utcIso, type AnnouncementStatus } from './shared'

const props = defineProps<{ row: any | null }>()
defineEmits<{
  (e: 'close'): void
  (e: 'edit' | 'archive' | 'restore' | 'toggle-publish', row: any): void
}>()

const when = computed(() => {
  const r = props.row
  if (!r?.event_at) return ''
  return r.event_end ? `${formatDateTime(r.event_at)} – ${formatDateTime(r.event_end)}` : formatDateTime(r.event_at)
})
</script>

<style scoped>
.ann-poster {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 14px;
  margin-bottom: 14px;
}
.ann-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--c-ink);
  margin: 4px 0 6px;
}
.ann-lede {
  font-size: 14px;
  color: var(--c-muted);
  margin: 0 0 16px;
}
.ann-body {
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  color: var(--c-ink);
}
</style>
