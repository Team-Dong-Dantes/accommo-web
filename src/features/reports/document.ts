// The official-form frame every OSAS report prints in: the ISU Echague
// letterhead, a reference number, a centred title, ruled tables and a
// signatory block. A report supplies only its body; this supplies the rest.
// The browser's own print dialog turns the result into a PDF.

import { escapeHtml, fmtDate, formatDateTime } from '@/utils/format'

const e = escapeHtml
export const OFFICE = 'Office of Student Affairs and Services'

export type Paper = 'a4' | 'long'
export type Orientation = 'portrait' | 'landscape'

/** Printable page sizes, in mm. "Long" is the 8.5 × 13 in bond Philippine offices file on. */
const PAPER: Record<Paper, { w: number; h: number; css: string }> = {
  a4: { w: 210, h: 297, css: 'A4' },
  long: { w: 215.9, h: 330.2, css: '8.5in 13in' },
}

export interface Signatory { name: string; position: string }
export interface Signatories {
  /** The signed-in admin's name. */
  preparedBy?: string | undefined
  notedBy?: Signatory | null | undefined
  approvedBy?: Signatory | null | undefined
}

/** "OSAS-ACR-20260923-3F9A1C": the report code, the day it was generated, and a record id when there is one. */
export function reportReference(code: string, at: Date, recordId?: string): string {
  const ymd = `${at.getFullYear()}${String(at.getMonth() + 1).padStart(2, '0')}${String(at.getDate()).padStart(2, '0')}`
  return `OSAS-${code}-${ymd}${recordId ? `-${recordId.replace(/-/g, '').slice(0, 6).toUpperCase()}` : ''}`
}

