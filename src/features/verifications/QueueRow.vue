<template>
  <!-- One verification-queue row for all three tabs. The cells follow the
       columns `useVerifications` gives each tab, in the same order. -->
  <q-tr
    :props="tableProps"
    class="cursor-pointer smart-row"
    :class="{ 'row-flash': flash }"
    @click.stop="emit('open')"
  >
    <q-td class="row-num-cell">{{ rowNumber }}</q-td>

    <q-td key="entity" :props="tableProps" class="col-title">
      <div class="entity">
        <UserInfoCell
          :initials="row.initials"
          :name="row.name"
          :email="row.email"
          :subtitle="tab === 'accommodation' ? `Owned by ${row.owner}` : ''"
          :avatar-color="row.avatarColor"
          :avatar-url="row.avatarUrl"
          :rounded="tab === 'accommodation'"
        />
        <span
          v-if="row.nonInstitutionalEmail"
          class="flag"
          title="Registered with a personal e-mail, not an @isu.edu.ph address. Check the school ID closely."
        >Not an ISU email</span>
        <span
          v-if="row.applying"
          class="flag"
          title="Has an application waiting on a landlord/landlady, who cannot accept it until OSAS verifies this student."
        >Applying for a room</span>
      </div>
    </q-td>

    <template v-if="tab === 'student'">
      <q-td key="studentNumber" :props="tableProps" class="col-ref">
        <span v-if="row.studentNumber" class="mono">{{ row.studentNumber }}</span>
        <span v-else class="blank">Not given</span>
      </q-td>
      <q-td key="college" :props="tableProps" class="col-type">
        <div v-if="row.college || row.yearLevel" class="stack">
          <span class="text clip" :title="row.college">{{ row.college || 'College not given' }}</span>
          <span v-if="row.yearLevel" class="sub">{{ row.yearLevel }}</span>
        </div>
        <span v-else class="blank">Not given</span>
      </q-td>
    </template>

    <q-td v-else-if="tab === 'landlord'" key="phone" :props="tableProps" class="col-type">
      <span v-if="row.phone" class="text mono">{{ row.phone }}</span>
      <span v-else class="blank">Not given</span>
    </q-td>

    <q-td v-else key="location" :props="tableProps" class="col-type">
      <div class="stack">
        <span class="text clip" :title="row.location">{{ row.location || 'No address given' }}</span>
        <span v-if="row.accommodationType" class="sub">{{ row.accommodationType }}</span>
      </div>
    </q-td>

    <q-td key="requirements" :props="tableProps" :class="tab === 'accommodation' ? 'col-reqs-wide' : 'col-reqs'">
      <ul class="reqs" :aria-label="reqLabel">
        <li v-for="item in row.requirements" :key="item.label" :class="item.ok ? 'is-in' : 'is-missing'">
          <Icon :icon="item.ok ? 'lucide:check' : 'lucide:x'" width="12" height="12" aria-hidden="true" />
          {{ item.label }}
        </li>
      </ul>
    </q-td>

    <q-td key="waiting" :props="tableProps" class="col-date">
      <div class="stack">
        <span class="text" :class="{ 'is-late': row.late }">{{ waitingLabel }}</span>
        <span v-if="row.late" class="sub is-late" :title="`Past the ${targetDays}-day review target`">Overdue</span>
      </div>
    </q-td>

    <q-td key="action" :props="tableProps" class="text-right action-cell">
      <template v-if="locked">
        <span class="locked-note" :title="lockTitle">
          <Icon icon="lucide:lock" width="14" height="14" /> {{ lockLabel }}
        </span>
        <button type="button" class="take-over" @click.stop="emit('take-over')">Take over</button>
      </template>
      <span v-else class="row-chevron-cell"><Icon icon="lucide:chevron-right" width="18" height="18" class="chevron-icon" /></span>
    </q-td>
  </q-tr>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import UserInfoCell from '@/components/user/UserInfoCell.vue'
import type { VerificationRequest } from '@/composables/useVerifications'

const props = withDefaults(
  defineProps<{
    /** The `props` object QTable hands its body slot. */
    tableProps: Record<string, unknown>
    row: VerificationRequest
    rowNumber: number
    tab: 'student' | 'landlord' | 'accommodation'
    flash?: boolean
    locked?: boolean
    lockLabel?: string
    lockTitle?: string
    targetDays?: number
  }>(),
  { flash: false, locked: false, lockLabel: '', lockTitle: '', targetDays: 3 },
)

const emit = defineEmits<{ open: []; 'take-over': [] }>()

const waitingLabel = computed(() => {
  const days = props.row.ageDays
  if (days === null) return 'Unknown'
  if (days === 0) return 'Today'
  return `${days} ${days === 1 ? 'day' : 'days'}`
})

const reqLabel = computed(() =>
  props.row.requirements.map((item) => `${item.label}: ${item.ok ? 'submitted' : 'missing'}`).join(', '),
)
</script>

<style scoped>
.entity { display: flex; align-items: center; gap: var(--sp-3); min-width: 0; }
.flag {
  flex: none;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--c-warning-soft);
  color: var(--c-warning);
  font-size: var(--fs-xs);
  font-weight: 700;
  white-space: nowrap;
}

.stack { display: flex; flex-direction: column; min-width: 0; }
.text { color: var(--c-ink); font-size: calc(1.625 * var(--ut)); font-weight: 500; }
.sub { color: var(--c-muted); font-size: var(--fs-xs); }
.mono { font-variant-numeric: tabular-nums; letter-spacing: 0.01em; }
.clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.blank { color: var(--c-muted); font-size: var(--fs-xs); font-style: italic; }
.is-late { color: var(--c-warning); font-weight: 700; }

.reqs { display: flex; flex-wrap: wrap; gap: 4px; margin: 0; padding: 0; list-style: none; }
.reqs li {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px 2px 6px;
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-weight: 600;
  white-space: nowrap;
}
.reqs .is-in { background: var(--c-primary-soft); color: var(--c-primary); }
.reqs .is-missing { background: var(--c-surface-2); color: var(--c-muted); }

.locked-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--c-muted);
  font-size: 12px;
  font-weight: 600;
}
.take-over {
  margin-left: 10px;
  border: 0;
  background: none;
  color: var(--c-primary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  text-decoration: underline;
}
.take-over:hover { color: var(--c-primary-ink, var(--c-primary)); }
.take-over:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }

.smart-row { transition: background-color 0.2s ease; }
.smart-row:hover { background-color: var(--c-primary-soft) !important; }
.row-flash { animation: rowFlash 2.4s ease; }
@keyframes rowFlash {
  0% { background-color: var(--c-primary-soft, rgba(0, 150, 136, 0.16)); }
  100% { background-color: transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .row-flash { animation: none; }
}
</style>
