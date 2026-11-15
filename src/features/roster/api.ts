import { supabase } from '@/lib/supabase'
import type { MemberStatus } from '@/types/domain'

export const rosterKeys = { stack: (stackId: string) => ['roster', stackId] as const }

export interface RosterRow {
  user_id: string
  full_name: string | null
  email: string
  phone: string | null
  status: MemberStatus
  joined_at: string
  lessons_done: number
  lessons_total: number
  assignments_passed: number
  assignments_total: number
  overall: number
  last_activity: string | null
}

export async function fetchRoster(stackId: string): Promise<RosterRow[]> {
  const { data, error } = await supabase.rpc('stack_roster', { p_stack_id: stackId })
  if (error) throw error
  return (data ?? []) as RosterRow[]
}

export interface AttemptRow {
  kind: 'assignment' | 'exam'
  target_id: string
  title: string
  module_title: string | null
  attempts_used: number
  /** null means unlimited. Includes extra attempts already granted. */
  attempts_allowed: number | null
  passed: boolean
}

export const attemptKeys = {
  student: (stackId: string, userId: string) => ['attempts', stackId, userId] as const,
}

export async function fetchAttemptOverview(stackId: string, userId: string): Promise<AttemptRow[]> {
  const { data, error } = await supabase.rpc('attempt_overview', {
    p_user_id: userId,
    p_stack_id: stackId,
  })
  if (error) throw error
  return (data ?? []) as AttemptRow[]
}

export async function grantExtraAttempt(row: AttemptRow, userId: string) {
  const { error } = await supabase.rpc('grant_extra_attempts', {
    p_user_id: userId,
    p_assignment_id: row.kind === 'assignment' ? row.target_id : null,
    p_exam_id: row.kind === 'exam' ? row.target_id : null,
    p_extra: 1,
  })
  if (error) throw error
}
