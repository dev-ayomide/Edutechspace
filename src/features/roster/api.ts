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
