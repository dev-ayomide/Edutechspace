import { supabase } from '@/lib/supabase'
import type { Invitation, Profile, Role } from '@/types/domain'

export const adminKeys = {
  overview: ['admin', 'overview'] as const,
  invitations: ['admin', 'invitations'] as const,
  users: ['admin', 'users'] as const,
}

export interface AdminOverview {
  stacks: number
  leads: number
  students: number
  pendingInvitations: number
  pendingApplications: number
  activeSignatories: number
}

async function headCount(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
) {
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

const head = { count: 'exact', head: true } as const

export async function fetchOverview(): Promise<AdminOverview> {
  const [stacks, leads, students, pendingInvitations, pendingApplications, activeSignatories] =
    await Promise.all([
      headCount(supabase.from('stacks').select('*', head).eq('is_active', true)),
      headCount(supabase.from('profiles').select('*', head).eq('role', 'stack_lead')),
      headCount(supabase.from('stack_members').select('*', head).eq('status', 'active')),
      headCount(supabase.from('invitations').select('*', head).eq('status', 'pending')),
      headCount(supabase.from('stack_applications').select('*', head).eq('status', 'pending')),
      headCount(supabase.from('certificate_signatories').select('*', head).eq('is_active', true)),
    ])
  return { stacks, leads, students, pendingInvitations, pendingApplications, activeSignatories }
}

export async function listInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('id, email, role, stack_id, status, created_at, expires_at, stacks(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as Invitation[]
}

export type InviteResult = { status: 'invited' | 'assigned' }

/** Invites a lead (or assigns an existing lead). Goes through the Edge Function so the email is sent. */
export async function inviteLead(email: string, stackId: string): Promise<InviteResult> {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: { email, stack_id: stackId },
  })
  if (error) {
    let message = 'Could not send the invitation.'
    const response = (error as { context?: Response }).context
    if (response && typeof response.json === 'function') {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      if (body?.error) message = body.error
    }
    throw new Error(message)
  }
  return data as InviteResult
}

export async function revokeInvitation(id: string) {
  const { error } = await supabase.rpc('revoke_invitation', { p_invitation_id: id })
  if (error) throw error
}

export interface AdminUser extends Pick<Profile, 'id' | 'email' | 'full_name' | 'phone' | 'role'> {
  stack_leads: { stack_id: string; stacks: { name: string } | null }[]
  stack_members: { status: string; stacks: { name: string } | null }[]
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, phone, role, stack_leads(stack_id, stacks(name)), stack_members(status, stacks(name))',
    )
    .order('email')
  if (error) throw error
  return data as unknown as AdminUser[]
}

export async function setUserRole(userId: string, role: Role) {
  const { error } = await supabase.rpc('admin_set_role', { p_user_id: userId, p_role: role })
  if (error) throw error
}

export async function removeLeadFromStack(userId: string, stackId: string) {
  const { error } = await supabase.rpc('remove_lead_from_stack', {
    p_user_id: userId,
    p_stack_id: stackId,
  })
  if (error) throw error
}
