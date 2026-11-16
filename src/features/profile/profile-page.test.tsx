import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import { updatePassword } from '@/features/auth/api'
import { saveContactDetails } from './api'
import { ProfilePage } from './profile-page'

const auth = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('@/features/auth/auth-context', () => ({ useAuth: () => auth.current }))
vi.mock('@/features/auth/api', () => ({ updatePassword: vi.fn() }))
vi.mock('./api', () => ({ saveContactDetails: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.mocked(saveContactDetails).mockReset().mockResolvedValue(undefined)
    vi.mocked(updatePassword).mockReset().mockResolvedValue(undefined)
    auth.current = {
      session: { user: { id: 'u1' } },
      profile: { id: 'u1', email: 'ada@x.test', full_name: 'Ada', phone: null, role: 'student' },
    }
  })

  it('shows and saves the name and phone', async () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByLabelText('Full name')).toHaveValue('Ada')
    expect(screen.getByText(/ada@x.test/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Phone (optional)'), '+234 800')
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }))
    await waitFor(() => expect(saveContactDetails).toHaveBeenCalledWith('u1', 'Ada', '+234 800'))
  })

  it('rejects a bad phone number', async () => {
    renderWithProviders(<ProfilePage />)
    await userEvent.type(screen.getByLabelText('Phone (optional)'), 'call me')
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }))
    expect(await screen.findByText(/digits, spaces/)).toBeInTheDocument()
    expect(saveContactDetails).not.toHaveBeenCalled()
  })

  it('changes the password only when both entries match', async () => {
    renderWithProviders(<ProfilePage />)
    await userEvent.type(screen.getByLabelText('New password'), 'a-long-password')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'another-password')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('Confirm new password'))
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'a-long-password')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith('a-long-password'))
  })
})
