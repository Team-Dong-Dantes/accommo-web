<template>
  <DetailDrawer :model-value="!!event" :title="event?.entityId ? 'Audit event' : 'Activity'" close-on-backdrop @update:model-value="$emit('close')">
    <div v-if="event" class="ad">
      <div class="ad-sentence">
        <BadgePill :tone="getActionColor(event)" :label="event.verb" />
        <h2 class="ad-title">{{ event.sentence }}</h2>
      </div>

      <InfoCard title="When and who">
        <InfoRow icon="lucide:clock" label="When" :value="when" />
        <InfoRow :icon="event.actor.isSystem ? 'lucide:server' : 'lucide:user'" label="By" :value="event.actor.name" wrap />
        <InfoRow icon="lucide:badge" label="Role" :value="event.actor.role || '—'" last />
      </InfoCard>

      <InfoCard v-if="event.entityId" title="Record">
        <InfoRow icon="lucide:folder" label="Type" :value="event.entityLabel" />
        <InfoRow v-if="event.name" icon="lucide:tag" label="Name" :value="event.name" wrap />
        <InfoRow icon="lucide:hash" label="ID" :value="event.entityId" mono wrap :last="!event.link" />
        <div v-if="event.link" class="q-pt-sm">
          <q-btn outline no-caps dense color="primary" class="q-px-md rounded-button" :to="event.link" @click="$emit('close')">
            <Icon icon="lucide:external-link" width="15" height="15" class="on-left" />Open record
          </q-btn>
        </div>
      </InfoCard>

      <InfoCard v-if="event.entityId" :title="`Changes (${event.changes.length})`">
        <div v-if="!event.changes.length" class="text-muted q-py-xs">
          {{ event.action === 'CREATE' ? 'A new record — nothing existed before.' : 'No field changes recorded.' }}
        </div>
        <div v-for="c in event.changes" :key="c.key" class="ad-change">
          <div class="ad-field">{{ c.field }}</div>
          <div class="ad-vals">
            <span class="ad-old">{{ c.old }}</span>
            <Icon icon="lucide:arrow-right" width="13" height="13" class="text-primary" />
            <span class="ad-new">{{ c.new }}</span>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="Device">
        <template v-if="recorded">
          <InfoRow icon="lucide:monitor-smartphone" label="Device" :value="deviceName(event.userAgent)" />
          <InfoRow icon="lucide:globe" label="IP address" :value="event.ip" mono wrap />
          <InfoRow icon="lucide:code" label="User agent" :value="event.userAgent" mono wrap last />
        </template>
        <div v-else class="text-muted q-py-xs">
          {{ !event.entityId ? 'Not recorded for this kind of activity.'
            : !authStore.can('activity', 'edit') ? 'Your access shows changes only, not device details.'
            : 'Not recorded. Device details are kept for activity from 5 Oct 2026 onwards.' }}
        </div>
      </InfoCard>
    </div>
  </DetailDrawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import InfoCard from '@/components/ui/InfoCard.vue'
import InfoRow from '@/components/ui/InfoRow.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import { getActionColor, type AuditEvent } from './logMapping'
import { deviceName } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const props = defineProps<{ event: AuditEvent | null }>()
defineEmits<{ (e: 'close'): void }>()

const recorded = computed(() => !!props.event && (props.event.ip !== '—' || props.event.userAgent !== '—'))

const when = computed(() => props.event?.at
  ? new Date(props.event.at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'medium' })
  : '')
</script>

<style scoped>
/* Denser than the shared InfoCard/InfoRow so a whole event fits the drawer
   without scrolling; scoped here so the other drawers keep their spacing. */
.ad :deep(.usr-card) { padding: 10px 14px; margin-bottom: 10px; }
.ad :deep(.usr-card-label) { margin-bottom: 2px; }
.ad :deep(.usr-row) { padding: 5px 0; gap: 10px; }
.ad :deep(.usr-ic) { width: 24px; height: 24px; border-radius: 6px; }
.ad :deep(.usr-ic svg) { width: 14px; height: 14px; }
.ad-sentence { margin-bottom: 12px; }
.ad-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--c-ink);
  margin: 6px 0 0;
}
.ad-change {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid var(--c-border);
}
.ad-change:last-child { border-bottom: none; }
.ad-field {
  flex: none;
  width: 126px;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-muted);
}
.ad-vals {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13px;
  word-break: break-word;
}
.ad-old { color: var(--c-muted); text-decoration: line-through; }
.ad-new { color: var(--c-ink); font-weight: 600; }
</style>
