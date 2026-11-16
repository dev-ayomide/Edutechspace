import { supabase } from '@/lib/supabase'
import type { Stack } from '@/types/domain'

export const leadKeys = {
  stacks: (userId: string) => ['lead', 'stacks', userId] as const,
  summary: (stackId: string) => ['lead', 'summary', stackId] as const,
  attention: ['lead', 'attention'] as const,
}

export async function listMyStacks(userId: string): Promise<Stack[]> {
  const { data, error } = await supabase
    .from('stack_leads')
    .select('stacks(*)')
    .eq('user_id', userId)
  if (error) throw error
  return (data as unknown as { stacks: Stack | null }[])
    .map((row) => row.stacks)
    .filter((s): s is Stack => s !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export interface StackContentSummary {
  modules: number
  publishedModules: number
  lessons: number
  publishedLessons: number
  students: number
}

export async function fetchStackSummary(stackId: string): Promise<StackContentSummary> {
  const [modules, lessons, students] = await Promise.all([
    supabase.from('modules').select('id, is_published').eq('stack_id', stackId),
    supabase
      .from('lessons')
      .select('id, is_published, modules!inner(stack_id)')
      .eq('modules.stack_id', stackId),
    supabase
      .from('stack_members')
      .select('*', { count: 'exact', head: true })
      .eq('stack_id', stackId)
      .eq('status', 'active'),
  ])
  if (modules.error) throw modules.error
  if (lessons.error) throw lessons.error
  if (students.error) throw students.error
  return {
    modules: modules.data.length,
    publishedModules: modules.data.filter((m) => m.is_published).length,
    lessons: lessons.data.length,
    publishedLessons: lessons.data.filter((l) => l.is_published).length,
    students: students.count ?? 0,
  }
}

export interface LeadAttention {
  applications: number
  submissions: number
}

/** What is waiting for this lead (the database only counts what their stacks allow them to see). */
export async function fetchLeadAttention(): Promise<LeadAttention> {
  const head = { count: 'exact', head: true } as const
  const [apps, subs] = await Promise.all([
    supabase.from('stack_applications').select('*', head).eq('status', 'pending'),
    supabase.from('assignment_submissions').select('*', head).eq('status', 'submitted'),
  ])
  if (apps.error) throw apps.error
  if (subs.error) throw subs.error
  return { applications: apps.count ?? 0, submissions: subs.count ?? 0 }
}
