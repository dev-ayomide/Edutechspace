import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import { JoinPage } from './join-page'

const submit = vi.hoisted(() => ({
  impl: (async () => undefined) as (...args: unknown[]) => Promise<void>,
}))
vi.mock('./api', () => ({
  submitApplication: (...args: unknown[]) =>
    (submit.impl as (...a: unknown[]) => Promise<void>)(...args),
}))
vi.mock('@/features/stacks/api', () => ({
  stackKeys: { all: ['stacks'] },
  listStacks: vi.fn().mockResolvedValue([
    { id: 'fe', name: 'Frontend Development', is_active: true },
    { id: 'old', name: 'Retired stack', is_active: false },
  ]),
}))

async function fillValid() {
  await userEvent.type(screen.getByLabelText('Full name'), 'Ada Applicant')
  await userEvent.type(screen.getByLabelText('Email'), 'ada@x.test')
  await screen.findByRole('option', { name: 'Frontend Development' })
  await userEvent.selectOptions(screen.getByLabelText('Stack'), 'fe')
}

describe('JoinPage', () => {
  beforeEach(() => {
    submit.impl = vi.fn().mockResolvedValue(undefined)
  })

  it('requires the essentials', async () => {
    renderWithProviders(<JoinPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Send application' }))
    expect(await screen.findByText('Enter your full name')).toBeInTheDocument()
    expect(screen.getByText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Choose a stack')).toBeInTheDocument()
    expect(submit.impl).not.toHaveBeenCalled()
  })

  it('only offers active stacks', async () => {
    renderWithProviders(<JoinPage />)
    await screen.findByRole('option', { name: 'Frontend Development' })
    expect(screen.queryByRole('option', { name: 'Retired stack' })).not.toBeInTheDocument()
  })

  it('submits and confirms', async () => {
    renderWithProviders(<JoinPage />)
    await fillValid()
    await userEvent.click(screen.getByRole('button', { name: 'Send application' }))
    expect(await screen.findByText('Application received')).toBeInTheDocument()
    expect(
      (submit.impl as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]![0],
    ).toMatchObject({
      full_name: 'Ada Applicant',
      email: 'ada@x.test',
      stack_id: 'fe',
    })
  })

  it('explains a duplicate application', async () => {
    submit.impl = async () => {
      throw Object.assign(new Error('duplicate key'), { code: '23505' })
    }
    renderWithProviders(<JoinPage />)
    await fillValid()
    await userEvent.click(screen.getByRole('button', { name: 'Send application' }))
    expect(await screen.findByText(/already applied to this stack/)).toBeInTheDocument()
  })

  it('rejects a phone number with letters', async () => {
    renderWithProviders(<JoinPage />)
    await fillValid()
    await userEvent.type(screen.getByLabelText('Phone (optional)'), 'call me')
    await userEvent.click(screen.getByRole('button', { name: 'Send application' }))
    expect(await screen.findByText('Enter a valid phone number')).toBeInTheDocument()
    expect(submit.impl).not.toHaveBeenCalled()
  })

  it('never submits when the honeypot is filled', async () => {
    renderWithProviders(<JoinPage />)
    await fillValid()
    const trap = document.getElementById('apply-website') as HTMLInputElement
    await userEvent.type(trap, 'http://spam.example')
    await userEvent.click(screen.getByRole('button', { name: 'Send application' }))
    await waitFor(() => expect(screen.queryByText('Application received')).not.toBeInTheDocument())
    expect(submit.impl).not.toHaveBeenCalled()
  })
})
