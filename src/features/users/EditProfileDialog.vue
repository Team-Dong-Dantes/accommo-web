<template>
  <!-- OSAS correcting what someone typed at registration. Every save lands in
       the audit trail with the old and new values, so it shows in Activity. -->
  <q-dialog :model-value="!!userId" @update:model-value="(v) => { if (!v) close() }">
    <form class="ep" @submit.prevent="save">
      <header class="ep-head">
        <span class="ep-icon"><Icon icon="lucide:user-pen" width="18" height="18" /></span>
        <div class="ep-titles">
          <h2 class="ep-title">Edit profile</h2>
          <span class="ep-who">{{ name }}</span>
        </div>
        <button type="button" class="ep-x" aria-label="Close" @click="close"><Icon icon="lucide:x" width="16" height="16" /></button>
      </header>

      <div v-if="loading" class="ep-grid">
        <q-skeleton v-for="n in 4" :key="n" type="QInput" />
      </div>
      <p v-else-if="loadError" class="ep-error">{{ loadError }}</p>
      <template v-else-if="form">
        <section class="ep-sec">
          <span class="ep-sec-title">Personal</span>
          <div class="ep-grid">
            <q-input v-model="form.fullName" label="Full name" dense outlined class="ep-wide" maxlength="120" />
            <q-select v-model="form.sex" :options="SEX_OPTIONS" label="Sex" dense outlined emit-value map-options />
            <q-input v-model="form.dateOfBirth" label="Date of birth" type="date" dense outlined stack-label />
            <q-input v-model="form.phone" label="Phone" dense outlined class="ep-wide" maxlength="20" />
          </div>
        </section>

        <section v-if="form.student" class="ep-sec">
          <span class="ep-sec-title">Academic</span>
          <div class="ep-grid">
            <q-select v-model="form.student.college" :options="collegeOptions" label="College" dense outlined class="ep-wide" @update:model-value="onCollege" />
            <q-select v-model="form.student.program" :options="programOptions" label="Program" dense outlined class="ep-wide" :disable="!form.student.college" />
            <q-select v-model="form.student.yearLevel" :options="YEAR_OPTIONS" label="Year level" dense outlined emit-value map-options />
            <q-input v-model="form.student.studentId" label="Student ID" dense outlined maxlength="20" />
          </div>
        </section>

        <p v-if="saveError" class="ep-error"><Icon icon="lucide:circle-alert" width="14" height="14" />{{ saveError }}</p>
      </template>

      <footer class="ep-foot">
        <q-btn flat no-caps label="Cancel" :disable="saving" @click="close" />
        <q-btn unelevated no-caps color="primary" type="submit" label="Save changes" :loading="saving" :disable="!canSave" />
      </footer>
    </form>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { collegeOptions, collegePrograms, yearOptions } from '@/constants/academics'
import { fetchEditableProfile, saveEditableProfile, type EditableProfile } from '@/api/accounts'

const props = defineProps<{ userId: string | null; name: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved', profile: EditableProfile): void }>()

const SEX_OPTIONS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Not recorded', value: null },
]
const YEAR_OPTIONS = yearOptions.map((label, i) => ({ label, value: i + 1 }))

const form = ref<EditableProfile | null>(null)
let original = ''
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const saveError = ref('')

watch(() => props.userId, async (id) => {
  form.value = null
  loadError.value = ''
  saveError.value = ''
  if (!id) return
  loading.value = true
  try {
    const p = await fetchEditableProfile(id)
    if (id !== props.userId) return
    form.value = p
    original = JSON.stringify(p)
  } catch (e) {
    loadError.value = (e as { message?: string })?.message || 'Could not load this profile.'
  } finally {
    loading.value = false
  }
})

const programOptions = computed(() => collegePrograms[form.value?.student?.college ?? ''] ?? [])

// A program belongs to its college; changing the college clears one that no longer fits.
function onCollege() {
  const s = form.value?.student
  if (s && s.program && !programOptions.value.includes(s.program)) s.program = null
}

const canSave = computed(() =>
  !!form.value && !saving.value
  && form.value.fullName.trim().length > 1
  && JSON.stringify(form.value) !== original,
)

function close() {
  if (!saving.value) emit('close')
}

async function save() {
  if (!props.userId || !form.value || !canSave.value) return
  saving.value = true
  saveError.value = ''
  try {
    await saveEditableProfile(props.userId, form.value)
    saving.value = false
    emit('saved', form.value)
    emit('close')
  } catch (e) {
    saving.value = false
    saveError.value = (e as { message?: string })?.message || 'Not saved. Try again.'
  }
}
</script>

<style scoped>
.ep {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 560px;
  max-width: calc(100vw - 32px);
  padding: 20px;
  border-radius: var(--radius);
  background: var(--c-surface);
  color: var(--c-text);
  font-family: var(--font-body);
  box-shadow: var(--shadow-lg);
  box-sizing: border-box;
}
.ep-head { display: flex; align-items: center; gap: 12px; }
.ep-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c-primary) 12%, var(--c-surface));
  color: var(--c-primary);
}
.ep-titles { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.ep-title { margin: 0; color: var(--c-ink); font-family: var(--font-display); font-size: 17px; font-weight: 700; }
.ep-who { overflow: hidden; color: var(--c-muted); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
.ep-x { display: flex; align-self: flex-start; padding: 4px; border: none; border-radius: 6px; background: none; color: var(--c-muted); cursor: pointer; }
.ep-x:hover { color: var(--c-ink); background: var(--c-surface-2); }
.ep-sec { display: flex; flex-direction: column; gap: 8px; }
.ep-sec-title { color: var(--c-muted); font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.ep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ep-wide { grid-column: 1 / -1; }
.ep-error { display: flex; align-items: center; gap: 6px; margin: 0; color: var(--c-danger); font-size: 12.5px; }
.ep-foot { display: flex; justify-content: flex-end; gap: 8px; }
</style>
