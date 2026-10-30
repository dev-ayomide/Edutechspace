import { supabase } from '@/lib/supabase'
import type { Application } from '@/types/domain'
import type { ApplicationInput } from './schemas'

export const admissionsKeys = {
  list: (scope: string) => ['applications', scope] as const,
  all: ['applications'] as const,
}

export async function submitApplication(input: ApplicationInput) {
  // The honeypot is checked here too: a filled hidden field means a bot, so pretend it worked.
  if (input.website) return
  const { error } = await supabase.from('stack_applications').insert({
    full_name: input.full_name,
    email: input.email.toLowerCase(),
    phone: input.phone || null,
    stack_id: input.stack_id,
    motivation: input.motivation || null,
  })
  if (error) throw error
}

export async function listApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from('stack_applications')
    .select(
      'id, full_name, email, phone, stack_id, motivation, status, review_note, created_at, reviewed_at, stacks(name)',
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as Application[]
}

export type ReviewResult =
  { status: 'rejected' } | { status: 'added' } | { status: 'approved'; emailSent: boolean }

export async function reviewApplication(
  id: string,
  approve: boolean,
  note: string,
): Promise<ReviewResult> {
  const { data, error } = await supabase.functions.invoke('review-application', {
    body: { application_id: id, approve, note: note || null },
  })
  if (error) {
    let message = 'Could not review the application.'
    const response = (error as { context?: Response }).context
    if (response && typeof response.json === 'function') {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      if (body?.error) message = body.error
    }
    throw new Error(message)
  }
  return data as ReviewResult
}
