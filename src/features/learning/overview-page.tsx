import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { ProgressRing } from '@/components/ui/progress-ring'
import { useAuth } from '@/features/auth/auth-context'
import { examKeys, fetchMyExam } from '@/features/exams/api'
import { examStateLabel } from '@/features/exams/utils'
import { friendlyError } from '@/lib/errors'
import { learningKeys, withdrawFromStack } from './api'
import { useMyLearning } from './hooks'
import { JourneyTrack } from './journey-track'
import { buildJourney, momentumMessage, nextUp } from './utils'

export function StudentOverviewPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const learning = useMyLearning()
  const exam = useQuery({
    queryKey: examKeys.mine,
    queryFn: fetchMyExam,
    enabled: learning.hasAccess,
  })
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
  const examLabel = examStateLabel(exam.data ?? null)
  const examStep =
    !next && exam.data && (exam.data.state === 'ready' || exam.data.state === 'in_progress')
      ? {
          to: '/dashboard/exam',
          title: exam.data.title,
          cta: exam.data.state === 'ready' ? 'Start the exam' : 'Continue the exam',
        }
      : !next && exam.data?.state === 'passed'
        ? {
            to: '/dashboard/certificate',
            title: 'You passed. Your certificate is ready.',
            cta: 'View certificate',
          }
        : null
  const upNext = next
    ? {
        title: next.title,
        context: next.moduleTitle,
        cta: 'Continue',
        to:
          next.kind === 'lesson'
            ? `/dashboard/stack/lessons/${next.lessonId}`
            : `/dashboard/stack/assignments/${next.assignmentId}`,
      }
    : examStep
      ? { title: examStep.title, context: '', cta: examStep.cta, to: examStep.to }
      : null
  const journey = buildJourney(
    learning.modules,
    learning.states,
    exam.data?.state ?? null,
    exam.data?.state === 'passed',
  )
  const title = name ? `Good to see you, ${name}.` : 'Good to see you.'

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
      <p className="-mt-4 mb-6 flex flex-wrap items-center gap-2 text-base text-muted-foreground">
        {membership.stacks.name}
        <Badge variant={membership.status === 'completed' ? 'gold' : 'primary'}>
          {membership.status === 'completed' ? 'Completed' : 'In progress'}
        </Badge>
      </p>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="grid items-center gap-8 p-7 sm:grid-cols-[auto_1fr] sm:p-9">
          <ProgressRing
            value={progress?.overall ?? 0}
            label="Overall progress toward certification"
            className="mx-auto"
          />
          <div>
            <h2 className="font-display text-3xl leading-[1.05] font-extrabold tracking-tight">
              {momentumMessage(progress?.overall ?? 0)}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {progress?.lessons_done ?? 0} of {progress?.lessons_total ?? 0} lessons done ·{' '}
              {progress?.assignments_passed ?? 0} of {progress?.assignments_total ?? 0} assignments
              passed
            </p>
          </div>
        </Card>
        <Card tone="accent" lift="lg" className="flex flex-col justify-between gap-8 p-7">
          {upNext ? (
            <>
              <div>
                <p className="text-xs font-extrabold tracking-[0.14em] uppercase">
                  Up next{upNext.context ? ` · ${upNext.context}` : ''}
                </p>
                <p className="mt-3 font-display text-3xl leading-none font-extrabold tracking-tight">
                  {upNext.title}
                </p>
              </div>
              <Button asChild size="lg" className="w-full justify-between">
                <Link to={upNext.to}>
                  {upNext.cta}
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
              </Button>
            </>
          ) : (
            <p className="font-display text-2xl leading-tight font-extrabold tracking-tight">
              {learning.modules.length === 0
                ? 'Your stack lead has not published any modules yet. Check back soon.'
                : 'Nothing waiting for you right now.'}
            </p>
          )}
        </Card>
      </div>
      <section aria-labelledby="journey-heading" className="mt-10">
        <h2
          id="journey-heading"
          className="mb-5 font-display text-2xl font-extrabold tracking-tight"
        >
          Your journey
        </h2>
        <Card className="p-6 sm:p-8">
          <JourneyTrack stops={journey} />
        </Card>
      </section>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Lessons completed"
          value={`${progress?.lessons_done ?? 0} / ${progress?.lessons_total ?? 0}`}
        />
        <StatCard
          label="Assignments passed"
          value={`${progress?.assignments_passed ?? 0} / ${progress?.assignments_total ?? 0}`}
        />
        <StatCard label="Final exam" value={examLabel.text} hint={examLabel.hint} />
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
