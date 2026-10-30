import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/states'
import { StatCard } from '@/components/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/features/auth/auth-context'
import { friendlyError } from '@/lib/errors'
import { learningKeys, withdrawFromStack } from './api'
import { useMyLearning } from './hooks'
import { nextUp } from './utils'

export function StudentOverviewPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const learning = useMyLearning()
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const name = profile?.full_name?.split(' ')[0]

  const withdraw = useMutation({
    mutationFn: withdrawFromStack,
    onSuccess: async () => {
      toast.success('You have withdrawn from the stack. Your progress is kept.')
      setConfirmWithdraw(false)
      await queryClient.invalidateQueries({ queryKey: learningKeys.all })
    },
    onError: (e) => {
      toast.error(friendlyError(e))
      setConfirmWithdraw(false)
    },
  })

  const { membership, progress } = learning
  const next = nextUp(learning.modules, learning.states, learning.completedLessonIds)
  const title = name ? `Welcome, ${name}` : 'Welcome'

  if (learning.isPending) {
    return (
      <>
        <PageHeader title={title} />
        <LoadingState rows={2} />
      </>
    )
  }
  if (learning.error)
    return (
      <ErrorState message={friendlyError(learning.error)} onRetry={() => void learning.refetch()} />
    )

  if (!membership || membership.status === 'withdrawn') {
    return (
      <>
        <PageHeader title={title} description="Your learning at a glance." />
        <Card>
          <CardTitle>
            {membership
              ? `You withdrew from ${membership.stacks.name}`
              : 'You are not in a stack yet'}
          </CardTitle>
          <CardDescription className="mt-1">
            {membership
              ? 'You can apply to a new stack whenever you are ready.'
              : 'Apply to a stack. Once a stack lead approves you, your progress toward certification appears here.'}
          </CardDescription>
          <Button asChild className="mt-4">
            <Link to="/join">Apply to a stack</Link>
          </Button>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={title}
        description="Your learning at a glance."
        actions={
          membership.status === 'active' && (
            <Button variant="outline" onClick={() => setConfirmWithdraw(true)}>
              Withdraw from stack
            </Button>
          )
        }
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">{membership.stacks.name}</CardTitle>
          <Badge variant={membership.status === 'completed' ? 'success' : 'primary'}>
            {membership.status === 'completed' ? 'Completed' : 'In progress'}
          </Badge>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Progress
            value={progress?.overall ?? 0}
            label="Overall progress toward certification"
            className="flex-1"
          />
          <span className="text-lg font-bold tabular-nums">{progress?.overall ?? 0}%</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Progress toward your certificate.</p>
        {next && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Up next · {next.moduleTitle}
              </p>
              <p className="font-medium">{next.title}</p>
            </div>
            <Button asChild>
              <Link
                to={
                  next.kind === 'lesson'
                    ? `/dashboard/stack/lessons/${next.lessonId}`
                    : `/dashboard/stack/assignments/${next.assignmentId}`
                }
              >
                Continue
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        )}
        {!next && learning.modules.length === 0 && (
          <p className="mt-5 text-sm text-muted-foreground">
            Your stack lead has not published any modules yet. Check back soon.
          </p>
        )}
      </Card>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Lessons completed"
          value={`${progress?.lessons_done ?? 0} / ${progress?.lessons_total ?? 0}`}
        />
        <StatCard
          label="Assignments passed"
          value={`${progress?.assignments_passed ?? 0} / ${progress?.assignments_total ?? 0}`}
        />
        <StatCard label="Final exam" value="Not yet" hint="Opens once the exam is available" />
      </dl>
      <Button asChild variant="ghost" className="mt-4">
        <Link to="/dashboard/stack">View all modules</Link>
      </Button>
      <ConfirmDialog
        open={confirmWithdraw}
        onOpenChange={setConfirmWithdraw}
        title="Withdraw from this stack?"
        description="You will lose access to the lessons and assignments. Your progress is kept, and you can apply to a stack again later."
        confirmLabel="Withdraw"
        loading={withdraw.isPending}
        onConfirm={() => withdraw.mutate()}
      />
    </>
  )
}
