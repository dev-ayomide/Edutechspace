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

export type AssignmentType = 'quiz' | 'submission'

export interface Assignment {
  id: string
  module_id: string
  title: string
  type: AssignmentType
  instructions: string | null
  max_score: number
  pass_mark: number
  max_attempts: number | null
  is_published: boolean
}

export type ModuleWithLessons = Module & { lessons: Lesson[]; assignments: Assignment[] }

export interface QuizQuestion {
  id: string
  assignment_id: string
  prompt: string
  options: string[]
  points: number
  order_index: number
}

export type SubmissionStatus = 'submitted' | 'graded' | 'needs_resubmission'

export interface Submission {
  id: string
  assignment_id: string
  user_id: string
  attempt: number
  content_text: string | null
  content_url: string | null
  file_path: string | null
  status: SubmissionStatus
  score: number | null
  feedback: string | null
  graded_at: string | null
  submitted_at: string
}

/** Per-module state computed by the database (my_modules). The server decides what is locked or complete. */
export interface ModuleState {
  module_id: string
  unlocked: boolean
  complete: boolean
  lessons_total: number
  lessons_done: number
  assignment_id: string | null
  assignment_passed: boolean | null
  attempts_used: number
  best_score: number | null
}

export interface Progress {
  lessons_total: number
  lessons_done: number
  assignments_total: number
  assignments_passed: number
  assignment_pct: number
  exam_pct: number
  overall: number
}

export type MemberStatus = 'active' | 'completed' | 'withdrawn'

export interface Membership {
  id: string
  status: MemberStatus
  joined_at: string
  stacks: Pick<Stack, 'id' | 'name' | 'slug'>
}

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
