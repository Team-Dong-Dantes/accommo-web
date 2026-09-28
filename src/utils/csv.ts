// CSV export. Lifted verbatim from the one working implementation
// (pages/admin/Users.vue) so the Audit Logs and Accommodation Hub buttons —
// which rendered with no click handler at all — can share it instead of
// growing a second copy.

export function escapeCsv(value: unknown): string {
  let s = value == null ? '' : String(value)
  // Names, titles and reasons are typed by users. A cell starting with one of
  // these is run as a formula by Excel/Sheets (=HYPERLINK(...) and worse), so
  // it is prefixed with an apostrophe to keep it text.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Build a CSV from `headers` + `rows` and hand it to the browser as a download.
 * `basename` gets today's date and the .csv extension appended.
 */
export function downloadCsv(basename: string, headers: string[], rows: unknown[][]): void {
  const lines = [headers.map(escapeCsv).join(',')]
  for (const row of rows) lines.push(row.map(escapeCsv).join(','))

  // The BOM tells Excel the file is UTF-8; without it "ñ" and "₱" arrive garbled.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${basename}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
