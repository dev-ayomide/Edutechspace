import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import { AcceptInvitePage } from './accept-invite-page'
import { setPasswordAndName } from './api'

const auth = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('./auth-context', () => ({ useAuth: () => auth.current }))
vi.mock('./api', () => ({ setPasswordAndName: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('AcceptInvitePage', () => {
  beforeEach(() => vi.mocked(setPasswordAndName).mockReset().mockResolvedValue(undefined))

  it('explains an invalid or expired link when there is no session', () => {
    auth.current = { status: 'unauthenticated', session: null, role: undefined }
    renderWithProviders(<AcceptInvitePage />)
    expect(screen.getByText('This invitation link has expired')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set my password' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })

  describe('with a valid invitation session', () => {
    beforeEach(() => {
      auth.current = {
        status: 'authenticated',
        session: { user: { id: 'u1' } },
        role: 'stack_lead',
      }
    })

    it('rejects short or mismatched passwords', async () => {
      renderWithProviders(<AcceptInvitePage />)
      await userEvent.type(screen.getByLabelText('Full name'), 'Lee Lead')
      await userEvent.type(screen.getByLabelText('Password'), 'short')
      await userEvent.type(screen.getByLabelText('Confirm password'), 'different')
      await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }))
      expect(await screen.findByText('Use at least 10 characters')).toBeInTheDocument()
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      expect(setPasswordAndName).not.toHaveBeenCalled()
    })

    it('starts from the name on the application', async () => {
      auth.current = { ...auth.current, profile: { full_name: 'Ada Applicant' } }
      renderWithProviders(<AcceptInvitePage />)
      await waitFor(() => expect(screen.getByLabelText('Full name')).toHaveValue('Ada Applicant'))
    })

    it('saves the name and password', async () => {
      renderWithProviders(<AcceptInvitePage />)
      await userEvent.type(screen.getByLabelText('Full name'), 'Lee Lead')
      await userEvent.type(screen.getByLabelText('Password'), 'a-long-password')
      await userEvent.type(screen.getByLabelText('Confirm password'), 'a-long-password')
      await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }))
      await waitFor(() =>
        expect(setPasswordAndName).toHaveBeenCalledWith('a-long-password', 'Lee Lead', 'u1'),
      )
    })
  })
})
