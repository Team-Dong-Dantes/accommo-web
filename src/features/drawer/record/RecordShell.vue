<template>
  <!-- The frame every record shares (accommodation, user, room), drawn to the
       design mock: two panels at 4:6, the overview on the left and a tabbed
       panel on the right whose tabs sit on its top edge. Records fill it through
       slots: #overview, one #tab-<name> per tab, #drill for a view opened from
       inside a tab, and #skeleton while loading. -->
  <div class="ar">
    <section class="ar-left">
      <slot name="overview" :toggle-menu="toggleMenu" />
      <ActionMenu v-if="menuOpen" :actions="managementActions" @pick="onPick" />
    </section>

    <section class="ar-right">
      <div class="ar-tabs">
        <TabNav :model-value="tab" :tabs="tabs" @update:model-value="pickTab" />
        <button type="button" class="ar-close" aria-label="Close" @click="$emit('close')">
          <Icon icon="lucide:x" width="15" height="15" />
        </button>
      </div>

      <div class="ar-panel">
        <div v-if="loading" class="ar-scroll"><slot name="skeleton" /></div>
        <q-tab-panels v-else :model-value="person ? 'person' : drilled ? 'drill' : tab" animated class="ar-panels">
          <q-tab-panel name="person" class="ar-scroll">
            <PersonPane v-if="shownPerson" :target="shownPerson" :back-label="`Back to ${tabLabel}`" @back="$emit('update:person', null)" />
          </q-tab-panel>
          <q-tab-panel name="drill" class="ar-scroll">
            <div class="ar-drill-bar">
              <button type="button" class="ar-back" @click="$emit('update:drilled', false)">
                <Icon icon="lucide:chevron-left" width="16" height="16" />Back to {{ tabLabel }}
              </button>
            </div>
            <slot name="drill" />
          </q-tab-panel>
          <q-tab-panel v-for="t in tabs" :key="t.name" :name="t.name" class="ar-scroll">
            <slot :name="`tab-${t.name}`" />
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </section>

    <button v-if="menuOpen" type="button" class="ar-catch" aria-label="Close menu" @click="menuOpen = false"></button>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import TabNav from '@/components/ui/TabNav.vue'
import ActionMenu from '../accommodation/ActionMenu.vue'
import PersonPane from '../accommodation/PersonPane.vue'
import type { PersonTarget } from '../preview'

const props = withDefaults(
  defineProps<{
    tabs: { name: string; label: string }[]
    tab: string
    /** A profile slid in over the tabs (a boarder, a landlord/landlady), or null. */
    person?: PersonTarget | null
    /** A view opened from inside the current tab (#drill) is showing over it. */
    drilled?: boolean
    /** The record is still fetching; the right panel shows #skeleton. */
    loading?: boolean
    managementActions?: { label: string; action: string; danger?: boolean }[]
    /** Changes when a different record opens, which closes the menu. */
    recordKey?: string
  }>(),
  { person: null, drilled: false, loading: false, managementActions: () => [], recordKey: '' },
)

const emit = defineEmits<{
  (e: 'update:tab', tab: string): void
  (e: 'update:person', person: PersonTarget | null): void
  (e: 'update:drilled', drilled: boolean): void
  (e: 'close'): void
  (e: 'manage', action: string): void
}>()

const menuOpen = ref(false)
const tabLabel = computed(() => props.tabs.find((t) => t.name === props.tab)?.label ?? props.tabs[0]?.label ?? '')
// Outlives `person` so the profile still has content while it slides away.
const shownPerson = ref<PersonTarget | null>(null)
watch(() => props.person, (p) => { if (p) shownPerson.value = p }, { immediate: true })
watch(() => props.recordKey, () => { menuOpen.value = false })

function pickTab(name: string) {
  emit('update:tab', name)
  emit('update:person', null)
  emit('update:drilled', false)
}
function toggleMenu() { menuOpen.value = !menuOpen.value }
function onPick(action: string) {
  menuOpen.value = false
  emit('manage', action)
}
</script>

<style scoped>
/* The mock's roles, resolved to the console's theme so dark mode follows.
   Every pane inside a record reads these. */
.ar {
  --ar-ink: var(--c-ink);
  --ar-text: var(--c-text);
  --ar-muted: var(--c-muted);
  --ar-surface: var(--c-surface);
  --ar-soft: var(--c-surface-2);
  --ar-border: var(--c-border);
  --ar-accent: var(--c-primary);
  --ar-accent-line: color-mix(in srgb, var(--c-primary) 40%, var(--c-border));
  --ar-accent-soft: color-mix(in srgb, var(--c-primary) 12%, var(--c-surface));
  --ar-male: #42a5f5;
  --ar-female: #e91e63;

  position: relative;
  display: grid;
  grid-template-columns: 4fr 6fr;
  grid-template-rows: minmax(0, 1fr);
  width: 100%;
  height: 100%;
  font-family: var(--font-body);
  color: var(--ar-text);
}

.ar-left {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--ar-border);
  border-right: none;
  border-radius: 12px 0 0 12px;
  background: var(--ar-surface);
}

.ar-right {
  position: relative;
  left: -10px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.ar-tabs {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  margin-bottom: -1px;
}
.ar-tabs :deep(.folder-tabs) { flex: 1; min-width: 0; }
/* Quasar dims inactive tabs to 0.85, which reads as glass over the drawer backdrop. */
.ar-tabs :deep(.q-tab--inactive) { opacity: 1; }
.ar-close:focus-visible { outline: 2px solid var(--ar-accent); outline-offset: 2px; }
.ar-close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  width: 30px;
  height: 30px;
  margin-top: 8px;
  margin-left: 8px;
  padding: 0;
  border: 1px solid var(--ar-border);
  border-radius: 50%;
  background: var(--ar-surface);
  color: var(--ar-text);
  cursor: pointer;
}
.ar-close:hover { color: var(--ar-accent); border-color: var(--ar-accent-line); }

.ar-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--ar-border);
  border-radius: 0 12px 12px 0;
  background: var(--ar-surface);
}
.ar-panels {
  flex: 1;
  min-height: 0;
  background: transparent;
}
.ar-scroll {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
  box-sizing: border-box;
}

.ar-drill-bar {
  position: sticky;
  /* Pinned over the scroller's 20px padding, as PersonPane's bar is. */
  top: -20px;
  z-index: 3;
  margin: -20px -20px 8px;
  padding: 16px 20px 10px;
  border-bottom: 1px solid var(--ar-border);
  background: var(--ar-surface);
}
.ar-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  border: none;
  background: none;
  color: var(--ar-text);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.ar-back:hover { color: var(--ar-accent); }

.ar-catch {
  position: absolute;
  inset: 0;
  z-index: 40;
  padding: 0;
  border: none;
  background: transparent;
  cursor: default;
}
</style>
