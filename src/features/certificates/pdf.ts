import type { Certificate } from '@/types/domain'
import { formatIssueDate, toPdfSafeText } from './utils'

export interface PdfOptions {
  certificate: Certificate
  verifyUrl: string
  /** Returns a data URL for a signature image, or null if it cannot be loaded (the line is drawn without it). */
  loadSignature: (path: string) => Promise<string | null>
}

const NAVY: [number, number, number] = [30, 58, 138]
const INK: [number, number, number] = [23, 37, 84]
const MUTED: [number, number, number] = [71, 90, 133]

/** Builds the certificate PDF in memory. jsPDF and qrcode are loaded on demand to keep the main bundle small. */
export async function buildCertificatePdf({
  certificate: c,
  verifyUrl,
  loadSignature,
}: PdfOptions) {
  const [{ jsPDF }, QRCode] = await Promise.all([import('jspdf'), import('qrcode')])
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297
  const H = 210
  doc.setProperties({
    title: `Certificate ${c.certificate_no}`,
    subject: 'Certificate of Completion',
    author: 'RUNTech Space',
  })

  // frame
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(1.6)
  doc.rect(8, 8, W - 16, H - 16)
  doc.setLineWidth(0.4)
  doc.rect(12, 12, W - 24, H - 24)

  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('RUNTech Space', W / 2, 28, { align: 'center' })

  doc.setFontSize(36)
  doc.text('Certificate of Completion', W / 2, 46, { align: 'center' })

  doc.setTextColor(...MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.text('This is to certify that', W / 2, 60, { align: 'center' })

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  const name = toPdfSafeText(c.student_name)
  doc.setFontSize(name.length > 28 ? 26 : 34)
  doc.text(name, W / 2, 76, { align: 'center' })
  const nameWidth = Math.min(doc.getTextWidth(name), W - 60)
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.4)
  doc.line(W / 2 - nameWidth / 2, 80, W / 2 + nameWidth / 2, 80)

  doc.setTextColor(...MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.text('has successfully completed the', W / 2, 92, { align: 'center' })
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(toPdfSafeText(c.stack_name), W / 2, 104, { align: 'center' })
  doc.setTextColor(...MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  const lines = doc.splitTextToSize(
    `by completing every module and assignment and passing the final examination with a score of ${c.final_score}%.`,
    190,
  )
  doc.text(lines, W / 2, 114, { align: 'center' })
  doc.text(`Issued on ${formatIssueDate(c.issued_at)}`, W / 2, 130, { align: 'center' })

  // signatories
  const sigs = c.signatories.slice(0, 4)
  if (sigs.length > 0) {
    const slot = (W - 60) / sigs.length
    for (const [i, sig] of sigs.entries()) {
      const cx = 30 + slot * i + slot / 2
      if (sig.signature_path) {
        const data = await loadSignature(sig.signature_path)
        if (data) {
          try {
            const fmt = /^data:image\/(png|jpe?g|webp)/i
              .exec(data)?.[1]
              ?.toUpperCase()
              .replace('JPG', 'JPEG')
            doc.addImage(data, fmt ?? 'PNG', cx - 20, 138, 40, 14, undefined, 'FAST')
          } catch {
            // an unreadable image must not stop the certificate from being produced
          }
        }
      }
      doc.setDrawColor(...INK)
      doc.setLineWidth(0.3)
      doc.line(cx - 28, 154, cx + 28, 154)
      doc.setTextColor(...INK)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(toPdfSafeText(sig.name), cx, 159, { align: 'center' })
      doc.setTextColor(...MUTED)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(toPdfSafeText(sig.title), cx, 164, { align: 'center' })
    }
  }

  // verification block: vector QR code (no canvas needed) + number + link
  const qr = QRCode.create(verifyUrl, { errorCorrectionLevel: 'M' })
  const size = qr.modules.size
  const cell = 18 / size
  const qx = 20
  const qy = 174
  doc.setFillColor(0, 0, 0)
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (qr.modules.get(row, col)) doc.rect(qx + col * cell, qy + row * cell, cell, cell, 'F')
    }
  }
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`Certificate no. ${c.certificate_no}`, qx + 23, qy + 6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text('Verify this certificate at:', qx + 23, qy + 11)
  doc.text(verifyUrl, qx + 23, qy + 16)

  return doc
}
