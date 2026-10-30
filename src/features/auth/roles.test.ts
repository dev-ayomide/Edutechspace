import { canAccess, homeForRole } from './roles'

describe('homeForRole', () => {
  it('sends each role to its own area', () => {
    expect(homeForRole('student')).toBe('/dashboard')
    expect(homeForRole('stack_lead')).toBe('/lead')
    expect(homeForRole('admin')).toBe('/admin')
  })
})

describe('canAccess', () => {
  it('allows only listed roles', () => {
    expect(canAccess('admin', ['admin'])).toBe(true)
    expect(canAccess('student', ['admin', 'stack_lead'])).toBe(false)
  })
  it('denies when there is no role', () => {
    expect(canAccess(undefined, ['student'])).toBe(false)
  })
})
