import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { LeadOverviewPage } from './overview-page'

vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  fetchLeadAttention: vi.fn(),
  fetchStackSummary: vi.fn(),
}))
vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ profile: { full_name: 'Lee Lead' } }),
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
})
