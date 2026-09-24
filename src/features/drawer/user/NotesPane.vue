<template>
  <!-- OSAS's private notes on an account: what was said at the desk, what was
       promised. Only admins can read them; the person never sees this. -->
  <div class="np">
    <form class="np-compose" @submit.prevent="add">
      <q-input
        v-model="draft"
        type="textarea"
        autogrow
        dense
        outlined
        maxlength="4000"
        placeholder="Add a note — only OSAS can see it"
        :input-style="{ minHeight: '44px' }"
        @keydown.ctrl.enter.prevent="add"
      />
      <div class="np-compose-foot">
        <span class="np-hint"><Icon icon="lucide:lock" width="12" height="12" />Private to OSAS</span>
        <q-btn unelevated no-caps dense color="primary" label="Add note" type="submit" :loading="saving" :disable="!draft.trim()" class="np-add" />
      </div>
    </form>

    <template v-if="loading">
      <q-skeleton v-for="n in 2" :key="n" type="rect" height="64px" class="np-skel" />
    </template>
    <p v-else-if="failed" class="np-fail">Couldn't load notes. <button type="button" class="np-link" @click="load">Try again</button></p>
    <TabEmptyState v-else-if="!notes.length" icon="lucide:notebook-pen" title="No notes yet" message="Notes you add here stay with this account for every admin." />
    <ul v-else class="np-list">
      <li v-for="n in notes" :key="n.id" class="np-note">
        <div class="np-meta">
          <span class="np-author">{{ n.authorName }}</span>
          <span class="np-when">{{ when(n.createdAt) }}</span>
          <button v-if="n.authorId === me" type="button" class="np-del" aria-label="Delete note" @click="remove(n.id)">
            <Icon icon="lucide:trash-2" width="13" height="13" />
          </button>
        </div>
        <p class="np-body">{{ n.body }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import TabEmptyState from '../TabEmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useNotify } from '@/utils/notify'
import { addAccountNote, deleteAccountNote, fetchAccountNotes, type AccountNote } from '@/api/accounts'

const props = defineProps<{ userId: string }>()

const auth = useAuthStore()
const notify = useNotify()
const me = computed(() => auth.user?.id ?? '')

const notes = ref<AccountNote[]>([])
const draft = ref('')
const loading = ref(false)
const failed = ref(false)
const saving = ref(false)

async function load() {
  const id = props.userId
  loading.value = true
  failed.value = false
  try {
    const rows = await fetchAccountNotes(id)
    if (id === props.userId) notes.value = rows
  } catch {
    if (id === props.userId) failed.value = true
  } finally {
    if (id === props.userId) loading.value = false
  }
}
watch(() => props.userId, () => { draft.value = ''; void load() }, { immediate: true })

async function add() {
  const body = draft.value.trim()
  if (!body || !me.value || saving.value) return
  saving.value = true
  try {
    await addAccountNote(props.userId, me.value, body)
    draft.value = ''
    await load()
  } catch (e) {
    notify.error('Note not saved', (e as { message?: string })?.message ?? '')
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  try {
    await deleteAccountNote(id)
    notes.value = notes.value.filter((n) => n.id !== id)
  } catch (e) {
    notify.error('Note not deleted', (e as { message?: string })?.message ?? '')
  }
}

function when(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
</script>

<style scoped>
.np { display: flex; flex-direction: column; gap: 12px; }
.np-compose { display: flex; flex-direction: column; gap: 6px; }
.np-compose-foot { display: flex; align-items: center; justify-content: space-between; }
.np-hint { display: inline-flex; align-items: center; gap: 4px; color: var(--ar-muted); font-size: 11.5px; }
.np-add { padding: 2px 12px; }
.np-skel { border-radius: 10px; }
.np-fail { margin: 0; color: var(--ar-text); font-size: 12.5px; }
.np-link { padding: 0; border: none; background: none; color: var(--ar-accent); font: inherit; font-weight: 600; cursor: pointer; }
.np-list { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
.np-note { padding: 10px 12px; border: 1px solid var(--ar-border); border-radius: 10px; background: var(--ar-soft); }
.np-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.np-author { color: var(--ar-ink); font-size: 12.5px; font-weight: 700; }
.np-when { flex: 1; color: var(--ar-muted); font-size: 11.5px; }
.np-del { display: flex; padding: 3px; border: none; border-radius: 6px; background: none; color: var(--ar-muted); cursor: pointer; }
.np-del:hover { color: var(--c-danger); background: var(--ar-surface); }
.np-body { margin: 0; color: var(--ar-text); font-size: 13px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
