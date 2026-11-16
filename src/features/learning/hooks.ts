import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/auth-context'
import {
  fetchCompletedLessonIds,
  fetchMemberships,
  fetchMyModuleStates,
  fetchMyProgress,
  fetchStackContent,
  learningKeys,
} from './api'
import { currentMembership } from './utils'

/** Everything the student screens need about the signed-in student's stack, in one place. */
export function useMyLearning() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const memberships = useQuery({
    queryKey: learningKeys.membership(userId),
    queryFn: () => fetchMemberships(userId),
    enabled: !!userId,
  })
  const membership = currentMembership(memberships.data ?? [])
  const stackId = membership?.stacks.id ?? ''
  const hasAccess = !!membership && membership.status !== 'withdrawn'

  const states = useQuery({
    queryKey: learningKeys.modules,
    queryFn: fetchMyModuleStates,
    enabled: hasAccess,
  })
  const content = useQuery({
    queryKey: learningKeys.content(stackId),
    queryFn: () => fetchStackContent(stackId),
    enabled: hasAccess,
  })
  const completions = useQuery({
    queryKey: learningKeys.completions,
    queryFn: fetchCompletedLessonIds,
    enabled: hasAccess,
  })
  const progress = useQuery({
    queryKey: learningKeys.progress,
    queryFn: fetchMyProgress,
    enabled: hasAccess,
  })

  const queries = [memberships, ...(hasAccess ? [states, content, completions, progress] : [])]
  return {
    userId,
    membership,
    hasAccess,
    modules: content.data ?? [],
    states: states.data ?? [],
    completedLessonIds: new Set(completions.data ?? []),
    progress: progress.data ?? null,
    isPending:
      queries.some((q) => q.isPending && q.fetchStatus !== 'idle') ||
      (!userId && memberships.isPending),
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
  }
}
