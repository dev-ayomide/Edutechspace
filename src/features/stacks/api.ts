import { supabase } from '@/lib/supabase'
import type { Stack } from '@/types/domain'
import type { StackInput } from './schemas'

export const stackKeys = {
  all: ['stacks'] as const,
  summaries: ['stacks', 'summaries'] as const,
}

export interface StackSummary extends Stack {
  lead_count: number
  member_count: number
}

export async function listStacks(): Promise<Stack[]> {
  const { data, error } = await supabase.from('stacks').select('*').order('name')
  if (error) throw error
  return data as Stack[]
}

/** Admin view: every stack with how many leads and members it has. */
export async function listStackSummaries(): Promise<StackSummary[]> {
  const { data, error } = await supabase
    .from('stacks')
    .select('*, stack_leads(count), stack_members(count)')
    .order('name')
  if (error) throw error
  return (data ?? []).map((row) => {
    const { stack_leads, stack_members, ...stack } = row as Stack & {
      stack_leads: { count: number }[]
      stack_members: { count: number }[]
    }
    return {
      ...stack,
      lead_count: stack_leads[0]?.count ?? 0,
      member_count: stack_members[0]?.count ?? 0,
    }
  })
}

export async function saveStack(input: StackInput, id?: string) {
  const row = { name: input.name, slug: input.slug, description: input.description || null }
  const { error } = id
    ? await supabase.from('stacks').update(row).eq('id', id)
    : await supabase.from('stacks').insert(row)
  if (error) throw error
}

export async function setStackActive(id: string, isActive: boolean) {
  const { error } = await supabase.from('stacks').update({ is_active: isActive }).eq('id', id)
  if (error) throw error
}
