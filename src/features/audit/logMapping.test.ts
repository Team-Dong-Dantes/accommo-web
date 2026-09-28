import { describe, expect, it } from 'vitest'
import { dayKeyOf, mapLog } from './logMapping'

const admin = { full_name: 'System Admin', initials: 'SA', role: 'admin', avatar_color: null }
const base = { id: 'x', entity_id: 'e1', ip_address: null, user_agent: null, actor: admin }

describe('mapLog', () => {
  it('reads the offset-less created_at as UTC', () => {
    const ev = mapLog({ ...base, action: 'CREATE', entity_type: 'policies', created_at: '2026-09-28 12:11:28.9', after_json: { title: 'T' } })
    expect(ev.at).toBe(Date.parse('2026-09-28T12:11:28.900Z'))
    expect(ev.dayKey).toBe(dayKeyOf(ev.at))
  })

  it('publish and unpublish read as verbs', () => {
    const on = mapLog({ ...base, action: 'UPDATE', entity_type: 'announcements', created_at: '2026-09-28T00:00:00',
      before_json: { title: 'pogi ako', published_at: null }, after_json: { title: 'pogi ako', published_at: '2026-09-28T12:09:35' } })
    expect(on.sentence).toBe('System Admin published announcement "pogi ako"')
    const off = mapLog({ ...base, action: 'UPDATE', entity_type: 'announcements', created_at: '2026-09-28T00:00:00',
      before_json: { title: 'pogi ako', published_at: '2026-09-26T07:10:15' }, after_json: { title: 'pogi ako', published_at: null } })
    expect(off.verb).toBe('unpublished')
  })

  it('status changes and custom actions', () => {
    const acc = mapLog({ ...base, action: 'UPDATE', entity_type: 'accommodations', created_at: '2026-09-28T00:00:00',
      before_json: { name: 'Casa', status: 'pending' }, after_json: { name: 'Casa', status: 'accredited' } })
    expect(acc.sentence).toBe('System Admin accredited accommodation "Casa"')
    expect(acc.hint).toBe('Pending → Accredited')
    const sus = mapLog({ ...base, action: 'accommodation.suspend', entity_type: 'accommodation', created_at: '2026-09-28T00:00:00',
      before_json: { status: 'accredited' }, after_json: { status: 'suspended', reason: null } })
    expect(sus.verb).toBe('suspended')
    expect(sus.link).toBe('/accommodation-hub?accommodation=e1')
  })

  it('payments name themselves by amount; automated rows are marked', () => {
    const pay = mapLog({ ...base, actor: null, action: 'CREATE', entity_type: 'payments', created_at: '2026-09-28T00:00:00',
      after_json: { amount: 3500, description: 'October rent' } })
    expect(pay.sentence).toBe('System recorded payment "₱3,500 · October rent"')
    expect(pay.actor.isSystem).toBe(true)
  })

  it('an update that only touched updated_at is a no-op; others list every field', () => {
    const noop = mapLog({ ...base, actor: null, action: 'UPDATE', entity_type: 'users', created_at: '2026-09-28T00:00:00',
      before_json: { full_name: 'A', updated_at: '1' }, after_json: { full_name: 'A', updated_at: '2' } })
    expect(noop.noop).toBe(true)
    const many = mapLog({ ...base, action: 'UPDATE', entity_type: 'users', created_at: '2026-09-28T00:00:00',
      before_json: { full_name: 'A', phone: null, onboarding_complete: false, date_of_birth: null, sex: 'male' },
      after_json: { full_name: 'A', phone: '0917', onboarding_complete: true, date_of_birth: '2004-05-01', sex: 'female' } })
    expect(many.changes.map((c) => c.key)).toEqual(['phone', 'onboarding_complete', 'date_of_birth', 'sex'])
    expect(many.changes[1]).toMatchObject({ old: 'No', new: 'Yes' })
    expect(many.hint).toMatch(/\+1 more$/)
  })

  it('reviewing is opening a review, not a decision; tickets carry their number', () => {
    const open = mapLog({ ...base, action: 'UPDATE', entity_type: 'users', created_at: '2026-09-28T00:00:00',
      before_json: { full_name: 'Zeke', status: 'pending' }, after_json: { full_name: 'Zeke', status: 'reviewing' } })
    expect(open.sentence).toBe('System Admin opened the review of account "Zeke"')
    const close = mapLog({ ...base, action: 'UPDATE', entity_type: 'users', created_at: '2026-09-28T00:00:00',
      before_json: { full_name: 'Zeke', status: 'reviewing' }, after_json: { full_name: 'Zeke', status: 'pending' } })
    expect(close.verb).toBe('closed the review of')
    const t = mapLog({ ...base, action: 'UPDATE', entity_type: 'tickets', created_at: '2026-09-28T00:00:00',
      before_json: { id: 'a', ticket_no: 12, subject: 'No water', status: 'open' }, after_json: { id: 'a', ticket_no: 12, subject: 'No water', status: 'in_progress' } })
    expect(t.name).toBe('TKT-0012 · No water')
  })

  it('sign-ups and sign-ins belong to the user, not the system', () => {
    const signin = mapLog({ ...base, actor: null, action: 'UPDATE', entity_type: 'users', created_at: '2026-09-28T00:00:00',
      before_json: { full_name: 'Ezekiel', last_login_at: null }, after_json: { full_name: 'Ezekiel', last_login_at: '2026-09-28T11:51:56' } })
    expect(signin.sentence).toBe('Ezekiel signed in')
    expect(signin.actor.isSystem).toBe(false)
  })
})
