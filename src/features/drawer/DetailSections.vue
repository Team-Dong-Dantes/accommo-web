<template>
  <!-- One card holding titled sections, the shape accommo-mobile's ProfileCard /
       ProfileBlock / ProfileField already settled on. The drawer used to render a
       bare "Details" heading over an undifferentiated two-column list, so a
       student's e-mail, college and join date all read at the same level.

       Rows are a single stack, as they are on mobile. Splitting a section down
       the middle halved the room available to each value, and a drawer-width
       column cannot hold "College of Business, Accountancy and Public
       Administration (CBAPA)" — the Academic block's second column was pushed
       out of view entirely, hiding Year Level and Student ID. -->
  <section class="ds-card">
    <div v-for="group in groups" :key="group.title" class="ds-group">
      <header class="ds-head">
        <Icon v-if="group.icon" :icon="group.icon" width="18" height="18" class="ds-head-icon" aria-hidden="true" />
        <h3 class="ds-head-title">{{ group.title }}</h3>
      </header>

      <ul class="ds-col">
        <li v-for="row in group.rows" :key="row.label" class="ds-row">
          <span class="ds-label">{{ row.label }}</span>

          <a v-if="row.link" :href="row.link" class="ds-value ds-link">{{ row.value }}</a>

          <span v-else-if="row.avatar" class="ds-value ds-avatar">
            <q-avatar size="22px" color="primary" text-color="white" class="ds-avatar-badge">
              {{ row.avatar.initials }}
            </q-avatar>
            {{ row.avatar.name }}
          </span>

          <span v-else class="ds-value" :class="{ 'is-empty': isEmpty(row.value) }">
            {{ isEmpty(row.value) ? 'Not set' : row.value }}
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PreviewDetailGroup } from '@/features/drawer/preview'

defineProps<{ groups: PreviewDetailGroup[] }>()

/** Treat the old em-dash placeholder as absent, so it renders as "Not set". */
function isEmpty(value: string | undefined): boolean {
  const text = (value ?? '').trim()
  return text === '' || text === '—' || text === '-'
}
</script>

<style scoped>
.ds-card {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm, 10px);
  background: var(--c-surface);
  overflow: hidden;
}

.ds-group + .ds-group { border-top: 1px solid var(--c-border); }

.ds-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--c-border);
}
.ds-head-icon { flex: none; color: var(--c-primary); opacity: 0.7; }
.ds-head-title {
  margin: 0;
  color: var(--c-ink);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.ds-col { margin: 0; padding: 0; list-style: none; }
.ds-row {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--c-border);
}
.ds-row:last-child { border-bottom: 0; }

.ds-label {
  flex: 0 0 auto;
  color: var(--c-muted);
  font-size: 12.5px;
  font-weight: 600;
}
/* Wraps rather than ellipsising. A full college name still overruns even the
   full-width row, and a truncated one is the same problem in a smaller form:
   the reader cannot see the value. */
.ds-value {
  min-width: 0;
  color: var(--c-ink);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.45;
  text-align: right;
  overflow-wrap: anywhere;
}
.ds-value.is-empty { color: var(--c-muted); font-style: italic; font-weight: 500; }
.ds-link { color: var(--c-primary); text-decoration: none; }
.ds-link:hover { text-decoration: underline; }
.ds-avatar { display: inline-flex; align-items: center; gap: 7px; }
.ds-avatar-badge { flex: none; font-size: 10px; font-weight: 700; }
</style>
