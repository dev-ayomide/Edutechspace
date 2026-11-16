import { Check, ChevronDown, ClipboardCheck, FileText, Lock, PlayCircle, Type } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { LessonType, ModuleState, ModuleWithLessons } from '@/types/domain'
import { moduleStatus } from './utils'

const typeIcon: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  pdf: FileText,
  text: Type,
}
const typeLabel: Record<LessonType, string> = { video: 'Video', pdf: 'Document', text: 'Reading' }

/**
 * The lesson player's sidebar: every module and lesson in the stack, with ticks for what is done and the
 * current lesson highlighted, so a student always knows where they are (the way course players work).
 */
export function StackContentNav({
  modules,
  states,
  completedLessonIds,
  currentLessonId,
}: {
  modules: readonly ModuleWithLessons[]
  states: readonly ModuleState[]
  completedLessonIds: ReadonlySet<string>
  currentLessonId?: string
}) {
  const total = modules.reduce((n, m) => n + m.lessons.length, 0)
  const done = modules.reduce(
    (n, m) => n + m.lessons.filter((l) => completedLessonIds.has(l.id)).length,
    0,
  )
  return (
    <nav aria-label="Stack content" className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3.5">
        <p className="font-bold">Stack content</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {done} of {total} done
        </p>
      </div>
      {modules.map((m, i) => {
        const state = states.find((s) => s.module_id === m.id)
        const status = moduleStatus(state)
        const hasCurrent = m.lessons.some((l) => l.id === currentLessonId)
        const minutes = m.lessons.reduce((n, l) => n + (l.duration_minutes ?? 0), 0)
        return (
          <details key={m.id} open={hasCurrent} className="group border-t first:border-t-0">
            <summary className="flex cursor-pointer list-none gap-2.5 bg-surface px-4 py-3 [&::-webkit-details-marker]:hidden">
              <ChevronDown
                className="mt-0.5 size-4 shrink-0 transition group-open:rotate-180"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span
                  className={cn(
                    'block text-[15px] leading-snug font-bold',
                    status === 'locked' && 'text-muted-foreground',
                  )}
                >
                  {i + 1}. {m.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {status === 'locked'
                    ? 'Locked until the module before is done'
                    : `${state?.lessons_done ?? 0} / ${state?.lessons_total ?? m.lessons.length}${
                        minutes ? ` · ${minutes} min` : ''
                      }`}
                </span>
              </span>
            </summary>
            {status === 'locked' ? (
              <p className="flex items-center gap-2 px-4 py-3 pl-10 text-sm text-muted-foreground">
                <Lock className="size-3.5" aria-hidden="true" />
                Finish the previous module to unlock these lessons.
              </p>
            ) : (
              <ul>
                {m.lessons.map((l, j) => {
                  const isDone = completedLessonIds.has(l.id)
                  const isCurrent = l.id === currentLessonId
                  const Icon = typeIcon[l.lesson_type]
                  return (
                    <li key={l.id}>
                      <Link
                        to={`/dashboard/stack/lessons/${l.id}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                          'flex gap-3 px-4 py-2.5 text-sm hover:bg-surface',
                          isCurrent && 'bg-primary/10 hover:bg-primary/10',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border-[1.5px]',
                            isDone
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-muted-foreground',
                          )}
                        >
                          {isDone && (
                            <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
                          )}
                          <span className="sr-only">{isDone ? 'Done: ' : 'Not done: '}</span>
                        </span>
                        <span className="min-w-0">
                          <span className={cn('block leading-snug', isCurrent && 'font-bold')}>
                            {j + 1}. {l.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Icon className="size-3.5" aria-hidden="true" />
                            {typeLabel[l.lesson_type]}
                            {l.duration_minutes ? ` · ${l.duration_minutes} min` : ''}
                            {!l.is_required && ' · optional'}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
                {m.assignments.map((a) => (
                  <li key={a.id}>
                    <Link
                      to={`/dashboard/stack/assignments/${a.id}`}
                      className="flex gap-3 px-4 py-2.5 text-sm hover:bg-surface"
                    >
                      <span
                        className={cn(
                          'mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border-[1.5px]',
                          state?.assignment_passed
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-muted-foreground',
                        )}
                      >
                        {state?.assignment_passed && (
                          <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block leading-snug">{a.title}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ClipboardCheck className="size-3.5" aria-hidden="true" />
                          {a.type === 'quiz' ? 'Quiz' : 'Project'}
                          {state?.assignment_passed ? ' · passed' : ''}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </details>
        )
      })}
    </nav>
  )
}
