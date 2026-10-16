<template>
  <div class="signins">
    <div class="signins-head">
      <div>
        <div class="text-weight-medium text-ink" style="font-size: 14px">Where you're logged in</div>
        <div class="text-muted" style="font-size: 12px">Logins to this account in the last 90 days. Log out any device you don't recognise.</div>
      </div>
      <q-btn v-if="others > 0" flat no-caps color="negative" label="Log out other devices" :loading="busy === 'others'" @click="confirmOthers" />
    </div>

    <div v-if="rows === null" class="text-muted q-py-sm" style="font-size: 13px">Loading…</div>
    <div v-else-if="!rows.length" class="text-muted q-py-sm" style="font-size: 13px">No logins recorded yet.</div>
    <div v-for="r in rows" :key="r.session_id" class="signin-row">
      <Icon :icon="/Android|iPhone|iPad/.test(r.user_agent ?? '') ? 'lucide:smartphone' : 'lucide:monitor'"
        width="20" height="20" class="signin-ico" :class="{ 'signin-ico--ended': !r.active }" />
      <div class="col">
        <div class="text-weight-medium text-ink" style="font-size: 13px">
          {{ deviceName(r.user_agent) }}
          <BadgePill v-if="r.current" tone="primary" label="This device" class="q-ml-xs" />
        </div>
        <div class="text-muted" style="font-size: 12px">
          {{ r.ip ?? 'Unknown IP' }} · logged in {{ formatDateTime(r.signed_in_at) }}
          · {{ r.active ? `active ${getTimeAgo(r.last_active_at)}` : 'logged out' }}
        </div>
      </div>
      <q-btn v-if="r.active && !r.current" flat dense no-caps color="negative" label="Log out"
        :loading="busy === r.session_id" @click="signOut(r.session_id)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import BadgePill from '@/components/user/BadgePill.vue'
import { fetchMySignIns, signOutOtherDevices, signOutSession } from '@/api/auth'
import { useNotify } from '@/utils/notify'
import { errorMessage } from '@/utils/errors'
import { deviceName, formatDateTime, getTimeAgo } from '@/utils/format'
import type { Database } from '@/types/database.gen'

type SignIn = Database['public']['Functions']['my_sign_ins']['Returns'][number]

const $q = useQuasar()
const notify = useNotify()
const rows = ref<SignIn[] | null>(null)
const busy = ref<string | null>(null)
const others = computed(() => rows.value?.filter((r) => r.active && !r.current).length ?? 0)

async function load() {
  try {
    rows.value = await fetchMySignIns()
  } catch (error) {
    return notify.error(errorMessage(error, 'Could not load sign-ins'))
  }
}

async function signOut(id: string) {
  busy.value = id
  const error = await signOutSession(id).then(() => null, (e) => e)
  busy.value = null
  if (error) return notify.error(errorMessage(error, 'Could not log that device out'))
  notify.success('That device has been logged out')
  await load()
}

function confirmOthers() {
  $q.dialog({
    title: 'Log out other devices',
    message: 'Every device except this one will need to log in again.',
    cancel: { label: 'Cancel', noCaps: true, flat: true },
    ok: { label: 'Log out', color: 'negative', noCaps: true },
    persistent: true,
  }).onOk(async () => {
    busy.value = 'others'
    const error = await signOutOtherDevices().then(() => null, (e) => e)
    busy.value = null
    if (error) return notify.error(errorMessage(error, 'Could not log the other devices out'))
    notify.success('Other devices have been logged out')
    await load()
  })
}

onMounted(load)
</script>

<style scoped>
.signins { padding: 12px 0; border-bottom: 1px solid var(--line, #e5e7eb); }
.signins-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 4px; }
.signin-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid var(--c-border); }
.signin-row:first-of-type { border-top: none; }
.signin-ico { color: var(--c-primary); flex-shrink: 0; }
.signin-ico--ended { color: var(--c-muted); }
</style>
