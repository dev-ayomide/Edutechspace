import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { examKeys, fetchMyExam } from '@/features/exams/api'
import { examStateLabel } from '@/features/exams/utils'
import { friendlyError } from '@/lib/errors'
import { useMyLearning } from './hooks'
import { moduleStatus, percent } from './utils'

function Bar({
  label,
  weight,
  value,
  detail,
}: {
  label: string
  weight: number
  value: number
  detail: string
}) {
  return (
    <div className="rounded-2xl border-2 border-outline bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">{label}</p>
          <p className="text-xs font-semibold text-muted-foreground">{weight}% of the total</p>
        </div>
        <p className="font-display text-4xl leading-none font-extrabold tracking-tighter tabular-nums">
          {value}
          <span className="text-xl">%</span>
        </p>
      </div>
      <Progress value={value} label={label} className="mt-4" />
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

export function ProgressPage() {
  const learning = useMyLearning()
  const exam = useQuery({
    queryKey: examKeys.mine,
    queryFn: fetchMyExam,
    enabled: learning.hasAccess,
  })
  if (learning.isPending) {
    return (
      <>
        <PageHeader title="Progress" />
        <LoadingState />
      </>
    )
  }
  if (learning.error)
    return (
      <ErrorState message={friendlyError(learning.error)} onRetry={() => void learning.refetch()} />
    )
  if (!learning.hasAccess) {
    return (
      <>
        <PageHeader title="Progress" />
        <EmptyState
          title="Nothing to track yet"
          description="Once you are in a stack, your progress toward certification shows here."
        />
      </>
    )
  }

  const p = learning.progress
  const lessonsPct = percent(p?.lessons_done ?? 0, p?.lessons_total ?? 0)
  const assignmentsPct = Math.round((p?.assignment_pct ?? 0) * 100)
  const examPct = Math.round((p?.exam_pct ?? 0) * 100)
  const examLabel = examStateLabel(exam.data ?? null)

  return (
    <>
      <PageHeader title="Progress" description="How close you are to your certificate." />
      <Card>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Overall</CardTitle>
          <p className="font-display text-6xl leading-none font-extrabold tracking-tighter tabular-nums">
            {p?.overall ?? 0}
            <span className="text-3xl">%</span>
          </p>
        </div>
        <Progress value={p?.overall ?? 0} label="Overall progress" className="mt-3 h-3" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Bar
            label="Lessons"
            weight={40}
            value={lessonsPct}
            detail={`${p?.lessons_done ?? 0} of ${p?.lessons_total ?? 0} required lessons completed`}
          />
          <Bar
            label="Assignments"
            weight={30}
            value={assignmentsPct}
            detail={`${p?.assignments_passed ?? 0} of ${p?.assignments_total ?? 0} passed. Your best score on each counts.`}
          />
          <Bar
            label="Final exam"
            weight={30}
            value={examPct}
            detail={`${examLabel.text}. ${examLabel.hint}.`}
          />
        </div>
      </Card>

      <h2 className="mt-8 mb-3 text-lg font-semibold">What is left</h2>
      <Card className="p-0">
        <ul className="divide-y">
          {learning.modules.map((m, i) => {
            const state = learning.states.find((s) => s.module_id === m.id)
            const status = moduleStatus(state)
            const lessonsLeft = (state?.lessons_total ?? 0) - (state?.lessons_done ?? 0)
            const assignmentLeft = !!state?.assignment_id && !state.assignment_passed
            return (
              <li key={m.id} className="flex items-start gap-3 p-4">
                {status === 'complete' && (
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-success"
                    aria-label="Complete"
                  />
                )}
                {status === 'in_progress' && (
                  <Circle
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    aria-label="In progress"
                  />
                )}
                {status === 'locked' && (
                  <Lock
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                    aria-label="Locked"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Module {i + 1}. {m.title}
                  </p>
                  <CardDescription className="mt-0.5">
                    {status === 'complete' && 'All done.'}
                    {status === 'locked' && 'Unlocks after the previous module.'}
                    {status === 'in_progress' &&
                      [
                        lessonsLeft > 0 &&
                          `${lessonsLeft} lesson${lessonsLeft === 1 ? '' : 's'} to complete`,
                        assignmentLeft && 'assignment to pass',
                      ]
                        .filter(Boolean)
                        .join(' and ')}
                  </CardDescription>
                </div>
                {status === 'in_progress' && (
                  <Link
                    className="text-sm font-medium text-primary underline"
                    to="/dashboard/stack"
                  >
                    Open
                  </Link>
                )}
              </li>
            )
          })}
          <li className="flex items-start gap-3 p-4">
            <Lock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Final exam</p>
              <CardDescription className="mt-0.5">
                {exam.data?.state === 'passed'
                  ? 'Passed.'
                  : 'Opens after you complete every module.'}{' '}
                {(exam.data?.state === 'ready' || exam.data?.state === 'in_progress') && (
                  <Link className="font-medium text-primary underline" to="/dashboard/exam">
                    Go to the exam
                  </Link>
                )}
              </CardDescription>
            </div>
          </li>
        </ul>
      </Card>
    </>
  )
}
