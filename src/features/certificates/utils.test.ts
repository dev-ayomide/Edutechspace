import {
  certificateFilename,
  formatIssueDate,
  pickCertificate,
  toPdfSafeText,
  verifyUrl,
} from './utils'

describe('verifyUrl', () => {
  it('builds a public verification link', () => {
    expect(verifyUrl('https://app.example.com/', 'RTS-2026-ABC')).toBe(
      'https://app.example.com/verify/RTS-2026-ABC',
    )
    expect(verifyUrl('http://localhost:5173', 'A B')).toBe('http://localhost:5173/verify/A%20B')
  })
})

describe('toPdfSafeText', () => {
  it('keeps plain names', () => {
    expect(toPdfSafeText('Alice One')).toBe('Alice One')
  })
  it('reduces diacritics to base letters', () => {
    expect(toPdfSafeText('Ṣọlá Adéyẹmí')).toBe('Sola Adeyemi')
    expect(toPdfSafeText('José Núñez')).toBe('Jose Nunez')
  })
  it('drops characters the PDF font cannot draw and tidies whitespace', () => {
    expect(toPdfSafeText('  Ada   😀 Lovelace ')).toBe('Ada Lovelace')
  })
})

describe('certificateFilename', () => {
  it('is safe and recognisable', () => {
    expect(
      certificateFilename({ student_name: 'Ṣọlá Adéyẹmí', certificate_no: 'RTS-2026-AB12' }),
    ).toBe('RUNTech-Space-Sola-Adeyemi-RTS-2026-AB12.pdf')
    expect(certificateFilename({ student_name: '???', certificate_no: 'RTS-1' })).toBe(
      'RUNTech-Space-certificate-RTS-1.pdf',
    )
  })
})

describe('formatIssueDate', () => {
  it('formats a long date', () => {
    expect(formatIssueDate('2026-10-30T12:00:00Z')).toBe('30 October 2026')
  })
})

describe('pickCertificate', () => {
  const c = (id: string, issued_at: string, revoked_at: string | null = null) => ({
    id,
    issued_at,
    revoked_at,
  })
  it('prefers the active certificate', () => {
    const r = pickCertificate([c('old', '2026-01-01', '2026-02-01'), c('new', '2026-03-01')])
    expect(r.active?.id).toBe('new')
  })
  it('falls back to the latest when all are revoked', () => {
    const r = pickCertificate([c('a', '2026-01-01', 'x'), c('b', '2026-02-01', 'x')])
    expect(r.active).toBeNull()
    expect(r.latest?.id).toBe('b')
  })
  it('handles none', () => {
    expect(pickCertificate([])).toEqual({ active: null, latest: null })
  })
})
