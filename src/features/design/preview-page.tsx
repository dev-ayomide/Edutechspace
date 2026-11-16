import type { Session } from '@supabase/supabase-js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/app-shell'
import { AuthContext } from '@/features/auth/auth-context'
import { examKeys } from '@/features/exams/api'
import { learningKeys } from '@/features/learning/api'
import { LessonPage } from '@/features/learning/lesson-page'
import { StudentOverviewPage } from '@/features/learning/overview-page'
import { ProgressPage } from '@/features/learning/progress-page'
import { StackPage } from '@/features/learning/stack-page'
import type { Lesson, ModuleState, ModuleWithLessons, Profile } from '@/types/domain'

/**
 * DEV ONLY (route /_preview/*, never built into production). Renders the signed-in student screens with a
 * sample student and sample content, so the design can be checked without a live account or database.
 * Nothing here talks to Supabase: every query is pre-filled and never refetches.
 */
const userId = 'preview-student'
const profile: Profile = {
  id: userId,
  email: 'ada@example.com',
  full_name: 'Ada Obi',
  phone: null,
  avatar_url: null,
  role: 'student',
}
const session = { user: { id: userId } } as unknown as Session

const L = (id: string, module_id: string, title: string, over: Partial<Lesson> = {}): Lesson => ({
  id,
  module_id,
  title,
  description: null,
  lesson_type: 'video',
  content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  content_path: null,
  content_text: null,
  duration_minutes: 15,
  order_index: Number(id.replace(/\D/g, '')),
  is_required: true,
  is_published: true,
  ...over,
})

const titles = [
  ['How the web works', ['Welcome to the stack', 'Browsers, servers and requests', 'Reading: the anatomy of a URL']],
  ['HTML and accessibility', ['Semantic HTML', 'Forms that work for everyone', 'Images and alt text']],
  ['CSS and responsive layout', ['The box model', 'Selectors and the cascade', 'Flexbox', 'CSS Grid: building page layouts', 'Media queries']],
  ['JavaScript essentials', ['Values and variables', 'Functions']],
  ['React', ['Components', 'State']],
] as const

let n = 0
const modules: ModuleWithLessons[] = titles.map(([title, lessons], i) => ({
  id: `m${i + 1}`,
  stack_id: 'fe',
  title,
  description: null,
  order_index: i,
  is_published: true,
  lessons:
    i >= 3
      ? [] // locked modules: RLS hides their lessons
      : lessons.map((t) =>
          L(`l${++n}`, `m${i + 1}`, t, t.startsWith('Reading') ? { lesson_type: 'text', content_text: 'Text' } : {}),
        ),
  assignments: [
    {
      id: `a${i + 1}`,
      module_id: `m${i + 1}`,
      title: i === 1 ? 'Project: an accessible sign-up page' : `Quiz: ${title}`,
      type: i === 1 ? 'submission' : 'quiz',
      instructions: null,
      max_score: 100,
      pass_mark: 60,
      max_attempts: 2,
      is_published: true,
    },
  ],
}))
const done = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9']
const states: ModuleState[] = modules.map((m, i) => ({
  module_id: m.id,
  unlocked: i <= 2,
  complete: i <= 1,
  lessons_total: titles[i]![1].length,
  lessons_done: i <= 1 ? titles[i]![1].length : i === 2 ? 3 : 0,
  assignment_id: `a${i + 1}`,
  assignment_passed: i <= 1 ? true : null,
  attempts_used: i <= 1 ? 1 : 0,
  best_score: i <= 1 ? 84 : null,
}))

function seed() {
  const qc = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false, enabled: true } },
  })
  qc.setQueryData(learningKeys.membership(userId), [
    {
      id: 'mem',
      status: 'active',
      joined_at: '2026-10-03',
      stacks: { id: 'fe', name: 'Frontend Development', slug: 'frontend' },
    },
  ])
  qc.setQueryData(learningKeys.modules, states)
  qc.setQueryData(learningKeys.content('fe'), modules)
  qc.setQueryData(learningKeys.completions, done)
  qc.setQueryData(learningKeys.progress, {
    lessons_total: 16,
    lessons_done: 9,
    assignments_total: 5,
    assignments_passed: 2,
    assignment_pct: 0.4,
    exam_pct: 0,
    overall: 38,
  })
  qc.setQueryData(examKeys.mine, null)
  qc.setQueryData(['profile', userId], profile)
  for (const m of modules)
    for (const l of m.lessons)
      qc.setQueryData(learningKeys.lesson(l.id), {
        ...l,
        description:
          l.id === 'l9'
            ? 'Grid lets you lay out a whole page in rows and columns at once. Follow along in the starter project.'
            : null,
        modules: { title: m.title, stack_id: 'fe' },
      })
  qc.setQueryData([...learningKeys.latestSubmissions, ['a1', 'a2', 'a3', 'a4', 'a5']], new Map())
  return qc
}

function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(seed)
  return (
    <QueryClientProvider client={qc}>
      <AuthContext.Provider
        value={{ status: 'authenticated', session, profile, role: 'student', signOut: async () => {} }}
      >
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  )
}

export function PreviewPage() {
  return (
    <Providers>
      <Routes>
        {/* eslint-disable-next-line jsx-a11y/aria-role -- `role` is the app role prop, not ARIA */}
        <Route element={<AppShell role="student" />}>
          <Route path="dashboard" element={<StudentOverviewPage />} />
          <Route path="stack" element={<StackPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="lesson/:lessonId" element={<LessonPage />} />
        </Route>
      </Routes>
    </Providers>
  )
}
