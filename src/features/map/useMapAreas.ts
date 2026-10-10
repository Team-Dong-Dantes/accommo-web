// The Map View's areas as data: loading them, which ones the list and the pins
// are narrowed to, the dialog that names, renames or deletes one, and saving
// what useAreaDraw draws and reshapes. A failed save puts the area back.
// Every saved change is a step Ctrl+Z (or the Undo button) can take back.

import { computed, ref, watch, type Ref } from 'vue'
import type mapboxgl from 'mapbox-gl'
import { createMapArea, deleteMapArea, fetchMapAreas, updateMapArea } from '@/api/mapAreas'
import { useNotify } from '@/utils/notify'
import { errorMessage } from '@/utils/errors'
import { areaStats, nextColor, pointInRing, ringProblem, type Coord, type MapArea } from './mapAreas'
import { useAreaDraw } from './useAreaDraw'
import type { AreaDialogMode } from './MapAreaDialog.vue'
import type { MapItem } from './mapPins'

/** One saved change, as what undoing it needs. */
type Step =
  | { kind: 'shape'; id: string; ring: Coord[] }
  | { kind: 'name'; id: string; name: string }
  | { kind: 'create'; id: string }
  | { kind: 'delete'; area: MapArea }

/** ponytail: undo history lives for the visit and keeps the last 50 steps; no redo until someone asks. */
const MAX_STEPS = 50

