import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/states'
import { StackCover } from '@/components/stack-cover'
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

  const initials = (profile?.full_name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-full bg-brand text-xl font-bold text-brand-foreground"
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-muted-foreground">
            {membership.stacks.name}
            <Badge variant={membership.status === 'completed' ? 'gold' : 'neutral'}>
              {membership.status === 'completed' ? 'Completed' : 'In progress'}
            </Badge>
          </p>
        </div>
        {membership.status === 'active' && (
          <Button variant="ghost" size="sm" onClick={() => setConfirmWithdraw(true)}>
            Withdraw from stack
          </Button>
        )}
      </header>

      {upNext ? (
        <Link
          to={upNext.to}
          className="group grid overflow-hidden rounded-lg border transition-colors hover:bg-surface md:grid-cols-[300px_1fr]"
        >
          <StackCover
            slug={membership.stacks.slug}
            showTag={false}
            className="h-full min-h-40 rounded-none md:aspect-auto"
          />
          <div className="flex flex-col gap-1.5 p-6 md:px-7">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Continue learning
            </p>
            <p className="text-xl font-extrabold group-hover:text-primary">{upNext.title}</p>
            {upNext.context && <p className="text-muted-foreground">{upNext.context}</p>}
            <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
              <div className="h-1.5 min-w-40 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progress?.overall ?? 0}%` }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums">
                {progress?.overall ?? 0}% of the stack
              </span>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground">
                {upNext.cta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <Card className="text-lg font-semibold">
          {learning.modules.length === 0
            ? 'Your stack lead has not published any modules yet. Check back soon.'
            : 'Nothing waiting for you right now.'}
        </Card>
      )}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="journey-heading" className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 id="journey-heading" className="text-lg font-bold">
              Your journey
            </h2>
            <Link to="/dashboard/stack" className="text-sm font-bold text-link hover:underline">
              View all modules
            </Link>
          </div>
          <JourneyTrack stops={journey} />
        </section>

        <aside className="grid gap-5">
          <section aria-labelledby="progress-heading" className="rounded-lg border">
            <h2 id="progress-heading" className="border-b px-5 py-4 text-lg font-bold">
              Progress
            </h2>
            <div className="flex items-center gap-4 border-b px-5 py-4">
              <ProgressRing
                value={progress?.overall ?? 0}
                label="Overall progress toward certification"
                size={84}
                compact
              />
              <p className="text-sm text-muted-foreground">
                <b className="block text-base text-foreground">
                  {momentumMessage(progress?.overall ?? 0)}
                </b>
                Lessons count for 40%, assignments 30% and the final exam 30%.
              </p>
            </div>
            <dl className="grid grid-cols-3 divide-x">
              {[
                [
                  `${progress?.lessons_done ?? 0} / ${progress?.lessons_total ?? 0}`,
                  'Lessons completed',
                ],
                [
                  `${progress?.assignments_passed ?? 0} / ${progress?.assignments_total ?? 0}`,
                  'Assignments passed',
                ],
                [examLabel.text, 'Final exam'],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col-reverse px-4 py-3.5">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-lg font-extrabold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            {examLabel.hint && (
              <p className="border-t px-5 py-3 text-xs text-muted-foreground">{examLabel.hint}</p>
            )}
          </section>
        </aside>
      </div>
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
