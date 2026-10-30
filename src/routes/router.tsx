import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/app/app-shell'
import { PublicShell } from '@/app/public-shell'
import { LoginPage } from '@/features/auth/login-page'
import { RequireRole } from '@/features/auth/require-role'
import {
  AdminOverviewPage,
  ComingSoonPage,
  JoinPage,
  LeadOverviewPage,
  StudentOverviewPage,
} from '@/features/dashboard/pages'
import { NotFoundPage } from '@/features/dashboard/not-found-page'
import { HomePage } from '@/features/home/home-page'
import type { Role } from '@/types/domain'
import { navByRole } from './nav'

function areaRoutes(role: Role, base: string, overview: React.ReactElement) {
  const placeholders = navByRole[role]
    .filter((item) => item.phase !== undefined)
    .map((item) => ({
      path: item.to.replace(`${base}/`, ''),
      element: <ComingSoonPage title={item.label} phase={item.phase!} />,
    }))
  return {
    path: base,
    element: <RequireRole roles={[role]} />,
    children: [
      {
        element: <AppShell role={role} />,
        children: [{ index: true, element: overview }, ...placeholders],
      },
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
    ],
  },
  areaRoutes('student', '/dashboard', <StudentOverviewPage />),
  areaRoutes('stack_lead', '/lead', <LeadOverviewPage />),
  areaRoutes('admin', '/admin', <AdminOverviewPage />),
  { path: '*', element: <NotFoundPage /> },
])
