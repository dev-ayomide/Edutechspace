import { supabase } from '@/lib/supabase'
import type { Submission } from '@/types/domain'

export const reviewKeys = { all: ['reviews'] as const }

export interface ReviewItem extends Submission {
  profiles: { full_name: string | null; email: string } | null
  assignments: {
    title: string
    max_score: number
    pass_mark: number
    instructions: string | null
    modules: { title: string; stacks: { name: string } | null } | null
  }
}

/** Project submissions for the lead's stacks (quizzes are graded automatically and never queue). */
export async function listProjectSubmissions(): Promise<ReviewItem[]> {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select(
      // Two links to profiles (the student and the grader), so name the one we mean: the student.
      '*, profiles:profiles!assignment_submissions_user_id_fkey(full_name, email), assignments!inner(title, max_score, pass_mark, instructions, type, modules(title, stacks(name)))',
    )
    .eq('assignments.type', 'submission')
    .order('submitted_at', { ascending: false })
  if (error) throw error
  return data as unknown as ReviewItem[]
}

export async function gradeSubmission(
  id: string,
  score: number | null,
  feedback: string,
  requestResubmission: boolean,
) {
  const { error } = await supabase.rpc('grade_submission', {
    p_submission_id: id,
    p_score: score,
    p_feedback: feedback || null,
    p_request_resubmission: requestResubmission,
  })
  if (error) throw error
}
