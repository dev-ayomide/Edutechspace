import type { Lesson, ModuleState, ModuleWithLessons, Submission } from '@/types/domain'

export type ModuleStatus = 'locked' | 'in_progress' | 'complete'

export function moduleStatus(
  state: Pick<ModuleState, 'unlocked' | 'complete'> | undefined,
): ModuleStatus {
  if (!state || !state.unlocked) return 'locked'
  return state.complete ? 'complete' : 'in_progress'
}

export type NextUp =
  | { kind: 'lesson'; lessonId: string; title: string; moduleTitle: string }
  | { kind: 'assignment'; assignmentId: string; title: string; moduleTitle: string }
  | null

/**
 * The next thing a student should do: the first unfinished required lesson, then the module's assignment,
 * walking modules in order and stopping at the first locked one.
 */
export function nextUp(
  modules: readonly ModuleWithLessons[],
  states: readonly ModuleState[],
  completedLessonIds: ReadonlySet<string>,
): NextUp {
  for (const module of modules) {
    const state = states.find((s) => s.module_id === module.id)
    if (!state?.unlocked) return null
    if (state.complete) continue
    const lesson = module.lessons.find((l) => l.is_required && !completedLessonIds.has(l.id))
    if (lesson)
      return { kind: 'lesson', lessonId: lesson.id, title: lesson.title, moduleTitle: module.title }
    const assignment = module.assignments.find((a) => a.id === state.assignment_id)
    if (assignment && !state.assignment_passed) {
      return {
        kind: 'assignment',
        assignmentId: assignment.id,
        title: assignment.title,
        moduleTitle: module.title,
      }
    }
  }
  return null
}

/** Lessons in reading order across the whole stack, used for "next lesson" links. */
export function lessonOrder(modules: readonly ModuleWithLessons[]): Lesson[] {
  return modules.flatMap((m) => m.lessons)
}

/** Allowlisted video hosts only: an arbitrary link is never put in an iframe. */
export function toEmbedUrl(url: string): string | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1)
    return /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id =
      u.pathname === '/watch'
        ? u.searchParams.get('v')
        : u.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1]
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (host === 'vimeo.com') {
    const id = u.pathname.match(/^\/(\d+)/)?.[1]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  return null
}

export type AssignmentState =
  | { kind: 'locked' }
  | { kind: 'not_started' }
  | { kind: 'pending' }
  | { kind: 'needs_resubmission' }
  | { kind: 'passed'; score: number | null }
  | { kind: 'not_passed'; score: number | null }

/** One label for an assignment's situation, from the module state and the latest attempt. */
export function assignmentState(
  state: ModuleState | undefined,
  latest: Submission | undefined,
): AssignmentState {
  if (!state?.unlocked) return { kind: 'locked' }
  if (state.assignment_passed) return { kind: 'passed', score: state.best_score }
  if (!latest) return { kind: 'not_started' }
  if (latest.status === 'submitted') return { kind: 'pending' }
  if (latest.status === 'needs_resubmission') return { kind: 'needs_resubmission' }
  return { kind: 'not_passed', score: latest.score }
}

/** The student's current membership: an active one, else the most recently completed or withdrawn. */
export function currentMembership<T extends { status: string; joined_at: string }>(
  memberships: readonly T[],
): T | null {
  const sorted = [...memberships].sort((a, b) => b.joined_at.localeCompare(a.joined_at))
  return (
    sorted.find((m) => m.status === 'active') ??
    sorted.find((m) => m.status === 'completed') ??
    sorted[0] ??
    null
  )
}

export const percent = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100)
