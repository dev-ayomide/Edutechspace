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
  it('introduces the platform and shows how it works', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Learn a tech skill/)
    expect(screen.getByRole('link', { name: 'Explore the stacks' })).toHaveAttribute(
      'href',
      '#stacks',
    )
    expect(screen.getByRole('heading', { name: 'How a stack works' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Apply to join' })).toHaveAttribute('href', '/join')
  })

  it('lists live stacks as cards that open each stack page', async () => {
    renderWithProviders(<HomePage />)
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Frontend Development/ })).toHaveAttribute(
        'href',
        '/stacks/frontend',
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
