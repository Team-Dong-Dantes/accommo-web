import { describe, expect, it } from 'vitest'
import { escapeCsv } from './csv'

describe('escapeCsv', () => {
  it('keeps formula-looking cells as text', () => {
    expect(escapeCsv('=HYPERLINK("http://x","click")')).toBe(`"'=HYPERLINK(""http://x"",""click"")"`)
    expect(escapeCsv('+639171234567')).toBe("'+639171234567")
    expect(escapeCsv('-5')).toBe("'-5")
    expect(escapeCsv('@SUM(A1)')).toBe("'@SUM(A1)")
  })

  it('quotes commas, quotes and line breaks; leaves plain text alone', () => {
    expect(escapeCsv('Peñaranda, Juan')).toBe('"Peñaranda, Juan"')
    expect(escapeCsv('a\r\nb')).toBe('"a\r\nb"')
    expect(escapeCsv('Plain')).toBe('Plain')
    expect(escapeCsv(null)).toBe('')
  })
})
