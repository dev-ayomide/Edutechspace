import type { Role } from '@/types/domain'

export interface NavItem {
  to: string
  label: string
  /** Phase of the PRD in which this screen is built; absent when it exists already. */
  phase?: number
  end?: boolean
}

export const areaLabel: Record<Role, string> = {
  student: 'Student',
  stack_lead: 'Stack lead',
  admin: 'Admin',
}

export const navByRole: Record<Role, NavItem[]> = {
  student: [
    { to: '/dashboard', label: 'Overview', end: true },
    { to: '/dashboard/stack', label: 'My stack' },
    { to: '/dashboard/progress', label: 'Progress' },
    { to: '/dashboard/exam', label: 'Final exam' },
    { to: '/dashboard/certificate', label: 'Certificate' },
  ],
  stack_lead: [
    { to: '/lead', label: 'Overview', end: true },
    { to: '/lead/content', label: 'Content' },
    { to: '/lead/exam', label: 'Final exam' },
    { to: '/lead/applications', label: 'Applications' },
    { to: '/lead/reviews', label: 'Review queue' },
    { to: '/lead/students', label: 'Students' },
  ],
  admin: [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/stacks', label: 'Stacks' },
    { to: '/admin/applications', label: 'Applications' },
    { to: '/admin/invitations', label: 'Lead invitations' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/signatories', label: 'Signatories' },
    { to: '/admin/certificates', label: 'Certificates' },
  ],
}
