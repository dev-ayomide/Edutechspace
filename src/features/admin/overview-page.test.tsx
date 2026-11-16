import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { AdminOverviewPage } from './overview-page'

vi.mock('./api', async (orig) => ({ ...(await orig<typeof api>()), fetchOverview: vi.fn() }))
vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ profile: { full_name: 'Ada Admin' } }),
}))

const overview = (over: Partial<api.AdminOverview> = {}): api.AdminOverview => ({
  stacks: 8,
  leads: 5,
  students: 42,
  pendingInvitations: 2,
  pendingApplications: 7,
  activeSignatories: 3,
  ...over,
})

describe('AdminOverviewPage', () => {
  it('shows the headline numbers and what needs attention', async () => {
    vi.mocked(api.fetchOverview).mockResolvedValue(overview())
    renderWithProviders(<AdminOverviewPage />)
    expect(await screen.findByText('Welcome, Ada')).toBeInTheDocument()
    expect(await screen.findByText('42')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /7\s*applications waiting for review/ }),
    ).toHaveAttribute('href', '/admin/applications')
    expect(screen.queryByText(/No active certificate signatories/)).not.toBeInTheDocument()
  })

  it('warns when certificates would be issued without signatures', async () => {
    vi.mocked(api.fetchOverview).mockResolvedValue(overview({ activeSignatories: 0 }))
    renderWithProviders(<AdminOverviewPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/No active certificate signatories/)
    expect(screen.getByRole('link', { name: 'Add signatories' })).toHaveAttribute(
      'href',
      '/admin/signatories',
    )
  })

  it('goes quiet when nothing is waiting', async () => {
    vi.mocked(api.fetchOverview).mockResolvedValue(
      overview({ pendingApplications: 0, pendingInvitations: 0 }),
    )
    renderWithProviders(<AdminOverviewPage />)
    expect(await screen.findByText('No applications waiting')).toBeInTheDocument()
    expect(screen.getByText('No pending invitations')).toBeInTheDocument()
  })
})
