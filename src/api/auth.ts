// Data access for the signed-in admin's own sign-in: two-factor, password,
// sessions. Pure fetchers; each throws on error.

import { supabase } from '@/utils/supabase'

/** The verified authenticator, if one is set up. */
export async function fetchVerifiedTotp(): Promise<{ id: string } | null> {
  const { data } = await supabase.auth.mfa.listFactors()
  return data?.totp.find((f) => f.status === 'verified') ?? null
}

/** Start a fresh TOTP enrollment, clearing any half-finished one first. */
export async function enrollTotp(friendlyName: string): Promise<{ id: string; qr: string; secret: string }> {
  const { data: list } = await supabase.auth.mfa.listFactors()
  for (const f of list?.all ?? []) {
    if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName })
  if (error) throw error
  return { id: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
}

export async function verifyTotp(factorId: string, code: string): Promise<void> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
  if (error) throw error
}

export async function unenrollFactor(factorId: string): Promise<void> {
  await supabase.auth.mfa.unenroll({ factorId })
}

/** Set a new password on the current session (no current password asked). */
export async function setPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function fetchMySignIns() {
  const { data, error } = await supabase.rpc('my_sign_ins')
  if (error) throw error
  return data ?? []
}

export async function signOutSession(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('sign_out_session', { p_session: sessionId })
  if (error) throw error
}

export async function signOutOtherDevices(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'others' })
  if (error) throw error
}
