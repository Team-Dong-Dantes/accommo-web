import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import type { Coord, MapArea } from './mapAreas'

// An in-memory map_areas table.
const db = new Map<string, MapArea>()
let nextId = 1
vi.mock('@/api/mapAreas', () => ({
  fetchMapAreas: async () => [...db.values()].map((a) => ({ ...a })),
  createMapArea: async (a: Omit<MapArea, 'id'>) => { const row = { ...a, id: `id${nextId++}` }; db.set(row.id, row); return { ...row } },
  updateMapArea: async (id: string, patch: Partial<MapArea>) => { db.set(id, { ...db.get(id)!, ...patch }) },
  deleteMapArea: async (id: string) => { db.delete(id) },
}))
const warning = vi.fn()
vi.mock('@/utils/notify', () => ({ useNotify: () => ({ warning, error: vi.fn(), success: vi.fn(), info: vi.fn() }) }))

// The drawing layer, reduced to the callbacks it would fire.
type Callbacks = { onClose: (ring: Coord[]) => void; onReshape: (id: string, ring: Coord[]) => void }
let draw!: Callbacks
vi.mock('./useAreaDraw', () => ({
  useAreaDraw: (_: unknown, cb: Callbacks) => {
    draw = cb
    const noop = () => {}
    return {
      drawing: ref(false), dragging: ref(false), draftSteps: ref([]), undoDraft: () => false, onKey: () => false,
      setAreas: noop, setSelected: noop, clearPending: noop, cancelDraw: noop, startDraw: noop, addLayers: noop, bind: noop,
    }
  },
}))

const { useMapAreas } = await import('./useMapAreas')
const sq = (x: number): Coord[] => [[x, 0], [x + 1, 0], [x + 1, 1], [x, 1]]
const flush = () => new Promise((r) => setTimeout(r))

describe('useMapAreas undo', () => {
  it('takes back saved changes newest first, a deletion included', async () => {
    db.set('a', { id: 'a', name: 'A', color: '#2563EB', ring: sq(0) })
    const ctl = useMapAreas(() => null, ref([]))
    await ctl.load()
    expect(ctl.canUndo.value).toBe(false)

    draw.onClose(sq(5)) // draw B and name it
    await ctl.saveName('B')
    const b = [...db.values()].find((x) => x.name === 'B')!
    draw.onReshape('a', sq(2)) // move A
    await flush()
    ctl.areaIds.value = ['a']
    ctl.dialog.value = 'rename'
    await ctl.saveName('A2') // rename A
    ctl.areaIds.value = [b.id]
    await ctl.remove() // delete B
    expect(db.has(b.id)).toBe(false)

    await ctl.undo() // B is back, under a new id
    const back = [...db.values()].find((x) => x.name === 'B')!
    expect(back.ring).toEqual(sq(5))
    await ctl.undo()
    expect(db.get('a')!.name).toBe('A')
    await ctl.undo()
    expect(db.get('a')!.ring).toEqual(sq(0))
    await ctl.undo() // creating B, undone: the step followed it to its new id
    expect([...db.values()].map((x) => x.name)).toEqual(['A'])
    expect(ctl.canUndo.value).toBe(false)
  })

  it('refuses an undo that would overlap an area drawn since', async () => {
    db.clear()
    db.set('a', { id: 'a', name: 'A', color: '#2563EB', ring: sq(0) })
    const ctl = useMapAreas(() => null, ref([]))
    await ctl.load()
    draw.onReshape('a', [[0, 0], [0.5, 0], [0.5, 1], [0, 1]]) // shrink A
    await flush()
    db.set('c', { id: 'c', name: 'C', color: '#D97706', ring: [[0.5, 0], [1, 0], [1, 1], [0.5, 1]] }) // C fills the freed half
    await ctl.load()
    await ctl.undo()
    expect(warning).toHaveBeenCalledWith(expect.stringMatching(/Cannot undo: Areas cannot overlap/))
    expect(db.get('a')!.ring).toEqual([[0, 0], [0.5, 0], [0.5, 1], [0, 1]])
  })
})
