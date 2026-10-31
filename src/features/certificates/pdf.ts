import type { jsPDF as JsPdf } from 'jspdf'
import type { Certificate } from '@/types/domain'
import { formatIssueDate, toPdfSafeText } from './utils'

export interface PdfOptions {
  certificate: Certificate
  verifyUrl: string
  /** Returns a data URL for a signature image, or null if it cannot be loaded (the line is drawn without it). */
  loadSignature: (path: string) => Promise<string | null>
}

type RGB = [number, number, number]
const NAVY: RGB = [10, 23, 68]
const INK: RGB = [10, 23, 68]
const MUTED: RGB = [81, 97, 143]
const ULTRA: RGB = [24, 24, 200]
const CYAN: RGB = [8, 241, 255]
const GOLD: RGB = [245, 183, 0]

/** The brand "R" mark drawn from flat shapes, in a 423 x 477 box scaled to `height` mm. */
function drawMark(doc: JsPdf, x: number, y: number, height: number) {
  const k = height / 477
  const poly = (pts: [number, number][], fill: RGB) => {
    doc.setFillColor(...fill)
    const [first, ...rest] = pts
    let px = first![0]
    let py = first![1]
    const segs = rest.map(([qx, qy]) => {
      const d: [number, number] = [(qx - px) * k, (qy - py) * k]
      px = qx
      py = qy
      return d
    })
    doc.lines(segs, x + first![0] * k, y + first![1] * k, [1, 1], 'F', true)
  }
  poly(
    [
      [0, 0],
      [265, 295],
      [0, 477],
    ],
    [10, 132, 255],
  )
  poly(
    [
      [0, 0],
      [270, 0],
      [335, 18],
      [385, 55],
      [408, 132],
      [395, 185],
      [355, 232],
      [265, 295],
    ],
    [47, 216, 255],
  )
  poly(
    [
      [265, 295],
      [423, 477],
      [0, 477],
    ],
    [42, 36, 178],
  )
}

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

  // frame: a gold "lift" behind an ink-outlined page, like the cards in the app
  doc.setFillColor(...GOLD)
  doc.rect(12, 12, W - 16, H - 16, 'F')
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(1)
  doc.rect(8, 8, W - 16, H - 16, 'FD')
  doc.setLineWidth(0.25)
  doc.rect(12, 12, W - 24, H - 24)

  // brand lockup
  drawMark(doc, W / 2 - 33, 19, 11)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...ULTRA)
  doc.text('RUN', W / 2 - 19, 25.5)
  const runWidth = doc.getTextWidth('RUN')
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'normal')
  doc.text('Tech Space', W / 2 - 19 + runWidth + 0.8, 25.5)

  doc.setFontSize(36)
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
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
  doc.setDrawColor(...CYAN)
  doc.setLineWidth(1.4)
  doc.line(W / 2 - nameWidth / 2, 81, W / 2 + nameWidth / 2, 81)

  doc.setTextColor(...MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.text('has successfully completed the', W / 2, 92, { align: 'center' })
  doc.setTextColor(...ULTRA)
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

  // seal
  doc.setFillColor(...GOLD)
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.8)
  doc.circle(W - 40, 40, 13, 'FD')
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('VERIFIED', W - 40, 39.5, { align: 'center' })
  doc.setFontSize(5.5)
  doc.text('RUNTech Space', W - 40, 44, { align: 'center' })

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
