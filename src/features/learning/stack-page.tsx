import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, ClipboardCheck, FileText, Lock, Type, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { friendlyError } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type {
  Assignment,
  LessonType,
  ModuleState,
  ModuleWithLessons,
  Submission,
} from '@/types/domain'
import { fetchLatestSubmissions, learningKeys } from './api'
import { useMyLearning } from './hooks'
import { assignmentState, moduleStatus, percent, type AssignmentState } from './utils'

const lessonIcon: Record<LessonType, typeof Video> = { video: Video, pdf: FileText, text: Type }

const assignmentLabel = (
  s: AssignmentState,
): { text: string; variant: 'neutral' | 'warning' | 'success' | 'danger' } => {
  switch (s.kind) {
    case 'locked':
      return { text: 'Locked', variant: 'neutral' }
    case 'not_started':
      return { text: 'Not started', variant: 'neutral' }
    case 'pending':
      return { text: 'Awaiting review', variant: 'warning' }
    case 'needs_resubmission':
      return { text: 'Resubmit', variant: 'warning' }
    case 'passed':
      return { text: s.score !== null ? `Passed · ${s.score}` : 'Passed', variant: 'success' }
    case 'not_passed':
      return {
        text: s.score !== null ? `Not passed · ${s.score}` : 'Not passed',
        variant: 'danger',
      }
  }
}

/** The latest attempt per assignment, so the list can show whether work is waiting for review. */
function useLatestSubmissions(assignmentIds: string[]) {
  return useQuery({
    queryKey: [...learningKeys.latestSubmissions, assignmentIds],
    enabled: assignmentIds.length > 0,
    queryFn: () => fetchLatestSubmissions(assignmentIds),
  })
}

export function StackPage() {
  const learning = useMyLearning()
  const assignmentIds = learning.modules.flatMap((m) => m.assignments.map((a) => a.id))
  const latest = useLatestSubmissions(assignmentIds)

  if (learning.isPending) {
    return (
      <>
        <PageHeader title="My stack" />
        <LoadingState />
      </>
    )
  }
  if (learning.error)
    return (
      <ErrorState message={friendlyError(learning.error)} onRetry={() => void learning.refetch()} />
    )
  if (!learning.hasAccess || !learning.membership) {
    return (
      <>
        <PageHeader title="My stack" />
        <EmptyState
          title="You are not in a stack"
          description="Apply to a stack to start learning."
        />
      </>
    )
  }

  const { modules, states } = learning
  return (
    <>
      <PageHeader
        title={learning.membership.stacks.name}
        description="Complete each module in order. Finish its lessons and pass its assignment to unlock the next."
      />
      {modules.length === 0 && (
        <EmptyState
          title="No modules yet"
          description="Your stack lead has not published any modules yet. Check back soon."
        />
      )}
      <ol className="space-y-4">
        {modules.map((module, index) => (
          <li key={module.id}>
            <ModuleSection
              module={module}
              index={index}
              state={states.find((s) => s.module_id === module.id)}
              completed={learning.completedLessonIds}
              latest={latest.data}
              previousTitle={modules[index - 1]?.title}
            />
          </li>
        ))}
      </ol>
    </>
  )
}

function ModuleSection({
  module,
  index,
  state,
  completed,
  latest,
  previousTitle,
}: {
  module: ModuleWithLessons
  index: number
  state: ModuleState | undefined
  completed: ReadonlySet<string>
  latest: Map<string, Submission> | undefined
  previousTitle: string | undefined
}) {
  const status = moduleStatus(state)
  const assignment: Assignment | undefined = module.assignments[0]
  const pct = state ? percent(state.lessons_done, state.lessons_total) : 0

  return (
    <Card className={cn('p-0', status === 'locked' && 'bg-muted/40')}>
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">
              <span className="text-muted-foreground">Module {index + 1}.</span> {module.title}
            </h2>
            {status === 'locked' && (
              <Badge>
                <Lock className="mr-1 size-3" aria-hidden="true" />
                Locked
              </Badge>
            )}
            {status === 'in_progress' && <Badge variant="primary">In progress</Badge>}
            {status === 'complete' && (
              <Badge variant="success">
                <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
                Complete
              </Badge>
            )}
          </div>
          {module.description && (
            <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
          )}
          {status === 'locked' && (
            <p className="mt-2 text-sm text-muted-foreground">
              {previousTitle
                ? `Complete “${previousTitle}” to unlock this module.`
                : 'This module is not available yet.'}
            </p>
          )}
        </div>
        {status !== 'locked' && state && state.lessons_total > 0 && (
          <div className="w-40 shrink-0">
            <p className="mb-1 text-xs text-muted-foreground">
              {state.lessons_done} of {state.lessons_total} lessons
            </p>
            <Progress value={pct} label={`${module.title} lesson progress`} className="h-2" />
          </div>
        )}
      </div>

      {status !== 'locked' && (
        <>
          {module.lessons.length > 0 && (
            <ul className="divide-y border-t">
              {module.lessons.map((lesson) => {
                const Icon = lessonIcon[lesson.lesson_type]
                const done = completed.has(lesson.id)
                return (
                  <li key={lesson.id}>
                    <Link
                      to={`/dashboard/stack/lessons/${lesson.id}`}
                      className="flex min-h-12 items-center gap-3 px-4 py-2 hover:bg-muted"
                    >
                      {done ? (
                        <CheckCircle2
                          className="size-5 shrink-0 text-success"
                          aria-label="Completed"
                        />
                      ) : (
                        <Icon
                          className="size-5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <span className="flex-1 text-sm font-medium">{lesson.title}</span>
                      {!lesson.is_required && (
                        <span className="text-xs text-muted-foreground">Optional</span>
                      )}
                      {lesson.duration_minutes && (
                        <span className="text-xs text-muted-foreground">
                          {lesson.duration_minutes} min
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          {assignment && (
            <Link
              to={`/dashboard/stack/assignments/${assignment.id}`}
              className="flex min-h-14 items-center gap-3 border-t px-4 py-2 hover:bg-muted"
            >
              <ClipboardCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm font-medium">{assignment.title}</span>
                <span className="text-xs text-muted-foreground">
                  {assignment.type === 'quiz' ? 'Quiz' : 'Project assignment'}
                </span>
              </span>
              {(() => {
                const label = assignmentLabel(assignmentState(state, latest?.get(assignment.id)))
                return <Badge variant={label.variant}>{label.text}</Badge>
              })()}
            </Link>
          )}
          {module.lessons.length === 0 && !assignment && (
            <p className="border-t p-4 text-sm text-muted-foreground">
              Nothing in this module yet.
            </p>
          )}
        </>
      )}
    </Card>
  )
}
