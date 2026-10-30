import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { Table, Td, Th } from '@/components/ui/table'
import { useMyStacks } from '@/features/lead/use-my-stacks'
import { friendlyError } from '@/lib/errors'
import { fetchRoster, rosterKeys } from './api'

const daysAgo = (iso: string | null) => {
  if (!iso) return 'No activity yet'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
}

export function StudentsPage() {
  const { stacks, selected, select, isPending: stacksPending, error: stacksError } = useMyStacks()
  const stackId = selected?.id ?? ''
  const roster = useQuery({
    queryKey: rosterKeys.stack(stackId),
    queryFn: () => fetchRoster(stackId),
    enabled: !!stackId,
  })

  if (stacksPending) return <LoadingState />
  if (stacksError) return <ErrorState message={friendlyError(stacksError)} />
  if (!selected) {
    return (
      <>
        <PageHeader title="Students" />
        <EmptyState
          title="No stack assigned yet"
          description="An admin assigns you to a stack. Your students appear here."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Students"
        description={`Everyone learning in ${selected.name}, with their progress.`}
      />
      {stacks.length > 1 && (
        <div className="mb-6 max-w-xs">
          <label htmlFor="roster-stack" className="mb-1.5 block text-sm font-medium">
            Stack
          </label>
          <Select id="roster-stack" value={selected.id} onChange={(e) => select(e.target.value)}>
            {stacks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      {roster.isPending && <LoadingState />}
      {roster.error && (
        <ErrorState message={friendlyError(roster.error)} onRetry={() => void roster.refetch()} />
      )}
      {roster.data && roster.data.length === 0 && (
        <EmptyState
          title="No students yet"
          description="Approved applicants who join this stack appear here."
        />
      )}
      {roster.data && roster.data.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Student</Th>
              <Th>Contact</Th>
              <Th>Progress</Th>
              <Th>Lessons</Th>
              <Th>Assignments</Th>
              <Th>Last activity</Th>
            </tr>
          </thead>
          <tbody>
            {roster.data.map((r) => (
              <tr key={r.user_id}>
                <Td>
                  <p className="font-medium">{r.full_name ?? 'Name not set'}</p>
                  {r.status === 'completed' && <Badge variant="success">Completed</Badge>}
                </Td>
                <Td>
                  <p>{r.email}</p>
                  {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
                </Td>
                <Td>
                  <div className="flex min-w-32 items-center gap-2">
                    <Progress
                      value={r.overall}
                      label={`${r.full_name ?? r.email} progress`}
                      className="h-2 flex-1"
                    />
                    <span className="w-9 text-right text-xs tabular-nums">{r.overall}%</span>
                  </div>
                </Td>
                <Td className="tabular-nums">
                  {r.lessons_done} / {r.lessons_total}
                </Td>
                <Td className="tabular-nums">
                  {r.assignments_passed} / {r.assignments_total}
                </Td>
                <Td className="text-muted-foreground">{daysAgo(r.last_activity)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
