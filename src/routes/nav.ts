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
    { to: '/dashboard/stack', label: 'My stack', phase: 2 },
    { to: '/dashboard/progress', label: 'Progress', phase: 2 },
    { to: '/dashboard/certificate', label: 'Certificate', phase: 3 },
  ],
  stack_lead: [
    { to: '/lead', label: 'Overview', end: true },
    { to: '/lead/content', label: 'Content' },
    { to: '/lead/applications', label: 'Applications' },
    { to: '/lead/reviews', label: 'Review queue', phase: 2 },
    { to: '/lead/students', label: 'Students', phase: 2 },
  ],
  admin: [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/stacks', label: 'Stacks' },
    { to: '/admin/applications', label: 'Applications' },
    { to: '/admin/invitations', label: 'Lead invitations' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/signatories', label: 'Signatories', phase: 3 },
    { to: '/admin/certificates', label: 'Certificates', phase: 3 },
  ],
}
