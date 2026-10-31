import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { expectAccessible } from '@/test/a11y'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { VerifyPage } from './verify-page'

vi.mock('./api', async (orig) => ({ ...(await orig<typeof api>()), verifyCertificate: vi.fn() }))

const row = (over: Partial<api.Verification> = {}): api.Verification => ({
  certificate_no: 'RTS-2026-ABCDEF1234',
  status: 'valid',
  student_name: 'Alice One',
  stack_name: 'Frontend Development',
  issued_at: '2026-10-30T10:00:00Z',
  revoked_at: null,
  ...over,
})
const Where = () => <p data-testid="where">{useLocation().pathname}</p>
const show = (path: string) =>
  renderWithProviders(
    <>
      <Routes>
        <Route path="/verify/:number?" element={<VerifyPage />} />
      </Routes>
      <Where />
    </>,
    path,
  )

describe('VerifyPage', () => {
  beforeEach(() => vi.mocked(api.verifyCertificate).mockReset())

  it('confirms a valid certificate and shows only what is printed on it', async () => {
    vi.mocked(api.verifyCertificate).mockResolvedValue(row())
    show('/verify/RTS-2026-ABCDEF1234')
    expect(await screen.findByText('This certificate is valid')).toBeInTheDocument()
    expect(screen.getByText('Alice One')).toBeInTheDocument()
    expect(screen.getByText('Frontend Development')).toBeInTheDocument()
    expect(screen.getByText('30 October 2026')).toBeInTheDocument()
    expect(api.verifyCertificate).toHaveBeenCalledWith('RTS-2026-ABCDEF1234')
  })

  it('flags a revoked certificate', async () => {
    vi.mocked(api.verifyCertificate).mockResolvedValue(
      row({ status: 'revoked', revoked_at: '2026-11-02T00:00:00Z' }),
    )
    show('/verify/RTS-2026-ABCDEF1234')
    expect(await screen.findByText('This certificate has been revoked')).toBeInTheDocument()
    expect(screen.getByText(/Revoked on 2 November 2026/)).toBeInTheDocument()
  })

  it('says when nothing matches', async () => {
    vi.mocked(api.verifyCertificate).mockResolvedValue(null)
    show('/verify/RTS-NOPE')
    expect(await screen.findByText('No certificate found')).toBeInTheDocument()
  })

  it('asks for a number first and does not query without one', () => {
    show('/verify')
    expect(screen.getByLabelText('Certificate number')).toBeInTheDocument()
    expect(api.verifyCertificate).not.toHaveBeenCalled()
  })

  it('looks up a number typed into the form', async () => {
    vi.mocked(api.verifyCertificate).mockResolvedValue(row())
    show('/verify')
    await userEvent.type(screen.getByLabelText('Certificate number'), 'RTS-2026-ABCDEF1234')
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent('/verify/RTS-2026-ABCDEF1234'),
    )
    expect(await screen.findByText('This certificate is valid')).toBeInTheDocument()
  })
})

describe('VerifyPage accessibility', () => {
  it('has no violations', async () => {
    vi.mocked(api.verifyCertificate).mockResolvedValue(row())
    const { container } = show('/verify/RTS-2026-ABCDEF1234')
    await screen.findByText('This certificate is valid')
    await expectAccessible(container)
  })
})
