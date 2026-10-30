import { matchRoutes } from 'react-router-dom'
import { ROLES } from '@/types/domain'
import { navByRole } from './nav'
import { routes } from './router'

describe('routes', () => {
  const resolves = (path: string) => {
    const matches = matchRoutes(routes, path)
    return !!matches && matches.at(-1)?.route.path !== '*'
  }

  it.each(ROLES.flatMap((role) => navByRole[role].map((item) => [role, item.to] as const)))(
    '%s navigation link %s opens a real page',
    (_role, to) => {
      expect(resolves(to)).toBe(true)
    },
  )

  it.each([
    '/',
    '/login',
    '/join',
    '/accept-invite',
    '/dashboard/stack/lessons/abc',
    '/dashboard/stack/assignments/abc',
  ])('%s resolves', (path) => {
    expect(resolves(path)).toBe(true)
  })

  it('shows 404 for unknown paths', () => {
    expect(resolves('/nope/nothing')).toBe(false)
  })
})
