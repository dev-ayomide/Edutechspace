import {
  Award,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  History,
  Inbox,
  Layers,
  LayoutDashboard,
  Mail,
  PenLine,
  PenSquare,
  Route as RouteIcon,
  TrendingUp,
  UserRound,
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
    { to: '/dashboard/profile', label: 'Profile', icon: UserRound },
  ],
  stack_lead: [
    { to: '/lead', label: 'Overview', end: true, icon: LayoutDashboard },
    { to: '/lead/content', label: 'Content', icon: BookOpen },
    { to: '/lead/exam', label: 'Final exam', icon: PenSquare },
    { to: '/lead/applications', label: 'Applications', icon: Inbox },
    { to: '/lead/reviews', label: 'Review queue', icon: ClipboardCheck },
    { to: '/lead/students', label: 'Students', icon: GraduationCap },
    { to: '/lead/profile', label: 'Profile', icon: UserRound },
  ],
  admin: [
    { to: '/admin', label: 'Overview', end: true, icon: LayoutDashboard },
    { to: '/admin/stacks', label: 'Stacks', icon: Layers },
    { to: '/admin/applications', label: 'Applications', icon: Inbox },
    { to: '/admin/content', label: 'Content', icon: BookOpen },
    { to: '/admin/exam', label: 'Final exams', icon: PenSquare },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/reviews', label: 'Review queue', icon: ClipboardCheck },
    { to: '/admin/invitations', label: 'Lead invitations', icon: Mail },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/signatories', label: 'Signatories', icon: PenLine },
    { to: '/admin/certificates', label: 'Certificates', icon: Award },
    { to: '/admin/audit', label: 'Audit log', icon: History },
    { to: '/admin/profile', label: 'Profile', icon: UserRound },
  ],
}
