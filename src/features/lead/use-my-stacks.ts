import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { listStacks } from '@/features/stacks/api'
import { leadKeys, listMyStacks } from './api'

/**
 * The stacks the signed-in person manages, and which one is selected (via ?stack=<id>).
 * Leads get the stacks they are assigned to; admins get every stack, so the same content,
 * exam and student screens let an admin step in on any stack.
 */
export function useMyStacks() {
  const { session, role } = useAuth()
  const userId = session?.user.id
  const isAdmin = role === 'admin'
  const [params, setParams] = useSearchParams()
  const query = useQuery({
    queryKey: isAdmin ? ['admin', 'stacks', 'all'] : leadKeys.stacks(userId ?? ''),
    queryFn: () => (isAdmin ? listStacks() : listMyStacks(userId!)),
    enabled: !!userId,
  })
  const stacks = query.data ?? []
  const selected = stacks.find((s) => s.id === params.get('stack')) ?? stacks[0] ?? null
  const select = (id: string) => setParams({ stack: id }, { replace: true })
  return { ...query, stacks, selected, select }
}
