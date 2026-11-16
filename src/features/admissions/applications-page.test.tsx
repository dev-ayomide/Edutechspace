import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Application } from '@/types/domain'
import { expectAccessible } from '@/test/a11y'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { ApplicationsPage } from './applications-page'

vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  listApplications: vi.fn(),
  reviewApplication: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }))

const app = (id: string, name: string, status: Application['status']): Application => ({
  id,
  full_name: name,
  email: `${id}@x.test`,
  phone: '123',
  stack_id: 'fe',
  motivation: 'I love code',
  status,
  review_note: null,
  created_at: '2026-10-01T00:00:00Z',
  reviewed_at: null,
  stacks: { name: 'Frontend' },
})

describe('ApplicationsPage', () => {
  beforeEach(() => {
    vi.mocked(api.listApplications).mockResolvedValue([
      app('a1', 'Ada Pending', 'pending'),
      app('a2', 'Bob Approved', 'approved'),
    ])
    vi.mocked(api.reviewApplication)
      .mockReset()
      .mockResolvedValue({ status: 'approved', emailSent: true })
  })

  it('shows pending applications first and everything on demand', async () => {
    renderWithProviders(<ApplicationsPage />)
    expect(await screen.findByText('Ada Pending')).toBeInTheDocument()
    expect(screen.queryByText('Bob Approved')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Bob Approved')).toBeInTheDocument()
  })

  it('approves with an optional note after confirming', async () => {
    renderWithProviders(<ApplicationsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Approve Ada Pending' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/Note/), 'Welcome!')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(api.reviewApplication).toHaveBeenCalledWith('a1', true, 'Welcome!'))
  })

  it('rejects an application', async () => {
    vi.mocked(api.reviewApplication).mockResolvedValue({ status: 'rejected' })
    renderWithProviders(<ApplicationsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Reject Ada Pending' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Reject' }),
    )
    await waitFor(() => expect(api.reviewApplication).toHaveBeenCalledWith('a1', false, ''))
  })

  it('offers no actions on applications that were already reviewed', async () => {
    renderWithProviders(<ApplicationsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'All' }))
    expect(screen.queryByRole('button', { name: 'Approve Bob Approved' })).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing is pending', async () => {
    vi.mocked(api.listApplications).mockResolvedValue([])
    renderWithProviders(<ApplicationsPage />)
    expect(await screen.findByText('No applications waiting')).toBeInTheDocument()
  })
})

describe('ApplicationsPage accessibility', () => {
  it('has no violations', async () => {
    vi.mocked(api.listApplications).mockResolvedValue([app('a1', 'Ada Pending', 'pending')])
    const { container } = renderWithProviders(<ApplicationsPage />)
    await screen.findByText('Ada Pending')
    await expectAccessible(container)
  })
})
