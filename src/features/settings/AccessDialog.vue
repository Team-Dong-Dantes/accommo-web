<template>
  <q-dialog :model-value="!!admin" @update:model-value="(v) => { if (!v) emit('close') }">
    <q-card v-if="admin" class="ad-card">
      <q-card-section class="ad-head">
        <div class="ad-title">Access for {{ admin.full_name || admin.email }}</div>
        <div class="ad-sub">What they can see and change. Audit Logs and Administrators stay yours alone.</div>
      </q-card-section>
      <q-card-section class="ad-body">
        <AccessEditor v-model="draft" />
      </q-card-section>
      <q-card-actions align="right" class="ad-foot">
        <q-btn flat no-caps color="grey-7" label="Cancel" :disable="saving" @click="emit('close')" />
        <q-btn unelevated no-caps color="primary" label="Save access" :loading="saving" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AccessEditor, { type AccessDraft } from './AccessEditor.vue'
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/utils/errors'
import { NO_ACCESS, endOfDayIso, toDateInput, type AccessLevels } from '@/utils/access'

export interface AdminAccess { preset: string; levels: AccessLevels; expires_at: string | null }

const props = defineProps<{ admin: { id: string; full_name: string | null; email: string } | null; access: AdminAccess | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const notify = useNotify()
const auth = useAuthStore()
const saving = ref(false)
const draft = ref<AccessDraft>({ preset: 'custom', levels: NO_ACCESS, expiresAt: null })

watch(() => props.admin, (a) => {
  if (!a) return
  draft.value = {
    preset: props.access?.preset ?? 'custom',
    levels: { ...(props.access?.levels ?? NO_ACCESS) },
    expiresAt: toDateInput(props.access?.expires_at ?? null),
  }
})

async function save() {
  if (!props.admin) return
  saving.value = true
  // The database checks this too (admin_access_write): system admin only, never yourself.
  const { error } = await supabase.from('admin_access').upsert({
    user_id: props.admin.id,
    preset: draft.value.preset,
    levels: draft.value.levels,
    expires_at: draft.value.expiresAt ? endOfDayIso(draft.value.expiresAt) : null,
    granted_by: auth.user?.id ?? null,
    updated_at: new Date().toISOString(),
  })
  saving.value = false
  if (error) return notify.error(errorMessage(error, 'Could not save access'))
  notify.success('Access saved')
  emit('saved')
}
</script>

<style scoped>
.ad-card { width: 760px; max-width: 94vw; border-radius: 16px; }
.ad-head { padding-bottom: 0; }
.ad-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--c-ink); }
.ad-sub { font-size: 13px; color: var(--c-muted); margin-top: 2px; }
.ad-body { max-height: 65vh; overflow: auto; }
.ad-foot { border-top: 1px solid var(--c-border); padding: 12px 16px; }
</style>
