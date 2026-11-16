import type { Certificate } from '@/types/domain'

export const verifyUrl = (origin: string, certificateNo: string) =>
  `${origin.replace(/\/$/, '')}/verify/${encodeURIComponent(certificateNo)}`

/**
 * The PDF uses a built-in font that only covers Latin-1, so diacritics (e.g. Yoruba ọ, ẹ, Ṣ) are reduced to
 * their base letters in the PDF. The on-screen certificate and the verification page always show the exact name.
 */
export function toPdfSafeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e\u00a0-ÿ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const certificateFilename = (c: Pick<Certificate, 'certificate_no' | 'student_name'>) => {
  const name =
    toPdfSafeText(c.student_name)
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'certificate'
  return `RUNTech-Space-${name}-${c.certificate_no}.pdf`
}

export const formatIssueDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** Active certificate first, else the most recent one. */
export function pickCertificate<T extends { revoked_at: string | null; issued_at: string }>(
  list: readonly T[],
) {
  const sorted = [...list].sort((a, b) => b.issued_at.localeCompare(a.issued_at))
  return { active: sorted.find((c) => !c.revoked_at) ?? null, latest: sorted[0] ?? null }
}
