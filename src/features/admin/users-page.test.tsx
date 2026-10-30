import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { UsersPage } from './users-page'

vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  listUsers: vi.fn(),
  setUserRole: vi.fn(),
  removeLeadFromStack: vi.fn(),
}))
vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'me' } } }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const users: api.AdminUser[] = [
  {
    id: 'me',
    email: 'me@x.test',
    full_name: 'Admin Me',
    phone: null,
    role: 'admin',
    stack_leads: [],
    stack_members: [],
  },
  {
    id: 'lead',
    email: 'lead@x.test',
    full_name: 'Lee Lead',
    phone: null,
    role: 'stack_lead',
    stack_leads: [{ stack_id: 'fe', stacks: { name: 'Frontend' } }],
    stack_members: [],
  },
  {
    id: 'stu',
    email: 'stu@x.test',
    full_name: 'Sam Student',
    phone: null,
    role: 'student',
    stack_leads: [],
    stack_members: [{ status: 'active', stacks: { name: 'Backend' } }],
  },
]

describe('UsersPage', () => {
  beforeEach(() => {
    vi.mocked(api.listUsers).mockResolvedValue(users)
    vi.mocked(api.setUserRole).mockReset().mockResolvedValue(undefined)
    vi.mocked(api.removeLeadFromStack).mockReset().mockResolvedValue(undefined)
  })

  it('does not let admins change their own role', async () => {
    renderWithProviders(<UsersPage />)
    expect(await screen.findByLabelText('Role for me@x.test')).toBeDisabled()
    expect(screen.getByLabelText('Role for lead@x.test')).toBeEnabled()
  })

  it("shows each person's stack", async () => {
    renderWithProviders(<UsersPage />)
    await screen.findByText('Lee Lead')
    expect(screen.getByText('Frontend')).toBeInTheDocument()
    expect(screen.getByText('Backend')).toBeInTheDocument()
  })

  it('asks for confirmation before changing a role', async () => {
    renderWithProviders(<UsersPage />)
    await userEvent.selectOptions(await screen.findByLabelText('Role for stu@x.test'), 'stack_lead')
    expect(api.setUserRole).not.toHaveBeenCalled()
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/stu@x.test will become stack lead/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Change role' }))
    await waitFor(() => expect(api.setUserRole).toHaveBeenCalledWith('stu', 'stack_lead'))
  })

  it('cancelling the confirmation changes nothing', async () => {
    renderWithProviders(<UsersPage />)
    await userEvent.selectOptions(await screen.findByLabelText('Role for stu@x.test'), 'admin')
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    )
    expect(api.setUserRole).not.toHaveBeenCalled()
  })

  it('filters by search text', async () => {
    renderWithProviders(<UsersPage />)
    await screen.findByText('Lee Lead')
    await userEvent.type(screen.getByLabelText('Search users'), 'sam')
    expect(screen.queryByText('Lee Lead')).not.toBeInTheDocument()
    expect(screen.getByText('Sam Student')).toBeInTheDocument()
  })
})
