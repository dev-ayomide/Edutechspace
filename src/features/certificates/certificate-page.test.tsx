import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectAccessible } from '@/test/a11y'
import { renderWithProviders } from '@/test/render'
import type { Certificate } from '@/types/domain'
import * as api from './api'
import { CertificatePage } from './certificate-page'

const save = vi.hoisted(() => vi.fn())
vi.mock('./pdf', () => ({ buildCertificatePdf: vi.fn().mockResolvedValue({ save }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'u1' } } }),
}))
vi.mock('@/features/exams/api', () => ({
  examKeys: { mine: ['exam', 'mine'] },
  fetchMyExam: vi.fn().mockResolvedValue(null),
}))
vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  listMyCertificates: vi.fn(),
  sendCertificateEmail: vi.fn(),
  signatureUrl: (p: string) => `https://files.test/${p}`,
}))

const cert = (over: Partial<Certificate> = {}): Certificate => ({
  id: 'c1',
  certificate_no: 'RTS-2026-ABCDEF1234',
  user_id: 'u1',
  stack_id: 'fe',
  student_name: 'Ṣọlá Adéyẹmí',
  stack_name: 'Frontend Development',
  final_score: 92,
  issued_at: '2026-10-30T10:00:00Z',
  revoked_at: null,
  revoked_reason: null,
  replaced_by: null,
  emailed_at: null,
  signatories: [
    { name: 'Dr. Ngozi Okafor', title: 'President', signature_path: 'p.png' },
    { name: 'Tolu Adeyemi', title: 'Technical Lead', signature_path: null },
  ],
  ...over,
})

describe('CertificatePage', () => {
  beforeEach(() => {
    save.mockReset()
    vi.mocked(api.sendCertificateEmail).mockReset().mockResolvedValue(undefined)
  })

  it('shows the certificate with the exact name and its signatories', async () => {
    vi.mocked(api.listMyCertificates).mockResolvedValue([cert()])
    renderWithProviders(<CertificatePage />)
    expect(await screen.findByText('Ṣọlá Adéyẹmí')).toBeInTheDocument()
    expect(screen.getByText('Frontend Development')).toBeInTheDocument()
    expect(screen.getByText('Dr. Ngozi Okafor')).toBeInTheDocument()
    expect(screen.getByAltText('Signature of Dr. Ngozi Okafor')).toHaveAttribute(
      'src',
      'https://files.test/p.png',
    )
    expect(screen.getByText(/92%/)).toBeInTheDocument()
  })

  it('downloads the PDF with a recognisable filename', async () => {
    vi.mocked(api.listMyCertificates).mockResolvedValue([cert()])
    renderWithProviders(<CertificatePage />)
    await userEvent.click(await screen.findByRole('button', { name: /Download PDF/ }))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('RUNTech-Space-Sola-Adeyemi-RTS-2026-ABCDEF1234.pdf'),
    )
  })

  it('emails a link on request', async () => {
    vi.mocked(api.listMyCertificates).mockResolvedValue([cert()])
    renderWithProviders(<CertificatePage />)
    await userEvent.click(await screen.findByRole('button', { name: /Email me a link/ }))
    await waitFor(() => expect(api.sendCertificateEmail).toHaveBeenCalledWith('c1'))
  })

  it('shows the public verification link', async () => {
    vi.mocked(api.listMyCertificates).mockResolvedValue([cert()])
    renderWithProviders(<CertificatePage />)
    expect(await screen.findByText(/\/verify\/RTS-2026-ABCDEF1234$/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open verification page/ })).toHaveAttribute(
      'href',
      '/verify/RTS-2026-ABCDEF1234',
    )
  })

  it('explains what is needed when no certificate exists yet', async () => {
    vi.mocked(api.listMyCertificates).mockResolvedValue([])
    renderWithProviders(<CertificatePage />)
    expect(await screen.findByText('Not earned yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Download PDF/ })).not.toBeInTheDocument()
  })

  it('says so when the only certificate was revoked, and offers no download', async () => {
    vi.mocked(api.listMyCertificates).mockResolvedValue([
      cert({ revoked_at: '2026-11-01T00:00:00Z', revoked_reason: 'Issued in error' }),
    ])
    renderWithProviders(<CertificatePage />)
    expect(await screen.findByText('This certificate was revoked')).toBeInTheDocument()
    expect(screen.getByText(/Issued in error/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Download PDF/ })).not.toBeInTheDocument()
  })
})

describe('CertificatePage accessibility', () => {
  it('has no violations', async () => {
    vi.mocked(api.listMyCertificates).mockResolvedValue([cert()])
    const { container } = renderWithProviders(<CertificatePage />)
    await screen.findByText('Ṣọlá Adéyẹmí')
    await expectAccessible(container)
  })
})