export function useMapAreas(getMap: () => mapboxgl.Map | null, items: Ref<MapItem[]>) {
  const notify = useNotify()
  const areas = ref<MapArea[]>([])
  const areaIds = ref<string[]>([])
  /** A closed shape waiting for its name. */
  const pendingRing = ref<Coord[] | null>(null)
  const dialog = ref<AreaDialogMode | null>(null)
  const saving = ref(false)
  const steps = ref<Step[]>([])
  const remember = (step: Step) => { steps.value = [...steps.value, step].slice(-MAX_STEPS) }

  const draw = useAreaDraw(getMap, {
    onPick: (id) => { if (!areaIds.value.includes(id)) areaIds.value = [id] },
    onClose: (ring) => { pendingRing.value = ring; dialog.value = 'name' },
    onReshape: (id, ring) => void patch(id, { ring }, 'Could not save the new shape.'),
    onRefuse: (why) => notify.warning(why),
  })

  /** The card shows one area at a time; with several picked it steps aside. */
  const selectedArea = computed(() => (areaIds.value.length === 1 ? areas.value.find((a) => a.id === areaIds.value[0]) ?? null : null))
  const stats = computed(() => (selectedArea.value ? areaStats(selectedArea.value.ring, items.value) : null))

  /** Whether an accommodation lies in any picked area; true when none is picked. */
  function inAreas(item: MapItem) {
    const picked = areas.value.filter((a) => areaIds.value.includes(a.id))
    return !picked.length || picked.some((a) => pointInRing(item.lng, item.lat, a.ring))
  }

  watch(areas, (a) => draw.setAreas(a), { deep: true })
  watch(selectedArea, (a) => draw.setSelected(a?.id ?? null))
  // An area deleted elsewhere drops out of the filter.
  watch(areas, (a) => { areaIds.value = areaIds.value.filter((id) => a.some((x) => x.id === id)) })

  async function load() {
    try {
      areas.value = await fetchMapAreas()
    } catch (e) {
      notify.error(errorMessage(e, 'Could not load the map areas.'))
    }
  }

  /** Saves a change to an area; unless it is itself an undo, it becomes a step undo can take back. */
  async function patch(id: string, change: Partial<Pick<MapArea, 'name' | 'ring'>>, failure: string, undoable = true) {
    const area = areas.value.find((a) => a.id === id)
    if (!area) return false
    const before = { name: area.name, ring: area.ring }
    Object.assign(area, change)
    try {
      await updateMapArea(id, change)
      if (undoable) remember(change.ring ? { kind: 'shape', id, ring: before.ring } : { kind: 'name', id, name: before.name })
      return true
    } catch (e) {
      Object.assign(area, before)
      notify.error(errorMessage(e, failure))
      return false
    }
  }

  /** The dialog's Save: names the shape just drawn, or renames the selected area. */
  async function saveName(name: string) {
    saving.value = true
    try {
      if (dialog.value === 'rename' && selectedArea.value) {
        if (await patch(selectedArea.value.id, { name }, 'Could not rename the area.')) dialog.value = null
      } else if (pendingRing.value) {
        const area = await createMapArea({ name, color: nextColor(areas.value), ring: pendingRing.value })
        areas.value = [...areas.value, area]
        areaIds.value = [area.id]
        remember({ kind: 'create', id: area.id })
        closeDialog()
      }
    } catch (e) {
      notify.error(errorMessage(e, 'Could not save the area.'))
    } finally {
      saving.value = false
    }
  }

  async function remove() {
    const area = selectedArea.value
    if (!area) return
    saving.value = true
    try {
      await deleteMapArea(area.id)
      areas.value = areas.value.filter((a) => a.id !== area.id)
      remember({ kind: 'delete', area: { ...area, ring: area.ring.map((c) => [...c] as Coord) } })
      dialog.value = null
    } catch (e) {
      notify.error(errorMessage(e, 'Could not delete the area.'))
    } finally {
      saving.value = false
    }
  }

  /** Closing the dialog; closing it while naming throws the drawn shape away. */
  function closeDialog() {
    dialog.value = null
    pendingRing.value = null
    draw.clearPending()
  }

  const canUndo = computed(() => (draw.drawing.value ? draw.draftSteps.value.length > 0 : steps.value.length > 0))
  let undoing = false

  /**
   * Takes back the last step: a corner while drawing, otherwise the last saved
   * change. A step that would now break the rules (an old shape overlapping an
   * area drawn since) is refused and dropped; one that fails to save stays, to retry.
   */
  async function undo() {
    if (draw.undoDraft() || undoing || dialog.value) return
    const step = steps.value[steps.value.length - 1]
    if (!step) return
    steps.value = steps.value.slice(0, -1)
    if ('id' in step && !areas.value.some((a) => a.id === step.id)) return notify.warning('Cannot undo: that area is gone.')
    const others = (skip?: string) => areas.value.filter((a) => a.id !== skip).map((a) => a.ring)
    const why = step.kind === 'shape' ? ringProblem(step.ring, others(step.id)) : step.kind === 'delete' ? ringProblem(step.area.ring, others()) : null
    if (why) return notify.warning(`Cannot undo: ${why}`)
    undoing = true
    try {
      if (step.kind === 'shape' || step.kind === 'name') {
        const change = step.kind === 'shape' ? { ring: step.ring } : { name: step.name }
        if (!(await patch(step.id, change, 'Could not undo.', false))) steps.value = [...steps.value, step]
      } else if (step.kind === 'create') {
        await deleteMapArea(step.id)
        areas.value = areas.value.filter((a) => a.id !== step.id)
      } else {
        const { id: oldId, ...rest } = step.area
        const area = await createMapArea(rest)
        areas.value = [...areas.value, area]
        areaIds.value = [area.id]
        // Earlier steps about the deleted area now mean the one brought back.
        steps.value = steps.value.map((s) => ('id' in s && s.id === oldId ? { ...s, id: area.id } : s))
      }
    } catch (e) {
      steps.value = [...steps.value, step]
      notify.error(errorMessage(e, 'Could not undo.'))
    } finally {
      undoing = false
    }
  }

  /** Ctrl+Z (Cmd+Z) undoes, unless typing in a field or a dialog is open; then the drawing keys. True when used. */
  function onKey(e: KeyboardEvent): boolean {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z') {
      const t = e.target as HTMLElement | null
      if (dialog.value || t?.closest('input, textarea, [contenteditable="true"]')) return false
      e.preventDefault()
      void undo()
      return true
    }
    return draw.onKey(e)
  }

  /** The Draw button: starts a shape, or abandons the one being drawn. */
  function toggleDraw() {
    if (draw.drawing.value) return draw.cancelDraw()
    closeDialog()
    draw.startDraw()
  }

  return {
    areas, areaIds, dialog, saving, selectedArea, stats, drawing: draw.drawing, dragging: draw.dragging,
    canUndo, inAreas, load, saveName, remove, closeDialog, toggleDraw, undo, onKey,
    addLayers: draw.addLayers, bind: draw.bind,
  }
}
