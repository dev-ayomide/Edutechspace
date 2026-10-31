import { screen } from '@testing-library/react'
import { expectAccessible } from '@/test/a11y'
import { renderWithProviders } from '@/test/render'
import { assignment, lesson, moduleState, moduleWith } from '@/test/fixtures'
import { StackPage } from './stack-page'

const learning = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('./hooks', () => ({ useMyLearning: () => learning.current }))
vi.mock('./api', () => ({
  fetchLatestSubmissions: vi.fn().mockResolvedValue(new Map()),
  learningKeys: { latestSubmissions: ['ls'] },
}))

const base = {
  isPending: false,
  error: null,
  hasAccess: true,
  membership: { status: 'active', stacks: { id: 'fe', name: 'Frontend Development' } },
  completedLessonIds: new Set(['l1']),
  refetch: vi.fn(),
}

describe('StackPage', () => {
  beforeEach(() => {
    learning.current = {
      ...base,
      modules: [
        moduleWith('m1', {
          title: 'HTML',
          lessons: [lesson('l1'), lesson('l2', { is_required: false })],
          assignments: [assignment('a1', { title: 'HTML quiz' })],
        }),
        moduleWith('m2', { title: 'CSS', lessons: [] }),
      ],
      states: [
        moduleState('m1', {
          lessons_total: 1,
          lessons_done: 1,
          assignment_id: 'a1',
          assignment_passed: false,
        }),
        moduleState('m2', { unlocked: false }),
      ],
    }
  })

  it('shows the open module with its lessons and assignment', () => {
    renderWithProviders(<StackPage />)
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Lesson l1/ })).toHaveAttribute(
      'href',
      '/dashboard/stack/lessons/l1',
    )
    expect(screen.getByRole('link', { name: /HTML quiz/ })).toHaveAttribute(
      'href',
      '/dashboard/stack/assignments/a1',
    )
    expect(screen.getByLabelText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Optional')).toBeInTheDocument()
  })

  it('shows locked modules without their lessons and says what unlocks them', () => {
    renderWithProviders(<StackPage />)
    expect(screen.getByText('Locked')).toBeInTheDocument()
    expect(screen.getByText(/Complete “HTML” to unlock this module/)).toBeInTheDocument()
  })

  it('marks finished modules complete', () => {
    learning.current = {
      ...base,
      modules: [moduleWith('m1', { title: 'HTML' })],
      states: [moduleState('m1', { complete: true })],
    }
    renderWithProviders(<StackPage />)
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })

  it('invites people without a stack to apply', () => {
    learning.current = { ...base, hasAccess: false, membership: null, modules: [], states: [] }
    renderWithProviders(<StackPage />)
    expect(screen.getByText('You are not in a stack')).toBeInTheDocument()
  })

  it('has an empty state when nothing is published', () => {
    learning.current = { ...base, modules: [], states: [] }
    renderWithProviders(<StackPage />)
    expect(screen.getByText('No modules yet')).toBeInTheDocument()
  })
})

describe('StackPage accessibility', () => {
  it('has no violations', async () => {
    learning.current = {
      ...base,
      modules: [
        moduleWith('m1', {
          title: 'HTML',
          lessons: [lesson('l1')],
          assignments: [assignment('a1', { title: 'HTML quiz' })],
        }),
        moduleWith('m2', { title: 'CSS' }),
      ],
      states: [moduleState('m1', { assignment_id: 'a1' }), moduleState('m2', { unlocked: false })],
    }
    const { container } = renderWithProviders(<StackPage />)
    await expectAccessible(container)
  })
})
