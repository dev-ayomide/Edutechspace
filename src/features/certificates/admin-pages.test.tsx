import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { AdminCertificatesPage } from './admin-certificates-page'
import { SignatoriesPage } from './signatories-page'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  listAllCertificates: vi.fn(),
  revokeCertificate: vi.fn(),
  reissueCertificate: vi.fn(),
  listSignatories: vi.fn(),
  saveSignatory: vi.fn(),
  setSignatoryActive: vi.fn(),
  uploadSignature: vi.fn(),
  signatureUrl: (p: string) => `https://files.test/${p}`,
}))

const cert = (id: string, over: Partial<api.AdminCertificate> = {}): api.AdminCertificate => ({
  id,
  certificate_no: `RTS-2026-${id}`,
  user_id: 'u',
  stack_id: 's',
  student_name: `Student ${id}`,
  stack_name: 'Frontend',
  final_score: 90,
  issued_at: '2026-10-30T10:00:00Z',
  revoked_at: null,
  revoked_reason: null,
  replaced_by: null,
  emailed_at: null,
  signatories: [{ name: 'A', title: 'President', signature_path: null }],
  profiles: { email: `${id}@x.test` },
  ...over,
})

describe('AdminCertificatesPage', () => {
  beforeEach(() => {
    vi.mocked(api.listAllCertificates).mockResolvedValue([
      cert('AAA'),
      cert('BBB', {
        revoked_at: '2026-11-01T00:00:00Z',
        revoked_reason: 'Issued in error',
        replaced_by: 'x',
      }),
      cert('CCC', { signatories: [] }),
    ])
    vi.mocked(api.revokeCertificate).mockReset().mockResolvedValue(undefined)
    vi.mocked(api.reissueCertificate).mockReset().mockResolvedValue(undefined)
  })

  it('lists certificates with their status and flags missing signatures', async () => {
    renderWithProviders(<AdminCertificatesPage />)
    expect(await screen.findByText('RTS-2026-AAA')).toBeInTheDocument()
    expect(screen.getByText(/Revoked: Issued in error/)).toBeInTheDocument()
    expect(screen.getByText('No signatures')).toBeInTheDocument()
  })

  it('searches by name, email or number', async () => {
    renderWithProviders(<AdminCertificatesPage />)
    await screen.findByText('RTS-2026-AAA')
    await userEvent.type(screen.getByLabelText('Search certificates'), 'ccc@x')
    expect(screen.queryByText('RTS-2026-AAA')).not.toBeInTheDocument()
    expect(screen.getByText('RTS-2026-CCC')).toBeInTheDocument()
  })

  it('revokes with a reason after confirming', async () => {
    renderWithProviders(<AdminCertificatesPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Revoke RTS-2026-AAA' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/Reason/), 'Cheating')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }))
    await waitFor(() => expect(api.revokeCertificate).toHaveBeenCalledWith('AAA', 'Cheating'))
  })

  it('does not offer to revoke what is already revoked, nor to reissue what was already replaced', async () => {
    renderWithProviders(<AdminCertificatesPage />)
    await screen.findByText('RTS-2026-BBB')
    expect(screen.queryByRole('button', { name: 'Revoke RTS-2026-BBB' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reissue RTS-2026-BBB' })).not.toBeInTheDocument()
  })

  it('reissues after confirming', async () => {
    renderWithProviders(<AdminCertificatesPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Reissue RTS-2026-CCC' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Reissue' }),
    )
    await waitFor(() => expect(api.reissueCertificate).toHaveBeenCalledWith('CCC'))
  })
})

describe('SignatoriesPage', () => {
  const sig = (id: string, name: string, title: string, active = true): api.Signatory => ({
    id,
    name,
    title,
    signature_path: id === 's1' ? 'p.png' : null,
    display_order: 1,
    is_active: active,
  })

  beforeEach(() => {
    vi.mocked(api.saveSignatory).mockReset().mockResolvedValue(undefined)
    vi.mocked(api.setSignatoryActive).mockReset().mockResolvedValue(undefined)
    vi.mocked(api.uploadSignature).mockReset().mockResolvedValue('new.png')
  })

  it('warns when there are no active signatories', async () => {
    vi.mocked(api.listSignatories).mockResolvedValue([sig('s1', 'Dr. Okafor', 'President', false)])
    renderWithProviders(<SignatoriesPage />)
    expect(await screen.findByText(/No active signatories/)).toBeInTheDocument()
  })

  it('lists signatories with their signature image', async () => {
    vi.mocked(api.listSignatories).mockResolvedValue([
      sig('s1', 'Dr. Okafor', 'President'),
      sig('s2', 'Tolu', 'Technical Lead'),
    ])
    renderWithProviders(<SignatoriesPage />)
    expect(await screen.findByText('Dr. Okafor')).toBeInTheDocument()
    expect(screen.getByAltText('Signature of Dr. Okafor')).toHaveAttribute(
      'src',
      'https://files.test/p.png',
    )
    expect(screen.queryByText(/No active signatories/)).not.toBeInTheDocument()
  })

  it('deactivates a signatory', async () => {
    vi.mocked(api.listSignatories).mockResolvedValue([sig('s1', 'Dr. Okafor', 'President')])
    renderWithProviders(<SignatoriesPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Deactivate Dr. Okafor' }))
    await waitFor(() => expect(api.setSignatoryActive).toHaveBeenCalledWith('s1', false))
  })

  it('validates and saves a new signatory with an uploaded signature', async () => {
    vi.mocked(api.listSignatories).mockResolvedValue([])
    renderWithProviders(<SignatoriesPage />)
    await userEvent.click(await screen.findByRole('button', { name: /Add signatory/ }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await within(dialog).findByText('Enter a name')).toBeInTheDocument()
    expect(api.saveSignatory).not.toHaveBeenCalled()

    await userEvent.type(within(dialog).getByLabelText('Name'), 'Staff Patron Name')
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Staff Patron')
    await userEvent.upload(
      within(dialog).getByLabelText('Signature image'),
      new File(['x'], 'sig.png', { type: 'image/png' }),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(api.saveSignatory).toHaveBeenCalledWith(
        {
          name: 'Staff Patron Name',
          title: 'Staff Patron',
          display_order: 1,
          signature_path: 'new.png',
        },
        undefined,
      ),
    )
  })

  it('rejects a signature that is not an image', async () => {
    vi.mocked(api.listSignatories).mockResolvedValue([])
    renderWithProviders(<SignatoriesPage />)
    await userEvent.click(await screen.findByRole('button', { name: /Add signatory/ }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.upload(
      within(dialog).getByLabelText('Signature image'),
      new File(['x'], 'sig.pdf', { type: 'application/pdf' }),
      { applyAccept: false },
    )
    expect(await within(dialog).findByText('Upload a PNG, JPG or WebP image.')).toBeInTheDocument()
  })
})
