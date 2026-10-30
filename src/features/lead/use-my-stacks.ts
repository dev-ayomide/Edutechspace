import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { leadKeys, listMyStacks } from './api'

/** The stacks the signed-in lead manages, and which one is currently selected (via ?stack=<id>). */
export function useMyStacks() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [params, setParams] = useSearchParams()
  const query = useQuery({
    queryKey: leadKeys.stacks(userId ?? ''),
    queryFn: () => listMyStacks(userId!),
    enabled: !!userId,
  })
  const stacks = query.data ?? []
  const selected = stacks.find((s) => s.id === params.get('stack')) ?? stacks[0] ?? null
  const select = (id: string) => setParams({ stack: id }, { replace: true })
  return { ...query, stacks, selected, select }
}
