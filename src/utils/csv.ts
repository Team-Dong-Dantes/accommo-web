// CSV export. Lifted verbatim from the one working implementation
// (pages/admin/Users.vue) so the Audit Logs and Accommodation Hub buttons —
// which rendered with no click handler at all — can share it instead of
// growing a second copy.

function escapeCsv(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Build a CSV from `headers` + `rows` and hand it to the browser as a download.
 * `basename` gets today's date and the .csv extension appended.
 */
export function downloadCsv(basename: string, headers: string[], rows: unknown[][]): void {
  const lines = [headers.map(escapeCsv).join(',')]
  for (const row of rows) lines.push(row.map(escapeCsv).join(','))

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${basename}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
