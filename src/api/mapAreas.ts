// Data access for the areas OSAS draws on the Map View — pure fetchers, no
// reactive state. The page decides what a failure means.

import { supabase } from '@/utils/supabase'
import type { Coord, MapArea } from '@/features/map/mapAreas'

const COLUMNS = 'id, name, color, ring'

const toArea = (r: { id: string; name: string; color: string; ring: unknown }): MapArea => ({ ...r, ring: r.ring as Coord[] })

export async function fetchMapAreas(): Promise<MapArea[]> {
  const { data, error } = await supabase.from('map_areas').select(COLUMNS).order('created_at')
  if (error) throw error
  return (data ?? []).map(toArea)
}

export async function createMapArea(area: Omit<MapArea, 'id'>): Promise<MapArea> {
  const { data, error } = await supabase.from('map_areas').insert(area).select(COLUMNS).single()
  if (error) throw error
  return toArea(data)
}

export async function updateMapArea(id: string, patch: Partial<Pick<MapArea, 'name' | 'ring'>>): Promise<void> {
  const { error } = await supabase.from('map_areas').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteMapArea(id: string): Promise<void> {
  const { error } = await supabase.from('map_areas').delete().eq('id', id)
  if (error) throw error
}
