import type { Assignment, Lesson, ModuleState, ModuleWithLessons, Submission } from '@/types/domain'
import {
  assignmentState,
  currentMembership,
  lessonOrder,
  moduleStatus,
  nextUp,
  percent,
  toEmbedUrl,
} from './utils'

const lesson = (id: string, required = true): Lesson => ({
  id,
  module_id: 'm',
  title: id,
  description: null,
  lesson_type: 'text',
  content_url: null,
  content_path: null,
  content_text: 'x',
  duration_minutes: null,
  order_index: 1,
  is_required: required,
  is_published: true,
})
const assignment = (id: string): Assignment => ({
  id,
  module_id: 'm',
  title: id,
  type: 'quiz',
  instructions: null,
  max_score: 100,
  pass_mark: 60,
  max_attempts: null,
  is_published: true,
})
const mod = (id: string, lessons: Lesson[], assignments: Assignment[] = []): ModuleWithLessons => ({
  id,
  stack_id: 's',
  title: id,
  description: null,
  order_index: 1,
  is_published: true,
  lessons,
  assignments,
})
const state = (module_id: string, over: Partial<ModuleState> = {}): ModuleState => ({
  module_id,
  unlocked: true,
  complete: false,
  lessons_total: 1,
  lessons_done: 0,
  assignment_id: null,
  assignment_passed: null,
  attempts_used: 0,
  best_score: null,
  ...over,
})
const sub = (status: Submission['status'], score: number | null = null): Submission => ({
  id: 's',
  assignment_id: 'a',
  user_id: 'u',
  attempt: 1,
  content_text: null,
  content_url: null,
  file_path: null,
  status,
  score,
  feedback: null,
  graded_at: null,
  submitted_at: '2026-01-01',
})

describe('moduleStatus', () => {
  it('maps server state to a label', () => {
    expect(moduleStatus(undefined)).toBe('locked')
    expect(moduleStatus({ unlocked: false, complete: false })).toBe('locked')
    expect(moduleStatus({ unlocked: true, complete: false })).toBe('in_progress')
    expect(moduleStatus({ unlocked: true, complete: true })).toBe('complete')
  })
})

describe('nextUp', () => {
  const m1 = mod('m1', [lesson('l1'), lesson('l2'), lesson('opt', false)], [assignment('a1')])
  const m2 = mod('m2', [lesson('l3')])

  it('points at the first unfinished required lesson', () => {
    const result = nextUp(
      [m1, m2],
      [state('m1', { assignment_id: 'a1' }), state('m2', { unlocked: false })],
      new Set(['l1']),
    )
    expect(result).toMatchObject({ kind: 'lesson', lessonId: 'l2' })
  })
  it('skips optional lessons', () => {
    const result = nextUp([m1], [state('m1', { assignment_id: 'a1' })], new Set(['l1', 'l2']))
    expect(result).toMatchObject({ kind: 'assignment', assignmentId: 'a1' })
  })
  it('moves to the next module once one is complete', () => {
    const result = nextUp(
      [m1, m2],
      [state('m1', { complete: true }), state('m2')],
      new Set(['l1', 'l2']),
    )
    expect(result).toMatchObject({ kind: 'lesson', lessonId: 'l3' })
  })
  it('stops at a locked module and when everything is done', () => {
    expect(
      nextUp(
        [m1, m2],
        [state('m1', { unlocked: false }), state('m2', { unlocked: false })],
        new Set(),
      ),
    ).toBeNull()
    expect(nextUp([m1], [state('m1', { complete: true })], new Set())).toBeNull()
  })
})

describe('lessonOrder', () => {
  it('flattens lessons across modules', () => {
    expect(
      lessonOrder([mod('a', [lesson('1'), lesson('2')]), mod('b', [lesson('3')])]).map((l) => l.id),
    ).toEqual(['1', '2', '3'])
  })
})

describe('toEmbedUrl', () => {
  it('embeds YouTube in its privacy-friendly form', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
    expect(toEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
    expect(toEmbedUrl('https://www.youtube.com/shorts/abcdefghijk')).toBe(
      'https://www.youtube-nocookie.com/embed/abcdefghijk',
    )
  })
  it('embeds Vimeo', () => {
    expect(toEmbedUrl('https://vimeo.com/123456789')).toBe(
      'https://player.vimeo.com/video/123456789',
    )
  })
  it('never embeds unknown hosts or malformed links', () => {
    expect(toEmbedUrl('https://evil.example/watch?v=abcdefghijk')).toBeNull()
    expect(toEmbedUrl('https://youtube.com.evil.example/watch?v=abcdefghijk')).toBeNull()
    expect(toEmbedUrl('javascript:alert(1)')).toBeNull()
    expect(toEmbedUrl('not a url')).toBeNull()
  })
})

