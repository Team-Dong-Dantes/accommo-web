<template>
  <DetailDrawer :model-value="!!row" title="Policy" close-on-backdrop @update:model-value="$emit('close')">
    <template v-if="row">
      <div class="row items-center q-gutter-x-sm q-mb-sm">
        <BadgePill :tone="STATUS_META[row.status as PolicyStatus].tone" :icon="STATUS_META[row.status as PolicyStatus].icon" :label="STATUS_META[row.status as PolicyStatus].label" />
        <BadgePill tone="neutral" icon="lucide:git-commit-horizontal" :label="versionLabel(row)" />
      </div>
      <h2 class="pol-title">{{ row.title }}</h2>
      <div class="text-muted pol-meta">
        {{ row.status === 'scheduled' ? 'Takes effect' : 'In effect since' }} {{ fmtDate(row.effective_date) }} · by {{ row.authorName }}
      </div>

      <InfoCard v-if="row.stats" title="Acceptance">
        <div class="row items-baseline justify-between">
          <span class="pol-big">{{ row.stats.accepted }} <span class="text-muted">/ {{ row.stats.eligible }}</span></span>
          <span class="text-muted">{{ pct(row.stats.accepted, row.stats.eligible) }} accepted {{ versionLabel(row) }}</span>
        </div>
        <q-linear-progress :value="row.stats.eligible ? row.stats.accepted / row.stats.eligible : 0" rounded size="8px" color="primary" class="q-mt-sm" />
      </InfoCard>

      <InfoCard :title="`Not yet accepted (${pending.length})`">
        <q-input v-if="pending.length > 6" v-model="pendingQuery" dense outlined placeholder="Search people" class="q-mb-sm" />
        <div v-if="pendingLoading" class="text-muted q-py-sm">Loading…</div>
        <div v-else-if="!pending.length" class="text-muted q-py-sm">Everyone has accepted this version.</div>
        <div v-else class="pol-pending">
          <InfoRow
            v-for="(u, i) in shownPending"
            :key="u.id"
            :icon="u.role === 'student' ? 'lucide:graduation-cap' : 'lucide:house'"
            :label="u.full_name"
            :value="u.email"
            :last="i === shownPending.length - 1"
          />
        </div>
      </InfoCard>

      <InfoCard title="Policy text">
        <div class="pol-body">{{ row.body }}</div>
      </InfoCard>

      <InfoCard v-if="versions.length" title="Earlier versions">
        <q-expansion-item
          v-for="v in versions"
          :key="v.id"
          dense
          :label="`${v.version?.trim() || 'r' + v.revision} · ${v.title}`"
          :caption="`Effective ${fmtDate(v.effective_date)} · replaced ${fmtDate(v.superseded_at)}`"
        >
          <div class="pol-body q-pa-sm">{{ v.body }}</div>
        </q-expansion-item>
      </InfoCard>
    </template>

    <template v-if="row" #footer>
      <div class="row justify-end q-gutter-x-sm">
        <q-btn v-if="!row.archived" flat no-caps color="grey-7" label="Archive" @click="$emit('archive', row)" />
        <q-btn v-else flat no-caps color="primary" label="Restore" @click="$emit('restore', row)" />
        <q-btn unelevated no-caps color="primary" class="rounded-button" label="Edit" @click="$emit('edit', row)" />
      </div>
    </template>
  </DetailDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DetailDrawer from '@/components/ui/DetailDrawer.vue'
import InfoCard from '@/components/ui/InfoCard.vue'
import InfoRow from '@/components/ui/InfoRow.vue'
import BadgePill from '@/components/user/BadgePill.vue'
import { useNotify } from '@/utils/notify'
import { fetchPendingUsers, fetchPolicyVersions } from '@/api/announcements'
import { STATUS_META, fmtDate, pct, versionLabel, type PolicyStatus } from './shared'

const props = defineProps<{ row: any | null }>()
defineEmits<{
  (e: 'close'): void
  (e: 'edit' | 'archive' | 'restore', row: any): void
}>()

const notify = useNotify()
const pending = ref<{ id: string; full_name: string; email: string; role: string }[]>([])
const pendingLoading = ref(false)
const pendingQuery = ref('')
const versions = ref<any[]>([])

const shownPending = computed(() => {
  const q = pendingQuery.value.trim().toLowerCase()
  return q ? pending.value.filter((u) => (u.full_name + ' ' + u.email).toLowerCase().includes(q)) : pending.value
})

watch(() => props.row?.id, async (id) => {
  pending.value = []
  versions.value = []
  pendingQuery.value = ''
  if (!id) return
  pendingLoading.value = true
  try {
    const [p, v] = await Promise.all([fetchPendingUsers(id), fetchPolicyVersions(id)])
    pending.value = p
    versions.value = v
  } catch (e) {
    notify.error(e instanceof Error ? e.message : 'Could not load policy details')
  } finally {
    pendingLoading.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.pol-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--c-ink);
  margin: 4px 0 2px;
}
.pol-meta {
  font-size: 12px;
  margin-bottom: 16px;
}
.pol-big {
  font-size: 22px;
  font-weight: 700;
  color: var(--c-ink);
}
.pol-pending {
  max-height: 260px;
  overflow-y: auto;
}
.pol-body {
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  color: var(--c-ink);
}
</style>
