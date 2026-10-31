import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { assignment, lesson, moduleState, moduleWith } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { StudentOverviewPage } from './overview-page'

const learning = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('./hooks', () => ({ useMyLearning: () => learning.current }))
vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ profile: { full_name: 'Sam Student' } }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('./api', async (orig) => ({ ...(await orig<typeof api>()), withdrawFromStack: vi.fn() }))
vi.mock('@/features/exams/api', () => ({
  examKeys: { mine: ['exam', 'mine'] },
  fetchMyExam: vi.fn().mockResolvedValue(null),
}))

const stack = { id: 'fe', name: 'Frontend Development', slug: 'frontend' }
const active = {
  isPending: false,
  error: null,
  hasAccess: true,
  refetch: vi.fn(),
  membership: { status: 'active', stacks: stack },
  progress: {
    overall: 54,
    lessons_done: 15,
    lessons_total: 20,
    assignments_passed: 2,
    assignments_total: 4,
    assignment_pct: 0.8,
    exam_pct: 0,
    lessons_pct: 0,
  },
  modules: [
    moduleWith('m1', {
      title: 'HTML',
      lessons: [lesson('l1'), lesson('l2')],
      assignments: [assignment('a1')],
    }),
  ],
  states: [moduleState('m1', { assignment_id: 'a1' })],
  completedLessonIds: new Set(['l1']),
}

describe('StudentOverviewPage', () => {
  beforeEach(() => {
    learning.current = active
    vi.mocked(api.withdrawFromStack).mockReset().mockResolvedValue(undefined)
  })

  it('shows overall progress, stats and the next step', () => {
    renderWithProviders(<StudentOverviewPage />)
    expect(screen.getByText('Good to see you, Sam.')).toBeInTheDocument()
    expect(screen.getAllByText('Final exam').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('progressbar', { name: /Overall progress/ })).toHaveAttribute(
      'aria-valuenow',
      '54',
    )
    expect(screen.getByText('15 / 20')).toBeInTheDocument()
    expect(screen.getByText('2 / 4')).toBeInTheDocument()
    expect(screen.getByText('Lesson l2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Continue/ })).toHaveAttribute(
      'href',
      '/dashboard/stack/lessons/l2',
    )
  })

  it('draws the journey with the current module marked', () => {
    renderWithProviders(<StudentOverviewPage />)
    expect(screen.getByRole('heading', { name: 'Your journey' })).toBeInTheDocument()
    const current = document.querySelector('[aria-current="step"]')
    expect(current).toHaveTextContent('HTML')
    expect(screen.getByText('Certificate')).toBeInTheDocument()
    expect(screen.getByText('More than halfway. Keep the momentum.')).toBeInTheDocument()
  })

  it('invites someone with no stack to apply', () => {
    learning.current = { ...active, hasAccess: false, membership: null }
    renderWithProviders(<StudentOverviewPage />)
    expect(screen.getByText('You are not in a stack yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Apply to a stack' })).toHaveAttribute('href', '/join')
  })

  it('lets a student who withdrew apply again', () => {
    learning.current = {
      ...active,
      hasAccess: false,
      membership: { status: 'withdrawn', stacks: stack },
    }
    renderWithProviders(<StudentOverviewPage />)
    expect(screen.getByText('You withdrew from Frontend Development')).toBeInTheDocument()
  })

  it('asks before withdrawing', async () => {
    renderWithProviders(<StudentOverviewPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw from stack' }))
    expect(api.withdrawFromStack).not.toHaveBeenCalled()
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/progress is kept/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Withdraw' }))
    await waitFor(() => expect(api.withdrawFromStack).toHaveBeenCalled())
  })

  it('does not offer withdrawal after completing', () => {
    learning.current = { ...active, membership: { status: 'completed', stacks: stack } }
    renderWithProviders(<StudentOverviewPage />)
    expect(screen.queryByRole('button', { name: 'Withdraw from stack' })).not.toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })
})
