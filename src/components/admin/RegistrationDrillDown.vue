<template>
  <q-dialog v-model="open" persistent>
    <q-card class="drill-card">
      <q-card-section class="drill-head">
        <div>
          <div class="micro-label">Registrations</div>
          <h3>{{ label }}</h3>
          <p class="drill-sub">{{ rows.length }} user{{ rows.length !== 1 ? 's' : '' }} in range</p>
        </div>
        <q-btn flat round dense class="icon-btn" @click="open = false" icon="close">
          <Icon icon="lucide:x" width="18" height="18" />
        </q-btn>
      </q-card-section>

      <q-card-section class="drill-body">
        <div v-if="loading" class="drill-empty">Loading…</div>
        <div v-else-if="!rows.length" class="drill-empty">No registrations in this range.</div>
        <ul v-else class="drill-list">
          <li v-for="u in rows" :key="u.id" class="drill-row">
            <span class="drill-ava">{{ getInitials(u.full_name) }}</span>
            <span class="drill-meta">
              <span class="drill-name">{{ u.full_name }}</span>
              <span class="drill-role" :class="roleClass(u.role)">{{ capitalize(u.role) }}</span>
            </span>
            <span class="drill-date">{{ timeAgo(u.created_at) }}</span>
          </li>
        </ul>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { fetchUsersInRange, type RangeUserRow } from '@/api/users'
import { getInitials as initialsOf, getTimeAgoShort as timeAgo } from '@/utils/format'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  from: { type: String, default: '' },
  to: { type: String, default: '' },
  label: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const rows = ref<RangeUserRow[]>([])
const loading = ref(false)

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}
function roleClass(role: string) {
  const r = role.toLowerCase()
  return r === 'accommodation_manager' ? 'is-accommodation-manager' : r === 'student' ? 'is-student' : 'is-admin'
}
const getInitials = (name: string) => initialsOf(name)

watch(open, async (v) => {
  if (!v || !props.from || !props.to) return
  loading.value = true
  try {
    const fromIso = new Date(props.from).toISOString()
    const toIso = new Date(props.to + 'T23:59:59').toISOString()
    rows.value = await fetchUsersInRange(fromIso, toIso)
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.drill-card {
  width: 460px;
  max-width: 92vw;
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-lg);
}
.drill-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 0;
}
.drill-head h3 { font-family: var(--font-display); font-size: 1.15rem; margin: 2px 0; color: var(--c-ink); }
.drill-sub { font-size: 12.5px; color: var(--c-muted); margin: 0; }
.drill-body { max-height: 60vh; overflow-y: auto; }
.drill-empty { padding: 28px; text-align: center; color: var(--c-muted); font-size: 13px; }
.drill-list { list-style: none; margin: 0; padding: 0; }
.drill-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
  border-bottom: 1px solid var(--c-border);
}
.drill-row:last-child { border-bottom: none; }
.drill-ava {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--c-primary-soft); color: var(--c-primary);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 12.5px; flex: none;
}
.drill-meta { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; }
.drill-name { font-size: 13.5px; font-weight: 600; color: var(--c-ink); }
.drill-role { font-size: 11.5px; font-weight: 600; }
.drill-role.is-accommodation-manager { color: var(--c-accent); }
.drill-role.is-student { color: var(--c-primary); }
.drill-role.is-admin { color: var(--c-muted); }
.drill-date { font-size: 12px; color: var(--c-muted); flex: none; }
</style>
