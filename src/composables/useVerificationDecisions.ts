// Deciding a verification request: an accommodation's accreditation round
// (one RPC) or a student's or landlord/landlady's account (one status write,
// then a best-effort audit row and the admin's own notice).
import { supabase } from '@/utils/supabase'
import { useNotify } from '@/utils/notify'
import { humanizeEnum, landlordTitle } from '@/utils/format'
import { setAccountStatus } from '@/api/accounts'
import type { VerificationRequest } from '@/features/verifications/queue'

export function useVerificationDecisions() {
  const notify = useNotify()

  /**
   * An accommodation decision is one call. decide_accreditation (accommo-mobile
   * migration 20261002120000) closes the round, sets the status, stamps the
   * term, writes the audit entry and tells the landlord/landlady — in one
   * transaction. It used to be five separate writes from here, any of which
   * could fail alone and leave a listing accredited with nobody told and
   * nothing recorded.
   */
  async function decideAccommodation(req: VerificationRequest, payload: any): Promise<boolean> {
    const decision: 'approved' | 'returned' | 'rejected' =
      payload?.decision === 'approve' ? 'approved'
        : payload?.allowResubmission === true ? 'returned'
          : 'rejected'
    const { data, error } = await supabase.rpc('decide_accreditation', {
      p_accommodation: req.rawId,
      p_decision: decision,
      p_flagged_docs: payload?.flaggedDocs?.length ? payload.flaggedDocs : undefined,
      p_tags: payload?.tags?.length ? payload.tags : undefined,
      p_note: payload?.notes || undefined,
      p_override: payload?.override === true,
    })
    if (error) {
      notify.error('Decision not saved', error.message)
      return false
    }
    const kind = req.round?.kind
    const words =
      decision === 'approved'
        ? kind === 'renewal' ? 'Renewal approved' : kind === 'change' ? 'Change approved'
          : kind === 'permit_update' ? 'Permit accepted' : 'Accommodation accredited'
        : decision === 'returned' ? 'Sent back for changes'
          : kind === 'appeal' ? 'Rejection upheld' : 'Refused'
    notify.success(words, `${req.name} · status ${humanizeEnum(String(data))}. The ${landlordTitle(req.accommodation?.landlord_sex).toLowerCase()} was notified.`)
    return true
  }


  /** A student or landlord/landlady account. Throws on the status write. */
  async function decideAccount(req: VerificationRequest, decisionPayload: any) {
    const decision = decisionPayload?.decision || 'approve'
    // Either way the applicant can re-upload; "allow resubmission" is OSAS
    // asking again rather than refusing, so it has its own status.
    const allowResub = decision === 'reject' && decisionPayload?.allowResubmission === true
    const newStatus = decision === 'approve' ? 'verified' : allowResub ? 'needs_resubmission' : 'rejected'

    const rawId = req.rawId
    const actorId = (await supabase.auth.getUser()).data.user?.id || null

    // One transaction: the status, the review claim, the documents, the
    // decision history and the applicant's notice (admin_set_account_status).
    // This used to be five writes from here, any of which could fail alone —
    // and its OSAS stamp went onto every approved account, landlords/landladies
    // included, giving them a verified student profile. tg_revoke_on_unverify
    // stamps students on 'verified'.
    try {
      await setAccountStatus(rawId, newStatus, { reason: decisionPayload?.notes || null })
    } catch (error) {
      notify.error('Decision not saved', error instanceof Error ? error.message : String(error))
      throw error
    }

    const verb = decision === 'approve' ? 'verified' : allowResub ? 'sent back for resubmission' : 'rejected'

    notify.success('User ' + verb, `Status set to "${newStatus}".`)

    // The function's own history keeps the note; the tags and the override
    // live only here (best-effort, after the decision itself has landed).
    {
      const { error: auditErr } = await supabase.from('audit_logs').insert({
        action: allowResub ? 'verification.resubmit' : `verification.${decision}`,
        actor_id: actorId,
        entity_id: rawId,
        entity_type: 'user',
        before_json: { status: req.status },
        after_json: {
          status: newStatus,
          decision,
          override: decisionPayload?.override === true,
          allow_resubmission: allowResub,
          tags: decisionPayload?.tags ?? null,
          notes: decisionPayload?.notes ?? null,
        },
      } as any)
      if (auditErr) notify.warning('Decision not recorded in the audit log', auditErr.message)
    }

    // The admin's own copy; the applicant's notice came with the decision.
    if (actorId) {
      await supabase.from('notifications').insert({
        user_id: actorId,
        type: 'system',
        title: 'Verification decision recorded',
        body: `You ${verb} ${req.name}.`,
        link_url: `/users?user=${rawId}`,
      } as any)
    }
  }

  return { decideAccommodation, decideAccount }
}
