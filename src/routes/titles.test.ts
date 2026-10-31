import { titleFor } from './titles'

describe('titleFor', () => {
  it('titles public pages', () => {
    expect(titleFor('/')).toBe('Learn. Grow. Build. · RUNTech Space')
    expect(titleFor('/login')).toBe('Sign in · RUNTech Space')
    expect(titleFor('/verify/RTS-2026-ABC')).toBe('Verify a certificate · RUNTech Space')
  })
  it('uses the navigation label for app pages', () => {
    expect(titleFor('/lead/reviews')).toBe('Review queue · RUNTech Space')
    expect(titleFor('/admin/certificates')).toBe('Certificates · RUNTech Space')
    expect(titleFor('/dashboard/')).toBe('Overview · RUNTech Space')
  })
  it('titles dynamic learning pages', () => {
    expect(titleFor('/dashboard/stack/lessons/abc')).toBe('Lesson · RUNTech Space')
  })
  it('falls back to the site name', () => {
    expect(titleFor('/nope')).toBe('RUNTech Space')
  })
})
