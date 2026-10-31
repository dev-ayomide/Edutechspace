import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { AttentionCard } from './attention-card'

describe('AttentionCard', () => {
  it('shows the count and where to go when something is waiting', () => {
    renderWithProviders(
      <AttentionCard
        to="/lead/reviews"
        count={3}
        label="projects to grade"
        emptyLabel="Nothing to grade"
      />,
    )
    expect(screen.getByRole('link', { name: /3\s*projects to grade/ })).toHaveAttribute(
      'href',
      '/lead/reviews',
    )
  })
  it('goes quiet and says so at zero', () => {
    renderWithProviders(<AttentionCard to="/x" count={0} label="to do" emptyLabel="All clear" />)
    expect(screen.getByText('All clear')).toBeInTheDocument()
    expect(screen.queryByText('to do')).not.toBeInTheDocument()
  })
})
