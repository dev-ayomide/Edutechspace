import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { isChunkLoadError } from './chunk-error'
import { RouteError } from './route-error'

function Boom({ error }: { error: Error }): never {
  throw error
}
const show = (error: Error) => {
  const router = createMemoryRouter([
    { path: '/', element: <Boom error={error} />, errorElement: <RouteError /> },
  ])
  return render(<RouterProvider router={router} />)
}

describe('RouteError', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined))
  afterEach(() => vi.restoreAllMocks())

  it('shows a friendly message and never the technical error', () => {
    show(new Error('secret stack trace detail'))
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.queryByText(/secret stack trace/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reload/ })).toBeInTheDocument()
  })

  it('explains a stale tab after a deploy', () => {
    show(new Error('Failed to fetch dynamically imported module: https://x/assets/page-abc.js'))
    expect(screen.getByRole('alert')).toHaveTextContent('A new version is available')
  })
})

describe('isChunkLoadError', () => {
  it("recognises the browsers' messages", () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('other'))).toBe(false)
    expect(isChunkLoadError('string')).toBe(false)
  })
})
