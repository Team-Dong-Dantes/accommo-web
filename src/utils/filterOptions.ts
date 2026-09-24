/**
 * A filter's options: only the values the rows actually have, each with how
 * many rows it would show, in a sensible order. An option that matches nobody
 * is never offered.
 */
export function counted<T>(
  rows: readonly T[],
  key: keyof T,
  label: (v: string) => string = (v) => v,
  order?: string[],
) {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const v = String(r[key] ?? '')
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  const rank = (v: string) => (order ? (order.indexOf(v) + 1 || 99) : 0)
  return [...counts.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || label(a).localeCompare(label(b), undefined, { numeric: true }))
    .map(([v, n]) => ({ label: `${label(v)} (${n})`, value: v }))
}
