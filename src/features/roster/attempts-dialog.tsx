import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { friendlyError } from '@/lib/errors'
import {
  attemptKeys,
  fetchAttemptOverview,
  grantExtraAttempt,
  rosterKeys,
  type AttemptRow,
  type RosterRow,
} from './api'

const isOut = (r: AttemptRow) =>
  !r.passed && r.attempts_allowed !== null && r.attempts_used >= r.attempts_allowed

/** A student's attempts on every assignment and the exam, with "give one more attempt" where they are stuck. */
export function AttemptsDialog({
  stackId,
  student,
  onOpenChange,
}: {
  stackId: string
  student: RosterRow | null
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const userId = student?.user_id ?? ''
  const rows = useQuery({
    queryKey: attemptKeys.student(stackId, userId),
    queryFn: () => fetchAttemptOverview(stackId, userId),
    enabled: !!userId,
  })
  const grant = useMutation({
    mutationFn: (row: AttemptRow) => grantExtraAttempt(row, userId),
    onSuccess: async (_d, row) => {
      toast.success(`Gave one more attempt at ${row.title}.`)
      await queryClient.invalidateQueries({ queryKey: attemptKeys.student(stackId, userId) })
      await queryClient.invalidateQueries({ queryKey: rosterKeys.stack(stackId) })
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const name = student?.full_name ?? student?.email ?? ''
  const canGrant = student?.status === 'active'

  return (
    <Dialog open={!!student} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Attempts: ${name}`}
        description="When a student has used every attempt without passing, give them another one here."
        className="max-w-2xl"
      >
        {rows.isPending && <LoadingState rows={2} />}
        {rows.error && (
          <ErrorState message={friendlyError(rows.error)} onRetry={() => void rows.refetch()} />
        )}
        {rows.data && rows.data.length === 0 && (
          <EmptyState
            title="Nothing to attempt yet"
            description="This stack has no published assignments or exam."
          />
        )}
        {rows.data && rows.data.length > 0 && (
          <ul className="divide-y divide-border">
            {rows.data.map((r) => (
              <li key={r.target_id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {r.kind === 'exam' ? `Final exam: ${r.title}` : r.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.module_title ? `${r.module_title} · ` : ''}
                    {r.attempts_allowed === null
                      ? `${r.attempts_used} attempts, unlimited`
                      : `${r.attempts_used} of ${r.attempts_allowed} attempts used`}
                  </p>
                </div>
                {r.passed ? (
                  <Badge variant="success">Passed</Badge>
                ) : isOut(r) ? (
                  <Badge variant="danger">Out of attempts</Badge>
                ) : null}
                {canGrant && !r.passed && r.attempts_allowed !== null && (
                  <Button
                    size="sm"
                    variant={isOut(r) ? 'primary' : 'outline'}
                    loading={grant.isPending && grant.variables?.target_id === r.target_id}
                    onClick={() => grant.mutate(r)}
                  >
                    Give 1 more attempt
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
