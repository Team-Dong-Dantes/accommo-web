<template>
  <q-card flat class="section-card">
    <PanelHeader title="Reports" subtitle="Who signs the reports OSAS prints. Shared by every administrator." />

    <div class="sign-block">
      <div class="field-label">Prepared by</div>
      <p class="hint">Always the administrator who generates the report — filled in automatically.</p>
    </div>

    <div class="sign-block">
      <div class="field-label">Noted by</div>
      <p class="hint">Usually the OSAS Director. Left blank, the report prints an empty line to sign on.</p>
      <div class="form-grid">
        <q-input v-model="form.notedByName" outlined dense label="Full name" class="field" :disable="loading" />
        <q-input v-model="form.notedByPosition" outlined dense label="Position" placeholder="Director, Office of Student Affairs and Services" class="field" :disable="loading" />
      </div>
    </div>

    <div class="sign-block">
      <div class="field-label">Approved by <span class="optional">optional</span></div>
      <p class="hint">A third signature, such as the Campus Executive Officer. Left blank, reports carry only two.</p>
      <div class="form-grid">
        <q-input v-model="form.approvedByName" outlined dense label="Full name" class="field" :disable="loading" />
        <q-input v-model="form.approvedByPosition" outlined dense label="Position" class="field" :disable="loading" />
      </div>
    </div>

    <div class="actions">
      <q-btn unelevated color="primary" no-caps class="text-weight-bold" :loading="saving" :disable="loading || !dirty" @click="save">
        <Icon icon="lucide:save" class="on-left" width="18" height="18" />Save
      </q-btn>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import PanelHeader from '@/components/ui/PanelHeader.vue'
import { useNotify } from '@/utils/notify'
import { useAuthStore } from '@/stores/auth'
import { fetchReportSettings, saveReportSettings, type ReportSettings } from '@/api/reports'

const notify = useNotify()
const auth = useAuthStore()

const blank: ReportSettings = { notedByName: '', notedByPosition: '', approvedByName: '', approvedByPosition: '' }
const form = reactive<ReportSettings>({ ...blank })
const saved = ref<ReportSettings>({ ...blank })
const loading = ref(true)
const saving = ref(false)
const dirty = computed(() => (Object.keys(blank) as (keyof ReportSettings)[]).some((k) => form[k] !== saved.value[k]))

onMounted(async () => {
  try {
    saved.value = await fetchReportSettings()
    Object.assign(form, saved.value)
  } catch (err) {
    notify.error(`Could not load report settings: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await saveReportSettings({ ...form }, auth.user?.id)
    saved.value = { ...form }
    notify.success('Report signatories saved.')
  } catch (err) {
    notify.error(`Could not save: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.section-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 24px;
  margin-bottom: 16px;
}
.sign-block { padding: 14px 0; border-bottom: 1px solid var(--c-border); }
.sign-block:first-of-type { padding-top: 0; }
.field-label { margin-bottom: 4px; color: var(--c-ink); font-size: 13px; font-weight: 600; }
.optional { margin-left: 6px; color: var(--c-muted); font-size: 11.5px; font-weight: 500; }
.hint { margin: 0 0 10px; color: var(--c-muted); font-size: 12.5px; line-height: 1.4; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.actions { display: flex; justify-content: flex-end; padding-top: 16px; }
</style>
