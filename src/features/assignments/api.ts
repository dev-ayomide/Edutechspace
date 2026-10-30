import { supabase } from '@/lib/supabase'
import type { Assignment } from '@/types/domain'
import { toRpcQuestions, type QuestionWithKey } from '@/features/quiz/schemas'
import type { AssignmentInput } from './schemas'

export type QuizQuestionWithKey = QuestionWithKey

/** Lead/admin only: questions together with their answer keys. */
export async function fetchQuizForEditing(assignmentId: string): Promise<QuizQuestionWithKey[]> {
  const { data, error } = await supabase
    .from('assignment_questions')
    .select('prompt, options, points, order_index, assignment_answer_keys(correct_index)')
    .eq('assignment_id', assignmentId)
    .order('order_index')
  if (error) throw error
  return (
    data as unknown as (Omit<QuizQuestionWithKey, 'correct_index'> & {
      assignment_answer_keys: { correct_index: number } | { correct_index: number }[] | null
    })[]
  ).map((q) => {
    const key = Array.isArray(q.assignment_answer_keys)
      ? q.assignment_answer_keys[0]
      : q.assignment_answer_keys
    return {
      prompt: q.prompt,
      options: q.options,
      points: q.points,
      correct_index: key?.correct_index ?? 0,
    }
  })
}

/**
 * Saves an assignment. Quizzes are written draft-first so the database's "needs questions to publish"
 * rule can be satisfied: row -> questions -> publish.
 */
export async function saveAssignment(
  moduleId: string,
  input: AssignmentInput,
  existing: Assignment | null,
) {
  const row = {
    title: input.title,
    type: input.type,
    instructions: input.instructions.trim() || null,
    max_score: Number(input.max_score),
    pass_mark: Number(input.pass_mark),
    max_attempts: input.max_attempts ? Number(input.max_attempts) : null,
  }

  let id = existing?.id
  if (!id) {
    const { data, error } = await supabase
      .from('assignments')
      .insert({ ...row, module_id: moduleId, is_published: false })
      .select('id')
      .single()
    if (error) throw error
    id = data.id as string
  }

  if (input.type === 'quiz') {
    const questions = toRpcQuestions(input.questions)
    const { error } = await supabase.rpc('save_quiz', {
      p_assignment_id: id,
      p_questions: questions,
    })
    if (error) throw error
  }

  const { error } = await supabase
    .from('assignments')
    .update({ ...row, is_published: input.is_published })
    .eq('id', id)
  if (error) throw error
}

export async function deleteAssignment(id: string) {
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) throw error
}
