import {
  Award,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Inbox,
  Layers,
  LayoutDashboard,
  Mail,
  PenLine,
  PenSquare,
  Route as RouteIcon,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types/domain'

export interface NavItem {
  to: string
  label: string
  /** Phase of the PRD in which this screen is built; absent when it exists already. */
  phase?: number
  end?: boolean
  icon: LucideIcon
}

export const areaLabel: Record<Role, string> = {
  student: 'Student',
  stack_lead: 'Stack lead',
  admin: 'Admin',
}

export const navByRole: Record<Role, NavItem[]> = {
  student: [
    { to: '/dashboard', label: 'Overview', end: true, icon: LayoutDashboard },
    { to: '/dashboard/stack', label: 'My stack', icon: RouteIcon },
    { to: '/dashboard/progress', label: 'Progress', icon: TrendingUp },
    { to: '/dashboard/exam', label: 'Final exam', icon: PenSquare },
    { to: '/dashboard/certificate', label: 'Certificate', icon: Award },
  ],
  stack_lead: [
    { to: '/lead', label: 'Overview', end: true, icon: LayoutDashboard },
    { to: '/lead/content', label: 'Content', icon: BookOpen },
    { to: '/lead/exam', label: 'Final exam', icon: PenSquare },
    { to: '/lead/applications', label: 'Applications', icon: Inbox },
    { to: '/lead/reviews', label: 'Review queue', icon: ClipboardCheck },
    { to: '/lead/students', label: 'Students', icon: GraduationCap },
  ],
  admin: [
    { to: '/admin', label: 'Overview', end: true, icon: LayoutDashboard },
    { to: '/admin/stacks', label: 'Stacks', icon: Layers },
    { to: '/admin/applications', label: 'Applications', icon: Inbox },
    { to: '/admin/invitations', label: 'Lead invitations', icon: Mail },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/signatories', label: 'Signatories', icon: PenLine },
    { to: '/admin/certificates', label: 'Certificates', icon: Award },
  ],
}
