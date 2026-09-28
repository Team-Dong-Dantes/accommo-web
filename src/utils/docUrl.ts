import { callEdgeFunction } from '@/utils/edgeFunction'

export type DocumentTable = 'verification_documents' | 'accommodation_documents'

/** Tables whose file column holds private `cld:` references; mirrors doc-access. */
export type PrivateFileTable = DocumentTable | 'payments' | 'messages' | 'concerns' | 'tickets' | 'ticket_messages'

/**
 * Short-lived signed URL for a verification document or accommodation permit.
 *
 * Documents are stored in Cloudinary with `authenticated` delivery, so there is
 * no readable URL without a signature — the signature is computed by the
 * `doc-access` edge function, which holds the Cloudinary API secret and decides
 * access by re-running this reviewer's own RLS against the document row.
 *
 * Rows written before the move hold a plain URL and are handed back unchanged so
 * historical records still open. Returns '' when nothing is available.
 */
export async function secureDocUrl(table: DocumentTable, id: string | null | undefined): Promise<string> {
  return (await signDocUrl(table, id)).url
}

export interface SignedDoc {
  url: string
  /** Null when signing succeeded; otherwise why it did not, for the UI to show. */
  error: string | null
}

/**
 * As `secureDocUrl`, but says why it failed. The reason matters to whoever is
 * looking at the document: an expired signature is a retry, a refused one is a
 * permissions problem, and a missing row is bad data.
 */
export async function signDocUrl(
  table: PrivateFileTable,
  id: string | null | undefined,
  ref?: string,
): Promise<SignedDoc> {
  if (!id) return { url: '', error: 'This document has no stored reference.' }
  try {
    const { url } = await callEdgeFunction<{ url?: string }>('doc-access', { action: 'view', table, id, ref })
    return url ? { url, error: null } : { url: '', error: 'The document service returned no link for this file.' }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.warn('Could not sign document URL:', message)
    return { url: '', error: `Could not open this document — ${message}` }
  }
}

/**
 * Swaps each row's private `cld:` reference in `column` for a signed link, in
 * place. Plain URLs (rows written before files went private) are left alone.
 */
export async function signRows<R extends { id: string }>(
  table: PrivateFileTable,
  rows: R[] | null | undefined,
  column: keyof R & string,
): Promise<void> {
  await Promise.all((rows ?? []).map(async (row) => {
    const value = row[column] as unknown
    if (typeof value === 'string' && value.startsWith('cld:')) {
      ;(row as Record<string, unknown>)[column] = (await signDocUrl(table, row.id, value)).url
    }
  }))
}
