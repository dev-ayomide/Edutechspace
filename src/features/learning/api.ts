import { supabase } from '@/lib/supabase'
import type {
  Assignment,
  Lesson,
  Membership,
  ModuleState,
  ModuleWithLessons,
  Progress,
  QuizQuestion,
  Submission,
} from '@/types/domain'

export const learningKeys = {
  membership: (userId: string) => ['learning', 'membership', userId] as const,
  modules: ['learning', 'modules'] as const,
  content: (stackId: string) => ['learning', 'content', stackId] as const,
  completions: ['learning', 'completions'] as const,
  progress: ['learning', 'progress'] as const,
  lesson: (id: string) => ['learning', 'lesson', id] as const,
  assignment: (id: string) => ['learning', 'assignment', id] as const,
  latestSubmissions: ['learning', 'latest-submissions'] as const,
  all: ['learning'] as const,
}

export async function fetchMemberships(userId: string): Promise<Membership[]> {
  const { data, error } = await supabase
    .from('stack_members')
    .select('id, status, joined_at, stacks(id, name, slug)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
  if (error) throw error
  return data as unknown as Membership[]
}

export async function fetchMyModuleStates(): Promise<ModuleState[]> {
  const { data, error } = await supabase.rpc('my_modules')
  if (error) throw error
  return (data ?? []) as ModuleState[]
}

/** Published modules with the lessons and assignments the student may currently open (RLS hides locked ones). */
export async function fetchStackContent(stackId: string): Promise<ModuleWithLessons[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*, lessons(*), assignments(*)')
    .eq('stack_id', stackId)
    .eq('is_published', true)
    .order('order_index')
  if (error) throw error
  return (data as ModuleWithLessons[]).map((m) => ({
    ...m,
    lessons: [...m.lessons].sort((a, b) => a.order_index - b.order_index),
  }))
}

export async function fetchCompletedLessonIds(): Promise<string[]> {
  const { data, error } = await supabase.from('lesson_completions').select('lesson_id')
  if (error) throw error
  return data.map((r) => r.lesson_id as string)
}

export async function fetchMyProgress(): Promise<Progress | null> {
  const { data, error } = await supabase.rpc('my_progress')
  if (error) throw error
  const row = data as Progress | null
  return row && row.overall !== null ? row : null
}

export async function completeLesson(lessonId: string) {
  const { error } = await supabase.rpc('complete_lesson', { p_lesson_id: lessonId })
  if (error) throw error
}

export async function withdrawFromStack() {
  const { error } = await supabase.rpc('withdraw_from_active_stack')
  if (error) throw error
}

export type LessonWithModule = Lesson & { modules: { title: string; stack_id: string } }

export async function fetchLesson(id: string): Promise<LessonWithModule | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*, modules(title, stack_id)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as LessonWithModule | null
}

export async function getLessonFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('lesson-media').createSignedUrl(path, 60 * 30)
  if (error) throw error
  return data.signedUrl
}

export interface AssignmentDetail {
  assignment: Assignment & { modules: { title: string; stack_id: string } }
  questions: QuizQuestion[]
  submissions: Submission[]
}

export async function fetchAssignmentDetail(
  id: string,
  userId: string,
): Promise<AssignmentDetail | null> {
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('*, modules(title, stack_id)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!assignment) return null
  const [questions, submissions] = await Promise.all([
    supabase.from('assignment_questions').select('*').eq('assignment_id', id).order('order_index'),
    supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', id)
      .eq('user_id', userId)
      .order('attempt', { ascending: false }),
  ])
  if (questions.error) throw questions.error
  if (submissions.error) throw submissions.error
  return {
    assignment: assignment as AssignmentDetail['assignment'],
    questions: questions.data as QuizQuestion[],
    submissions: submissions.data as Submission[],
  }
}

export interface QuizResult {
  score: number
  max_score: number
  passed: boolean
}

export async function submitQuiz(assignmentId: string, answers: number[]): Promise<QuizResult> {
  const { data, error } = await supabase.rpc('submit_quiz', {
    p_assignment_id: assignmentId,
    p_answers: answers,
  })
  if (error) throw error
  return data as QuizResult
}

export interface WorkSubmission {
  text: string
  url: string
  file: File | null
}

/** Uploads the optional file first (to the student's own folder), then records the submission. */
export async function submitWork(
  stackId: string,
  userId: string,
  assignmentId: string,
  work: WorkSubmission,
) {
  let filePath: string | null = null
  if (work.file) {
    const safe = work.file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80)
    filePath = `${stackId}/${userId}/${assignmentId}/${crypto.randomUUID()}-${safe}`
    const { error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(filePath, work.file, { contentType: work.file.type })
    if (uploadError) throw uploadError
  }
  const { error } = await supabase.rpc('submit_assignment', {
    p_assignment_id: assignmentId,
    p_text: work.text || null,
    p_url: work.url || null,
    p_file_path: filePath,
  })
  if (error) {
    if (filePath) await supabase.storage.from('submissions').remove([filePath])
    throw error
  }
}

export async function getSubmissionFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('submissions').createSignedUrl(path, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

export async function fetchLatestSubmissions(
  assignmentIds: string[],
): Promise<Map<string, Submission>> {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('*')
    .in('assignment_id', assignmentIds)
    .order('attempt', { ascending: false })
  if (error) throw error
  const latest = new Map<string, Submission>()
  for (const s of data as Submission[])
    if (!latest.has(s.assignment_id)) latest.set(s.assignment_id, s)
  return latest
}
