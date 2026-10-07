import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkDocument, currentTerm, readTotal } from './docReading'

const expected = { fullName: 'Juan P. Dela Peña Jr.', studentId: '21-123456', college: 'College of Arts and Sciences (CAS)' }
const ok = (findings: { label: string; ok: boolean }[]) => Object.fromEntries(findings.map((f) => [f.label, f.ok]))

const SCHOOL_ID = `REPUBLIC OF THE PHILIPPINES
ISABELA STATE UNIVERSITY
Echague, Isabela
DELA PEÑA, JUAN P.
ID No. 21-l23456
BS in Biology`

const ASSESSMENT = `ISABELA STATE UNIVERSITY
ASSESSMENT OF FEES
First Semester, SY 2026-2027
Name: DELA PENA, JUAN P.  Student No.: 21-123456
College: CAS   Program: BS in Biology
Tuition Fee 8,250.00
TOTAL ASSESSMENT
12,345.50`

describe('checkDocument', () => {
  it('passes a school ID that matches, forgiving the accent and a misread digit', () => {
    expect(ok(checkDocument('school_id', SCHOOL_ID, expected))).toEqual({ Name: true, 'Student number': true, School: true })
  })

  it('passes this term’s assessment and reads its total', () => {
    const findings = checkDocument('assessment_of_fees', ASSESSMENT, expected, new Date(2026, 9, 7))
    expect(ok(findings)).toEqual({ Name: true, 'Student number': true, 'Current term': true, College: true })
    expect(findings.find((f) => f.label === 'Current term')!.detail).toContain('₱12,345.50')
  })

  it('flags last year’s assessment and another student’s number', () => {
    const old = ASSESSMENT.replace('2026-2027', '2025-2026').replace('21-123456', '21-654321')
    const findings = checkDocument('assessment_of_fees', old, expected, new Date(2026, 9, 7))
    expect(ok(findings)['Current term']).toBe(false)
    expect(findings.find((f) => f.label === 'Student number')!.detail).toBe('Shows 21-654321, not 21-123456.')
  })

  it('flags the wrong semester in the same school year', () => {
    const second = ASSESSMENT.replace('First Semester', '2nd Semester')
    expect(ok(checkDocument('assessment_of_fees', second, expected, new Date(2026, 9, 7)))['Current term']).toBe(false)
  })

  it('says so when there is barely any text', () => {
    expect(checkDocument('school_id', 'ISU 21', expected)).toEqual([expect.objectContaining({ label: 'Readable', ok: false })])
  })

  it('flags a different name', () => {
    expect(ok(checkDocument('school_id', SCHOOL_ID.replace('JUAN', 'PEDRO'), expected)).Name).toBe(false)
  })
})

describe('currentTerm', () => {
  it('follows ISU’s calendar', () => {
    expect(currentTerm(new Date(2026, 9, 1))).toEqual({ startYear: 2026, semester: '1st' })
    expect(currentTerm(new Date(2027, 1, 1))).toEqual({ startYear: 2026, semester: '2nd' })
    expect(currentTerm(new Date(2027, 5, 1))).toEqual({ startYear: 2026, semester: 'summer' })
  })
})

describe('readTotal', () => {
  it('returns null when no total is printed', () => {
    expect(readTotal('Tuition 8,250.00')).toBeNull()
  })
})

// The apps are separate repos; the check runs where both are checked out side
// by side (the workspace), and is skipped in this repo's own CI.
const mobileCopy = new URL('../../../accommo-mobile/src/utils/docReading.ts', import.meta.url)

describe('twin file', () => {
  it.skipIf(!existsSync(mobileCopy))('is identical to the copy in accommo-mobile', () => {
    const here = readFileSync(new URL('./docReading.ts', import.meta.url), 'utf8')
    const mobile = readFileSync(mobileCopy, 'utf8')
    expect(here.replace(/\r\n/g, '\n')).toBe(mobile.replace(/\r\n/g, '\n'))
  })
})
