import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import * as rosterApi from '@/features/roster/api'
import * as api from './api'
import { LeadOverviewPage } from './overview-page'
import { stalledStudents } from './stalled'

vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  fetchLeadAttention: vi.fn(),
  fetchStackSummary: vi.fn(),
}))
vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ profile: { full_name: 'Lee Lead' } }),
}))
vi.mock('@/features/roster/api', async (orig) => ({
  ...(await orig<typeof rosterApi>()),
  fetchRoster: vi.fn(),
}))
const stacks = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('./use-my-stacks', () => ({ useMyStacks: () => stacks.current }))

describe('LeadOverviewPage', () => {
  beforeEach(() => {
    stacks.current = {
      stacks: [{ id: 'fe', name: 'Frontend Development' }],
      isPending: false,
      error: null,
      refetch: vi.fn(),
    }
    vi.mocked(api.fetchStackSummary).mockResolvedValue({
      modules: 3,
      publishedModules: 2,
      lessons: 10,
      publishedLessons: 8,
      students: 12,
    })
    vi.mocked(api.fetchLeadAttention).mockResolvedValue({ applications: 4, submissions: 0 })
    vi.mocked(rosterApi.fetchRoster).mockResolvedValue([])
  })

  it('puts what needs the lead at the top, quiet when there is nothing', async () => {
    renderWithProviders(<LeadOverviewPage />)
    expect(await screen.findByRole('link', { name: /4\s*applications to review/ })).toHaveAttribute(
      'href',
      '/lead/applications',
    )
    expect(screen.getByText('Nothing to grade')).toBeInTheDocument()
  })

  it('shows each stack with its content and student numbers', async () => {
    renderWithProviders(<LeadOverviewPage />)
    expect(await screen.findByText('Frontend Development')).toBeInTheDocument()
    expect(await screen.findByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('explains the empty state and hides the attention panel', async () => {
    stacks.current = { stacks: [], isPending: false, error: null, refetch: vi.fn() }
    renderWithProviders(<LeadOverviewPage />)
    expect(await screen.findByText('No stack assigned yet')).toBeInTheDocument()
    expect(screen.queryByText('Needs you')).not.toBeInTheDocument()
  })

  it('shows average progress and students who have gone quiet', async () => {
    const day = 86_400_000
    const base = {
      email: 'x@x.test',
      phone: null,
      joined_at: new Date(Date.now() - 30 * day).toISOString(),
      lessons_done: 0,
      lessons_total: 0,
      assignments_passed: 0,
      assignments_total: 0,
    }
    vi.mocked(rosterApi.fetchRoster).mockResolvedValue([
      {
        ...base,
        user_id: 'a',
        full_name: 'Busy Bee',
        status: 'active',
        overall: 60,
        last_activity: new Date().toISOString(),
      },
      {
        ...base,
        user_id: 'b',
        full_name: 'Quiet Quinn',
        status: 'active',
        overall: 20,
        last_activity: new Date(Date.now() - 10 * day).toISOString(),
      },
    ])
    renderWithProviders(<LeadOverviewPage />)
    expect(await screen.findByText('40%')).toBeInTheDocument()
    expect(screen.getByText(/1 student has/)).toBeInTheDocument()
    expect(screen.getByText('Quiet Quinn')).toBeInTheDocument()
    expect(screen.queryByText('Busy Bee')).not.toBeInTheDocument()
  })
})

describe('stalledStudents', () => {
  it('flags active students idle for a week, oldest first, ignoring completed ones', () => {
    const now = Date.parse('2026-11-15T00:00:00Z')
    const row = (id: string, last: string | null, status: 'active' | 'completed' = 'active') =>
      ({
        user_id: id,
        status,
        last_activity: last,
        joined_at: '2026-11-01T00:00:00Z',
      }) as rosterApi.RosterRow
    const out = stalledStudents(
      [
        row('recent', '2026-11-12T00:00:00Z'),
        row('idle', '2026-11-05T00:00:00Z'),
        row('never', null),
        row('done', null, 'completed'),
      ],
      now,
    )
    expect(out.map((r) => [r.user_id, r.idleDays])).toEqual([
      ['never', 14],
      ['idle', 10],
    ])
  })
})
