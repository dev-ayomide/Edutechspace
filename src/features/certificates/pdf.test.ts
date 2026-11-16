import type { Certificate } from '@/types/domain'
import { buildCertificatePdf } from './pdf'

const cert: Certificate = {
  id: 'c1',
  certificate_no: 'RTS-2026-ABCDEF1234',
  user_id: 'u',
  stack_id: 's',
  student_name: 'Ṣọlá Adéyẹmí',
  stack_name: 'Frontend Development',
  final_score: 92,
  issued_at: '2026-10-30T10:00:00Z',
  revoked_at: null,
  revoked_reason: null,
  replaced_by: null,
  emailed_at: null,
  signatories: [
    { name: 'Dr. Ngozi Okafor', title: 'President', signature_path: 'president.png' },
    { name: 'Tolu Adeyemi', title: 'Technical Lead', signature_path: null },
  ],
}

describe('buildCertificatePdf', () => {
  it('produces a one-page PDF', async () => {
    const doc = await buildCertificatePdf({
      certificate: cert,
      verifyUrl: 'https://x.test/verify/RTS-2026-ABCDEF1234',
      loadSignature: async () => null,
    })
    const bytes = new Uint8Array(doc.output('arraybuffer'))
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
    expect(doc.getNumberOfPages()).toBe(1)
    expect(doc.internal.pageSize.getWidth()).toBeGreaterThan(doc.internal.pageSize.getHeight())
  })

  it('still produces a certificate when a signature image cannot be loaded or decoded', async () => {
    const load = vi.fn().mockResolvedValueOnce('data:image/png;base64,not-really-an-image')
    const doc = await buildCertificatePdf({
      certificate: cert,
      verifyUrl: 'https://x.test/v',
      loadSignature: load,
    })
    expect(load).toHaveBeenCalledWith('president.png')
    expect(doc.getNumberOfPages()).toBe(1)
  })

  it('handles certificates with no signatories', async () => {
    const doc = await buildCertificatePdf({
      certificate: { ...cert, signatories: [] },
      verifyUrl: 'https://x.test/v',
      loadSignature: async () => null,
    })
    expect(doc.getNumberOfPages()).toBe(1)
  })
})
