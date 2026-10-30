import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppShell } from '@/app/app-shell'
import { PublicShell } from '@/app/public-shell'
import { AcceptInvitePage } from '@/features/auth/accept-invite-page'
import { LoginPage } from '@/features/auth/login-page'
import { RequireRole } from '@/features/auth/require-role'
import { ComingSoonPage, JoinPage, StudentOverviewPage } from '@/features/dashboard/pages'
import { NotFoundPage } from '@/features/dashboard/not-found-page'
import { HomePage } from '@/features/home/home-page'
import type { Role } from '@/types/domain'
import { navByRole } from './nav'

/** Route-level code splitting: each screen is downloaded only when it is first visited. */
const page = (load: () => Promise<{ default: ComponentType }>): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await load()).default }),
})

function placeholders(role: Role, base: string): RouteObject[] {
  return navByRole[role]
    .filter((item) => item.phase !== undefined)
    .map((item) => ({
      path: item.to.replace(`${base}/`, ''),
      element: <ComingSoonPage title={item.label} phase={item.phase!} />,
    }))
}

function area(role: Role, base: string, children: RouteObject[]): RouteObject {
  return {
    path: base,
    element: <RequireRole roles={[role]} />,
    children: [
      { element: <AppShell role={role} />, children: [...children, ...placeholders(role, base)] },
    ],
  }
}

export const router = createBrowserRouter([
  {
    element: <PublicShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'join', element: <JoinPage /> },
      { path: 'accept-invite', element: <AcceptInvitePage /> },
    ],
  },
  area('student', '/dashboard', [{ index: true, element: <StudentOverviewPage /> }]),
  area('stack_lead', '/lead', [
    {
      index: true,
      ...page(() =>
        import('@/features/lead/overview-page').then((m) => ({ default: m.LeadOverviewPage })),
      ),
    },
    {
      path: 'content',
      ...page(() =>
        import('@/features/content/content-page').then((m) => ({ default: m.ContentPage })),
      ),
    },
  ]),
  area('admin', '/admin', [
    {
      index: true,
      ...page(() =>
        import('@/features/admin/overview-page').then((m) => ({ default: m.AdminOverviewPage })),
      ),
    },
    {
      path: 'stacks',
      ...page(() =>
        import('@/features/admin/stacks-page').then((m) => ({ default: m.StacksPage })),
      ),
    },
    {
      path: 'invitations',
      ...page(() =>
        import('@/features/admin/invitations-page').then((m) => ({ default: m.InvitationsPage })),
      ),
    },
    {
      path: 'users',
      ...page(() => import('@/features/admin/users-page').then((m) => ({ default: m.UsersPage }))),
    },
  ]),
  { path: '*', element: <NotFoundPage /> },
])
