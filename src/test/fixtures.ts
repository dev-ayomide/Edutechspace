import type { Assignment, Lesson, ModuleState, ModuleWithLessons } from '@/types/domain'

export const lesson = (id: string, over: Partial<Lesson> = {}): Lesson => ({
  id,
  module_id: 'm1',
  title: `Lesson ${id}`,
  description: null,
  lesson_type: 'text',
  content_url: null,
  content_path: null,
  content_text: 'Hello world',
  duration_minutes: null,
  order_index: 1,
  is_required: true,
  is_published: true,
  ...over,
})

export const assignment = (id: string, over: Partial<Assignment> = {}): Assignment => ({
  id,
  module_id: 'm1',
  title: `Assignment ${id}`,
  type: 'quiz',
  instructions: null,
  max_score: 100,
  pass_mark: 60,
  max_attempts: null,
  is_published: true,
  ...over,
})

export const moduleWith = (
  id: string,
  over: Partial<ModuleWithLessons> = {},
): ModuleWithLessons => ({
  id,
  stack_id: 'fe',
  title: `Module ${id}`,
  description: null,
  order_index: 1,
  is_published: true,
  lessons: [],
  assignments: [],
  ...over,
})

export const moduleState = (module_id: string, over: Partial<ModuleState> = {}): ModuleState => ({
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
