import { screen, waitFor } from '@testing-library/react'
import { expectAccessible } from '@/test/a11y'
import { renderWithProviders } from '@/test/render'
import { HomePage } from './home-page'

vi.mock('@/features/stacks/api', () => ({
  stackKeys: { all: ['stacks'] },
  listStacks: vi.fn().mockResolvedValue([
    { id: 'fe', slug: 'frontend', name: 'Frontend Development', is_active: true },
    { id: 'old', slug: 'old', name: 'Retired', is_active: false },
  ]),
}))

describe('HomePage', () => {
  it('invites people to join and shows how it works', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Learn\.\s*Grow\.\s*Build\./,
    )
    expect(screen.getAllByRole('link', { name: /Join a stack/ })[0]).toHaveAttribute(
      'href',
      '/join',
    )
    expect(screen.getByText('Three beats. One certificate.')).toBeInTheDocument()
  })

  it('lists live stacks and links each to the join form with the stack preselected', async () => {
    renderWithProviders(<HomePage />)
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Apply to Frontend Development/ })).toHaveAttribute(
        'href',
        '/join?stack=frontend',
      ),
    )
    expect(screen.queryByText('Retired')).not.toBeInTheDocument()
  })

  it('falls back to the launch catalogue before data arrives', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByText('Cloud Computing / DevOps')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<HomePage />)
    await waitFor(() => expect(screen.queryByText('Retired')).not.toBeInTheDocument())
    await expectAccessible(container)
  })
})
