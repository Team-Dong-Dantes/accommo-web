import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase'

/**
 * Calls an edge function and returns its JSON, or throws with the function's
 * own `error` message. Our functions answer failures with a real HTTP status
 * (401/403/400/…), which supabase-js reports only as "non-2xx status code" —
 * the reason is in the response body, so it is read from there.
 */
export async function callEdgeFunction<T = Record<string, unknown>>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null) as { error?: string } | null
      throw new Error(payload?.error || error.message)
    }
    throw error
  }
  return data as T
}
