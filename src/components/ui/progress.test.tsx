import { render, screen } from '@testing-library/react'
import { Progress } from './progress'

describe('Progress', () => {
  it('exposes an accessible progressbar', () => {
    render(<Progress value={54} label="Overall progress" />)
    const bar = screen.getByRole('progressbar', { name: 'Overall progress' })
    expect(bar).toHaveAttribute('aria-valuenow', '54')
  })

  it('clamps out-of-range values', () => {
    render(<Progress value={140} label="Too much" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })
})