/** A ruled table, or a boxed italic line when there is nothing to list. */
export function table(head: string[], bodyRows: string, empty: string, className = 'grid'): string {
  return bodyRows
    ? `<table class="${className}"><thead><tr>${head.map((h) => `<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${bodyRows}</tbody></table>`
    : `<p class="none">${e(empty)}</p>`
}

export function renderReport(opts: {
  /** Short code for the reference number, e.g. "ACR". */
  code: string
  title: string
  subtitle?: string
  bodyHtml: string
  recordId?: string | undefined
  paper?: Paper
  orientation?: Orientation
  signatories?: Signatories
  generatedAt?: Date
  sealUrl?: string
}): string {
  const at = opts.generatedAt ?? new Date()
  const ref = reportReference(opts.code, at, opts.recordId)
  const paper = PAPER[opts.paper ?? 'a4']
  const landscape = opts.orientation === 'landscape'
  const pageW = landscape ? paper.h : paper.w
  const contentW = pageW - 20 // 10 mm side margins
  const s = opts.signatories ?? {}

  const signer = (label: string, name: string, position: string, dated: boolean) => `
    <div>
      <div class="sign-lbl">${e(label)}</div>
      <div class="sign-name">${e(name)}&nbsp;</div>
      <div class="sign-role">${e(position)}</div>
      <div class="sign-date">Date: ${dated ? e(fmtDate(at.toISOString())) : '______________________'}</div>
    </div>`
  const signers = [
    signer('Prepared by:', s.preparedBy ?? '', OFFICE, true),
    signer('Noted by:', s.notedBy?.name ?? '', s.notedBy?.position || `Director, ${OFFICE}`, false),
    ...(s.approvedBy?.name ? [signer('Approved by:', s.approvedBy.name, s.approvedBy.position, false)] : []),
  ]

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${e(ref)} — ${e(opts.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; color: #000; font: 10.5pt/1.35 Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: ${contentW}mm; margin: 0 auto; }

  /* Letterhead: centred, seal to the left, closed by a thick-thin rule. */
  .lh { position: relative; padding: 0 84px; text-align: center; font-family: 'Times New Roman', Times, serif; line-height: 1.2; }
  .lh img { position: absolute; left: 0; top: 0; width: 76px; height: 76px; }
  .lh-rp { font-size: 11pt; font-style: italic; }
  .lh-uni { color: #0b5d1e; font-size: 17pt; font-weight: bold; letter-spacing: .02em; }
  .lh-campus { font-size: 11pt; }
  .lh-office { margin-top: 4px; font-size: 11.5pt; font-weight: bold; letter-spacing: .03em; }
  .rule { height: 6px; margin: 8px 0 14px; border-top: 3px solid #0b5d1e; border-bottom: 1px solid #0b5d1e; }

  .docmeta { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 9.5pt; }
  .title { margin: 0; font-family: 'Times New Roman', Times, serif; font-size: 14pt; font-weight: bold; letter-spacing: .04em; text-align: center; }
  .subtitle { margin: 2px 0 14px; font-size: 9.5pt; font-style: italic; text-align: center; }
  .scope { margin: -6px 0 12px; font-size: 9.5pt; text-align: center; }

  h2 { margin: 16px 0 6px; font-size: 10.5pt; font-weight: bold; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; }
  .form th, .form td, .grid th, .grid td { padding: 4px 6px; border: 0.75pt solid #000; text-align: left; vertical-align: top; }
  .form th { width: 22%; background: #eeeeee; font-size: 9pt; font-weight: bold; }
  .form td { width: 28%; }
  .grid thead th { background: #d9e8dc; font-size: 9pt; font-weight: bold; text-transform: uppercase; }
  /* Long listings (masterlists) run a size smaller so a row fits one line. */
  .list { font-size: 9.5pt; }
  .list thead th { font-size: 8.5pt; }
  .grid thead { display: table-header-group; }
  .grid tr { page-break-inside: avoid; }
  .grp td { background: #f2f2f2; font-weight: bold; }
  .total td { background: #f2f2f2; font-weight: bold; }
  .c { text-align: center !important; white-space: nowrap; }
  .n { text-align: right !important; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .findings td:first-child { font-weight: bold; }
  .overall { margin: 6px 0 0; padding: 6px 8px; border: 0.75pt solid #000; }
  .none { margin: 0; padding: 6px 8px; border: 0.75pt solid #000; font-style: italic; }
  .note { margin: 6px 0 0; font-size: 8.5pt; font-style: italic; }

  /* Signatories */
  .sign { display: grid; grid-template-columns: repeat(${Math.min(signers.length, landscape ? 3 : 2)}, 1fr); gap: 36px; margin-top: 30px; page-break-inside: avoid; }
  .sign-lbl { margin-bottom: 30px; }
  .sign-name { display: block; max-width: 80mm; padding: 0 4px; border-bottom: 1px solid #000; font-weight: bold; text-align: center; text-transform: uppercase; }
  .sign-role { max-width: 80mm; font-size: 9.5pt; text-align: center; }
  .sign-date { margin-top: 10px; font-size: 9.5pt; }

  .foot { position: fixed; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between; width: ${contentW}mm; margin: 0 auto; padding-top: 3px; border-top: 0.75pt solid #000; font-size: 8pt; }
  @page { size: ${paper.css} ${landscape ? 'landscape' : 'portrait'}; margin: 12mm 10mm 16mm; }
  /* The on-screen preview may be zoomed to fit its pane; paper never is. */
  @media print { html { zoom: 1 !important; } }
  @media screen {
    body { background: #d9d9d9; }
    .page { margin: 16px auto; padding: 12mm 10mm 18mm; width: ${pageW}mm; min-height: ${landscape ? paper.w : paper.h}mm; background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,.25); }
    .foot { display: none; }
  }
</style></head><body>
<div class="page">
  <header class="lh">
    <img src="${e(opts.sealUrl ?? '/isu-seal.png')}" alt="Isabela State University seal">
    <div class="lh-rp">Republic of the Philippines</div>
    <div class="lh-uni">ISABELA STATE UNIVERSITY</div>
    <div class="lh-campus">Echague, Isabela</div>
    <div class="lh-office">OFFICE OF STUDENT AFFAIRS AND SERVICES</div>
  </header>
  <div class="rule"></div>

  <div class="docmeta"><span>Reference no.: <b>${e(ref)}</b></span><span>Date: <b>${e(fmtDate(at.toISOString()))}</b></span></div>
  <p class="title">${e(opts.title.toUpperCase())}</p>
  <p class="subtitle">${e(opts.subtitle ?? `For the exclusive use of the ${OFFICE}`)}</p>

  ${opts.bodyHtml}

  <div class="sign">${signers.join('')}
  </div>
</div>
<div class="foot"><span>ISU Echague · ${OFFICE} · ${e(ref)}</span><span>Generated through Accommo, ${e(formatDateTime(at.toISOString()))}</span></div>
</body></html>`
}

/** Prints a window once its images (the seal) have decoded, or page one can come out without it. */
export function printWhenReady(win: Window): void {
  const images = Array.from(win.document.images)
  void Promise.all(images.map((img) => img.decode().catch(() => undefined))).then(() => {
    if (!win.closed) win.print()
  })
}

/** The seal's absolute URL — a written document has no base to resolve "/isu-seal.png" against. */
export const sealUrl = () => `${window.location.origin}/isu-seal.png`
