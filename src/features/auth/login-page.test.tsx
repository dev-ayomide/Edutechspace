import { expectAccessible } from '@/test/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './login-page'

const signIn = vi.hoisted(() => vi.fn())
vi.mock('./api', () => ({ signInWithPassword: signIn }))
vi.mock('./auth-context', () => ({
  useAuth: () => ({ status: 'unauthenticated', role: undefined }),
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

describe('LoginPage', () => {
  beforeEach(() => signIn.mockReset())

  it('validates required fields before calling the API', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('submits valid credentials', async () => {
    signIn.mockResolvedValue(undefined)
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co')
    await userEvent.type(screen.getByLabelText('Password'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(signIn).toHaveBeenCalledWith('a@b.co', 'secret')
  })
})

describe('LoginPage accessibility', () => {
  it('has no violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    await expectAccessible(container)
  })
})
