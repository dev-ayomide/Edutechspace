import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { StudentsPage } from './students-page'

vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  fetchRoster: vi.fn(),
  fetchAttemptOverview: vi.fn(),
  grantExtraAttempt: vi.fn(),
}))
const lead = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('@/features/lead/use-my-stacks', () => ({ useMyStacks: () => lead.current }))

const row = (id: string, over: Partial<api.RosterRow> = {}): api.RosterRow => ({
  user_id: id,
  full_name: `Student ${id}`,
  email: `${id}@x.test`,
  phone: '0800',
  status: 'active',
  joined_at: '2026-10-01',
  lessons_done: 3,
  lessons_total: 6,
  assignments_passed: 1,
  assignments_total: 2,
  overall: 42,
  last_activity: new Date().toISOString(),
  ...over,
})

describe('StudentsPage', () => {
  beforeEach(() => {
    lead.current = {
      stacks: [{ id: 'fe', name: 'Frontend' }],
      selected: { id: 'fe', name: 'Frontend' },
      select: vi.fn(),
      isPending: false,
      error: null,
    }
  })

  it('lists students with contact details and progress', async () => {
    vi.mocked(api.fetchRoster).mockResolvedValue([
      row('a'),
      row('b', { phone: null, status: 'completed', last_activity: null }),
    ])
    renderWithProviders(<StudentsPage />)
    expect(await screen.findByText('Student a')).toBeInTheDocument()
    expect(screen.getByText('a@x.test')).toBeInTheDocument()
    expect(screen.getByText('0800')).toBeInTheDocument()
    expect(screen.getAllByRole('progressbar')[0]).toHaveAttribute('aria-valuenow', '42')
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('has an empty state', async () => {
    vi.mocked(api.fetchRoster).mockResolvedValue([])
    renderWithProviders(<StudentsPage />)
    expect(await screen.findByText('No students yet')).toBeInTheDocument()
  })

  it('asks a lead without a stack to wait for assignment', () => {
    lead.current = { stacks: [], selected: null, select: vi.fn(), isPending: false, error: null }
    renderWithProviders(<StudentsPage />)
    expect(screen.getByText('No stack assigned yet')).toBeInTheDocument()
  })

  it('lets the lead give a stuck student another attempt', async () => {
    vi.mocked(api.fetchRoster).mockResolvedValue([row('a')])
    const stuck: api.AttemptRow = {
      kind: 'assignment',
      target_id: 'q1',
      title: 'Quiz 1',
      module_title: 'HTML',
      attempts_used: 2,
      attempts_allowed: 2,
      passed: false,
    }
    vi.mocked(api.fetchAttemptOverview).mockResolvedValue([
      stuck,
      { ...stuck, kind: 'exam', target_id: 'e1', title: 'Final', module_title: null, passed: true },
    ])
    vi.mocked(api.grantExtraAttempt).mockResolvedValue(undefined)
    renderWithProviders(<StudentsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Attempts' }))
    expect(await screen.findByText('Out of attempts')).toBeInTheDocument()
    expect(screen.getByText('Passed')).toBeInTheDocument()
    const give = screen.getAllByRole('button', { name: 'Give 1 more attempt' })
    expect(give).toHaveLength(1)
    await userEvent.click(give[0]!)
    expect(api.grantExtraAttempt).toHaveBeenCalledWith(stuck, 'a')
  })
})
