import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectAccessible } from '@/test/a11y'
import { renderWithProviders } from '@/test/render'
import { HomePage } from './home-page'

vi.mock('@/features/stacks/api', () => ({
  stackKeys: { all: ['stacks'] },
  listStacks: vi.fn().mockResolvedValue([
    {
      id: 'fe',
      slug: 'frontend',
      name: 'Frontend Development',
      description: 'Web interfaces.',
      is_active: true,
    },
    {
      id: 'da',
      slug: 'data-analysis',
      name: 'Data Analysis',
      description: 'Data.',
      is_active: true,
    },
    { id: 'old', slug: 'old', name: 'Retired', description: null, is_active: false },
  ]),
}))

describe('HomePage', () => {
  it('introduces the platform and leads to applying', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Learn tech with the people who do it/,
    )
    expect(screen.getAllByRole('link', { name: /Apply to join/ })[0]).toHaveAttribute(
      'href',
      '/join',
    )
    expect(screen.getByRole('heading', { name: /Four steps/ })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /certificate that speaks for itself/ }),
    ).toBeInTheDocument()
  })

  it('lists live stacks as photo cards that open each stack page', async () => {
    renderWithProviders(<HomePage />)
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Frontend Development/ })).toHaveAttribute(
        'href',
        '/stacks/frontend',
      ),
    )
    expect(screen.queryByText('Retired')).not.toBeInTheDocument()
  })

  it('filters stacks by category', async () => {
    renderWithProviders(<HomePage />)
    await screen.findByRole('link', { name: /Data Analysis/ })
    await userEvent.click(screen.getByRole('tab', { name: 'Data & AI' }))
    expect(screen.getByRole('tab', { name: 'Data & AI' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('link', { name: /Frontend Development/ })).toHaveClass('hide')
    expect(screen.getByRole('link', { name: /Data Analysis/ })).not.toHaveClass('hide')
  })

  it('falls back to the launch catalogue before data arrives', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByRole('link', { name: /Cloud Computing \/ DevOps/ })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<HomePage />)
    await waitFor(() => expect(screen.queryByText('Retired')).not.toBeInTheDocument())
    await expectAccessible(container)
  })
})
