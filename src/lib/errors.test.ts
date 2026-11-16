import { friendlyError } from './errors'

describe('friendlyError', () => {
  it('maps permission errors', () => {
    expect(
      friendlyError({ code: '42501', message: 'new row violates row-level security policy' }),
    ).toBe('You do not have permission to do that.')
  })
  it('explains the published-lesson rule', () => {
    expect(
      friendlyError({
        code: '23514',
        message: 'violates check constraint "published_lesson_has_content"',
      }),
    ).toMatch(/needs its content/)
  })
  it('passes through deliberate messages from database functions', () => {
    expect(
      friendlyError({ code: '23514', message: 'This email already belongs to a student account' })
        .length,
    ).toBeGreaterThan(0)
    expect(friendlyError({ message: 'This email already belongs to a student account' })).toBe(
      'This email already belongs to a student account',
    )
  })
  it('never leaks unknown internals', () => {
    expect(friendlyError({ message: 'relation "x" does not exist' })).toBe(
      'Something went wrong. Please try again.',
    )
    expect(friendlyError(undefined)).toBe('Something went wrong. Please try again.')
  })
})
