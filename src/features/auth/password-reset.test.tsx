import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import { updatePassword } from './api'
import { ForgotPasswordPage } from './forgot-password-page'
import { ResetPasswordPage } from './reset-password-page'

const auth = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('./auth-context', () => ({ useAuth: () => auth.current }))
const reset = vi.hoisted(() => ({
  impl: (async () => undefined) as (...a: unknown[]) => Promise<void>,
  calls: [] as unknown[][],
}))
vi.mock('./api', () => ({
  requestPasswordReset: (...a: unknown[]) => {
    reset.calls.push(a)
    return reset.impl(...a)
  },
  updatePassword: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    reset.calls.length = 0
    reset.impl = async () => undefined
  })

  it('validates the email', async () => {
    renderWithProviders(<ForgotPasswordPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(await screen.findByText('Enter your email')).toBeInTheDocument()
    expect(reset.calls).toHaveLength(0)
  })

  it('sends the link and confirms without revealing whether the account exists', async () => {
    renderWithProviders(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(await screen.findByText('Check your email')).toBeInTheDocument()
    expect(screen.getByText(/If that address has an account/)).toBeInTheDocument()
    expect(reset.calls[0]).toEqual(['a@b.co'])
  })

  it('shows the same confirmation when the address is unknown (no account enumeration)', async () => {
    reset.impl = async () => {
      throw Object.assign(new Error('User not found'), { status: 400 })
    }
    renderWithProviders(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'nobody@b.co')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(await screen.findByText('Check your email')).toBeInTheDocument()
  })

  it('does tell the person about rate limiting', async () => {
    reset.impl = async () => {
      throw Object.assign(new Error('rate'), { status: 429 })
    }
    renderWithProviders(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    await waitFor(() => expect(screen.queryByText('Check your email')).not.toBeInTheDocument())
  })
})

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.mocked(updatePassword).mockReset().mockResolvedValue(undefined))

  it('rejects a link with no recovery session', () => {
    auth.current = { status: 'unauthenticated', session: null, role: undefined }
    renderWithProviders(<ResetPasswordPage />)
    expect(screen.getByText('This reset link is not valid')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })

  describe('with a recovery session', () => {
    beforeEach(() => {
      auth.current = { status: 'authenticated', session: { user: { id: 'u' } }, role: 'student' }
    })

    it('requires a long enough matching password', async () => {
      renderWithProviders(<ResetPasswordPage />)
      await userEvent.type(screen.getByLabelText('New password'), 'short')
      await userEvent.type(screen.getByLabelText('Confirm new password'), 'other')
      await userEvent.click(screen.getByRole('button', { name: 'Save password' }))
      expect(await screen.findByText('Use at least 10 characters')).toBeInTheDocument()
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      expect(updatePassword).not.toHaveBeenCalled()
    })

    it('saves the new password', async () => {
      renderWithProviders(<ResetPasswordPage />)
      await userEvent.type(screen.getByLabelText('New password'), 'a-long-password')
      await userEvent.type(screen.getByLabelText('Confirm new password'), 'a-long-password')
      await userEvent.click(screen.getByRole('button', { name: 'Save password' }))
      await waitFor(() => expect(updatePassword).toHaveBeenCalledWith('a-long-password'))
    })
  })
})
