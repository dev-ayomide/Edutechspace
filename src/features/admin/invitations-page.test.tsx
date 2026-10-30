import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { InvitationsPage } from './invitations-page'

vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  inviteLead: vi.fn(),
  listInvitations: vi.fn(),
  revokeInvitation: vi.fn(),
}))
vi.mock('@/features/stacks/api', () => ({
  stackKeys: { all: ['stacks'], summaries: ['stacks', 'summaries'] },
  listStacks: vi.fn().mockResolvedValue([
    { id: 'fe', name: 'Frontend Development', slug: 'frontend', is_active: true },
    { id: 'old', name: 'Retired', slug: 'retired', is_active: false },
  ]),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const invitation = {
  id: 'i1',
  email: 'pending@x.test',
  role: 'stack_lead' as const,
  stack_id: 'fe',
  status: 'pending' as const,
  created_at: '2026-10-01T00:00:00Z',
  expires_at: '2026-10-15T00:00:00Z',
  stacks: { name: 'Frontend Development' },
}

describe('InvitationsPage', () => {
  beforeEach(() => {
    vi.mocked(api.listInvitations).mockResolvedValue([invitation])
    vi.mocked(api.inviteLead).mockReset().mockResolvedValue({ status: 'invited' })
    vi.mocked(api.revokeInvitation).mockReset().mockResolvedValue(undefined)
  })

  it('validates the form before sending', async () => {
    renderWithProviders(<InvitationsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Send invitation' }))
    expect(await screen.findByText('Enter an email')).toBeInTheDocument()
    expect(screen.getByText('Choose a stack')).toBeInTheDocument()
    expect(api.inviteLead).not.toHaveBeenCalled()
  })

  it('only offers active stacks and sends the invitation', async () => {
    renderWithProviders(<InvitationsPage />)
    const select = await screen.findByLabelText('Stack')
    await screen.findByRole('option', { name: 'Frontend Development' })
    expect(screen.queryByRole('option', { name: 'Retired' })).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Email'), 'new.lead@x.test')
    await userEvent.selectOptions(select, 'fe')
    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
    await waitFor(() => expect(api.inviteLead).toHaveBeenCalledWith('new.lead@x.test', 'fe'))
  })

  it('lists invitations and lets an admin revoke a pending one', async () => {
    renderWithProviders(<InvitationsPage />)
    expect(await screen.findByText('pending@x.test')).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: /Revoke invitation for pending@x.test/ }),
    )
    await waitFor(() => expect(api.revokeInvitation).toHaveBeenCalledWith('i1'))
  })
})
