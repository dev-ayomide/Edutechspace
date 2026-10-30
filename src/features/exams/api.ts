import { toRpcQuestions, type QuestionWithKey } from '@/features/quiz/schemas'
import { supabase } from '@/lib/supabase'
import type { Exam, ExamQuestion, MyExam } from '@/types/domain'
import type { ExamInput } from './schemas'

export const examKeys = {
  mine: ['exam', 'mine'] as const,
  questions: (examId: string) => ['exam', 'questions', examId] as const,
  forStack: (stackId: string) => ['exam', 'stack', stackId] as const,
  all: ['exam'] as const,
}

export async function fetchMyExam(): Promise<MyExam | null> {
  const { data, error } = await supabase.rpc('my_exam')
  if (error) throw error
  return (data ?? null) as MyExam | null
}

export async function startExam(examId: string): Promise<MyExam> {
  const { data, error } = await supabase.rpc('start_exam', { p_exam_id: examId })
  if (error) throw error
  return data as MyExam
}

/** Readable only while the student holds a running attempt (enforced by the database). */
export async function fetchExamQuestions(examId: string): Promise<ExamQuestion[]> {
  const { data, error } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('exam_id', examId)
    .order('order_index')
  if (error) throw error
  return data as ExamQuestion[]
}

export interface ExamResult {
  score: number
  max_score: number
  percent: number
  passed: boolean
  expired: boolean
  certificate_id: string | null
}

export async function submitExam(attemptId: string, answers: number[]): Promise<ExamResult> {
  const { data, error } = await supabase.rpc('submit_exam', {
    p_attempt_id: attemptId,
    p_answers: answers,
  })
  if (error) throw error
  return data as ExamResult
}

// ------------------------------------------------------------ lead / admin authoring

export interface ExamForEditing {
  exam: Exam
  questions: QuestionWithKey[]
}

export async function fetchExamForEditing(stackId: string): Promise<ExamForEditing | null> {
  const { data: exam, error } = await supabase
    .from('exams')
    .select('*')
    .eq('stack_id', stackId)
    .maybeSingle()
  if (error) throw error
  if (!exam) return null
  const { data, error: qError } = await supabase
    .from('exam_questions')
    .select('prompt, options, points, order_index, exam_answer_keys(correct_index)')
    .eq('exam_id', exam.id)
    .order('order_index')
  if (qError) throw qError
  const questions = (
    data as unknown as (Omit<QuestionWithKey, 'correct_index'> & {
      exam_answer_keys: { correct_index: number } | { correct_index: number }[] | null
    })[]
  ).map((q) => {
    const key = Array.isArray(q.exam_answer_keys) ? q.exam_answer_keys[0] : q.exam_answer_keys
    return {
      prompt: q.prompt,
      options: q.options,
      points: q.points,
      correct_index: key?.correct_index ?? 0,
    }
  })
  return { exam: exam as Exam, questions }
}

export async function createExam(stackId: string): Promise<void> {
  const { error } = await supabase.from('exams').insert({ stack_id: stackId })
  if (error) throw error
}

/** Draft-first, like assignments: row -> questions -> publish, so the "needs questions" rule can be met. */
export async function saveExam(examId: string, input: ExamInput) {
  const row = {
    title: input.title,
    instructions: input.instructions.trim() || null,
    time_limit_minutes: input.time_limit_minutes ? Number(input.time_limit_minutes) : null,
    pass_mark: Number(input.pass_mark),
    max_attempts: input.max_attempts ? Number(input.max_attempts) : null,
    cooldown_hours: Number(input.cooldown_hours),
  }
  const { error: e1 } = await supabase.from('exams').update(row).eq('id', examId)
  if (e1) throw e1
  const { error: e2 } = await supabase.rpc('save_exam_questions', {
    p_exam_id: examId,
    p_questions: toRpcQuestions(input.questions),
  })
  if (e2) throw e2
  const { error: e3 } = await supabase
    .from('exams')
    .update({ is_published: input.is_published })
    .eq('id', examId)
  if (e3) throw e3
}
