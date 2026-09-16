import { supabase } from '@/utils/supabase'

export type DocumentTable = 'verification_documents' | 'accommodation_documents'

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
  table: DocumentTable,
  id: string | null | undefined,
): Promise<SignedDoc> {
  if (!id) return { url: '', error: 'This document has no stored reference.' }
  const { data, error } = await supabase.functions.invoke('doc-access', {
    body: { action: 'view', table, id },
  })
  if (error) {
    console.warn('Could not sign document URL:', error.message)
    return { url: '', error: `Could not open this document — ${error.message}` }
  }
  const payload = data as { url?: string; error?: string } | null
  if (payload?.error) return { url: '', error: `Could not open this document — ${payload.error}` }
  const url = payload?.url ?? ''
  return url ? { url, error: null } : { url: '', error: 'The document service returned no link for this file.' }
}
