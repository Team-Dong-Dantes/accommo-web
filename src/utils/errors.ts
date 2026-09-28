/**
 * The message to show for a caught error.
 *
 * Supabase returns plain objects ({ message, code, details }), not Error
 * instances, so `e instanceof Error ? e.message : fallback` threw the real
 * reason away and `String(e)` printed "[object Object]". This reads either.
 */
export function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message
  const m = (e as { message?: unknown } | null)?.message
  return typeof m === 'string' && m ? m : fallback
}
