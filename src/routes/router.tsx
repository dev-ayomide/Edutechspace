import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppShell } from '@/app/app-shell'
import { PublicShell } from '@/app/public-shell'
import { AcceptInvitePage } from '@/features/auth/accept-invite-page'
import { LoginPage } from '@/features/auth/login-page'
import { RequireRole } from '@/features/auth/require-role'
import { JoinPage } from '@/features/admissions/join-page'
import { ComingSoonPage } from '@/features/dashboard/pages'
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

export const routes: RouteObject[] = [
  {
    element: <PublicShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'join', element: <JoinPage /> },
      { path: 'accept-invite', element: <AcceptInvitePage /> },
      {
        path: 'verify/:number?',
        ...page(() =>
          import('@/features/certificates/verify-page').then((m) => ({ default: m.VerifyPage })),
        ),
      },
    ],
  },
  area('student', '/dashboard', [
    {
      index: true,
      ...page(() =>
        import('@/features/learning/overview-page').then((m) => ({
          default: m.StudentOverviewPage,
        })),
      ),
    },
    {
      path: 'stack',
      ...page(() =>
        import('@/features/learning/stack-page').then((m) => ({ default: m.StackPage })),
      ),
    },
    {
      path: 'stack/lessons/:lessonId',
      ...page(() =>
        import('@/features/learning/lesson-page').then((m) => ({ default: m.LessonPage })),
      ),
    },
    {
      path: 'stack/assignments/:assignmentId',
      ...page(() =>
        import('@/features/learning/assignment-page').then((m) => ({ default: m.AssignmentPage })),
      ),
    },
    {
      path: 'exam',
      ...page(() => import('@/features/exams/exam-page').then((m) => ({ default: m.ExamPage }))),
    },
    {
      path: 'certificate',
      ...page(() =>
        import('@/features/certificates/certificate-page').then((m) => ({
          default: m.CertificatePage,
        })),
      ),
    },
    {
      path: 'progress',
      ...page(() =>
        import('@/features/learning/progress-page').then((m) => ({ default: m.ProgressPage })),
      ),
    },
  ]),
  area('stack_lead', '/lead', [
    {
      index: true,
      ...page(() =>
        import('@/features/lead/overview-page').then((m) => ({ default: m.LeadOverviewPage })),
      ),
    },
    {
      path: 'applications',
      ...page(() =>
        import('@/features/admissions/applications-page').then((m) => ({
          default: m.ApplicationsPage,
        })),
      ),
    },
    {
      path: 'reviews',
      ...page(() =>
        import('@/features/reviews/review-page').then((m) => ({ default: m.ReviewPage })),
      ),
    },
    {
      path: 'students',
      ...page(() =>
        import('@/features/roster/students-page').then((m) => ({ default: m.StudentsPage })),
      ),
    },
    {
      path: 'exam',
      ...page(() =>
        import('@/features/exams/exam-builder-page').then((m) => ({ default: m.ExamBuilderPage })),
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
      path: 'applications',
      ...page(() =>
        import('@/features/admissions/applications-page').then((m) => ({
          default: m.ApplicationsPage,
        })),
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
      path: 'signatories',
      ...page(() =>
        import('@/features/certificates/signatories-page').then((m) => ({
          default: m.SignatoriesPage,
        })),
      ),
    },
    {
      path: 'certificates',
      ...page(() =>
        import('@/features/certificates/admin-certificates-page').then((m) => ({
          default: m.AdminCertificatesPage,
        })),
      ),
    },
    {
      path: 'users',
      ...page(() => import('@/features/admin/users-page').then((m) => ({ default: m.UsersPage }))),
    },
  ]),
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)