describe('assignmentState', () => {
  it('describes where the student is', () => {
    expect(assignmentState(state('m', { unlocked: false }), undefined).kind).toBe('locked')
    expect(assignmentState(state('m'), undefined).kind).toBe('not_started')
    expect(assignmentState(state('m'), sub('submitted')).kind).toBe('pending')
    expect(assignmentState(state('m'), sub('needs_resubmission')).kind).toBe('needs_resubmission')
    expect(assignmentState(state('m'), sub('graded', 40))).toEqual({
      kind: 'not_passed',
      score: 40,
    })
    expect(
      assignmentState(state('m', { assignment_passed: true, best_score: 90 }), sub('graded', 40)),
    ).toEqual({ kind: 'passed', score: 90 })
  })
})

describe('currentMembership', () => {
  const m = (status: string, joined_at: string) => ({ status, joined_at })
  it('prefers active, then completed, then the latest', () => {
    expect(currentMembership([m('withdrawn', '2026-03'), m('active', '2026-01')])).toEqual(
      m('active', '2026-01'),
    )
    expect(currentMembership([m('withdrawn', '2026-03'), m('completed', '2026-01')])).toEqual(
      m('completed', '2026-01'),
    )
    expect(currentMembership([m('withdrawn', '2026-01'), m('withdrawn', '2026-03')])).toEqual(
      m('withdrawn', '2026-03'),
    )
    expect(currentMembership([])).toBeNull()
  })
})

describe('percent', () => {
  it('rounds and guards against zero', () => {
    expect(percent(1, 3)).toBe(33)
    expect(percent(0, 0)).toBe(0)
  })
})

import { buildJourney, momentumMessage } from './utils'

describe('momentumMessage', () => {
  it('speaks to each stage', () => {
    expect(momentumMessage(0)).toBe('Your journey starts here.')
    expect(momentumMessage(10)).toBe('Good start. Keep going.')
    expect(momentumMessage(30)).toBe('You are building momentum.')
    expect(momentumMessage(54)).toBe('More than halfway. Keep the momentum.')
    expect(momentumMessage(80)).toBe('Almost there. Finish strong.')
    expect(momentumMessage(100)).toBe('You did it. Certificate earned.')
  })
})

describe('buildJourney', () => {
  const mod = (id: string, title: string) => ({
    id,
    stack_id: 's',
    title,
    description: null,
    order_index: 1,
    is_published: true,
    lessons: [],
    assignments: [],
  })
  const st = (module_id: string, over = {}) => ({
    module_id,
    unlocked: true,
    complete: false,
    lessons_total: 5,
    lessons_done: 2,
    assignment_id: null,
    assignment_passed: null,
    attempts_used: 0,
    best_score: null,
    ...over,
  })

  it('marks done, current and locked modules, then the exam and certificate', () => {
    const stops = buildJourney(
      [mod('a', 'HTML'), mod('b', 'CSS'), mod('c', 'JS')],
      [st('a', { complete: true }), st('b'), st('c', { unlocked: false })],
      'locked',
      false,
    )
    expect(stops.map((s) => s.status)).toEqual(['done', 'now', 'lock', 'lock', 'lock'])
    expect(stops[1]!.detail).toBe('2 of 5 lessons')
    expect(stops.at(-1)!.label).toBe('Certificate')
  })
  it('has only one current stop', () => {
    const stops = buildJourney([mod('a', 'A'), mod('b', 'B')], [st('a'), st('b')], null, false)
    expect(stops.filter((s) => s.status === 'now')).toHaveLength(1)
  })
  it('opens the exam after every module, and turns the certificate gold once earned', () => {
    const done = buildJourney([mod('a', 'A')], [st('a', { complete: true })], 'ready', false)
    expect(done[1]!.status).toBe('now')
    const earned = buildJourney([mod('a', 'A')], [st('a', { complete: true })], 'passed', true)
    expect(earned.map((s) => s.status)).toEqual(['done', 'done', 'gold'])
  })
})
