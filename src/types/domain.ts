export const ROLES = ['student', 'stack_lead', 'admin'] as const
export type Role = (typeof ROLES)[number]

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: Role
}

export interface Stack {
  id: string
  slug: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export type InvitationStatus = 'pending' | 'accepted' | 'revoked'

export interface Invitation {
  id: string
  email: string
  role: 'student' | 'stack_lead'
  stack_id: string
  status: InvitationStatus
  created_at: string
  expires_at: string
  stacks: { name: string } | null
}

export const LESSON_TYPES = ['video', 'pdf', 'text'] as const
export type LessonType = (typeof LESSON_TYPES)[number]

export interface Module {
  id: string
  stack_id: string
  title: string
  description: string | null
  order_index: number
  is_published: boolean
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  lesson_type: LessonType
  content_url: string | null
  content_path: string | null
  content_text: string | null
  duration_minutes: number | null
  order_index: number
  is_required: boolean
  is_published: boolean
}

export type ModuleWithLessons = Module & { lessons: Lesson[] }

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface Application {
  id: string
  full_name: string
  email: string
  phone: string | null
  stack_id: string
  motivation: string | null
  status: ApplicationStatus
  review_note: string | null
  created_at: string
  reviewed_at: string | null
  stacks: { name: string } | null
}
