import type { Certificate } from '@/types/domain'
import { signatureUrl } from './api'
import { formatIssueDate } from './utils'

/** The on-screen certificate. Always shows the exact name; the PDF may simplify diacritics. */
export function CertificateView({ certificate: c }: { certificate: Certificate }) {
  return (
    <figure
      aria-label={`Certificate of completion for ${c.student_name}`}
      className="mx-auto w-full max-w-3xl rounded-[1.75rem] border-2 border-outline bg-card p-2 shadow-hard-gold"
    >
      <div className="flex flex-col items-center rounded-[1.4rem] border border-outline/40 px-5 py-8 text-center sm:px-10 sm:py-12">
        <p className="text-sm font-bold tracking-[0.2em] text-link uppercase">RUNTech Space</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          Certificate of Completion
        </h2>
        <p className="mt-6 text-sm text-muted-foreground">This is to certify that</p>
        <p className="mt-2 border-b-4 border-accent px-4 pb-1 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          {c.student_name}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">has successfully completed the</p>
        <p className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          {c.stack_name}
        </p>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          by completing every module and assignment and passing the final examination with a score
          of {c.final_score}%.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Issued on {formatIssueDate(c.issued_at)}
        </p>

        {c.signatories.length > 0 && (
          <ul
            className="mt-8 grid w-full gap-6"
            style={{
              gridTemplateColumns: `repeat(${Math.min(c.signatories.length, 3)}, minmax(0, 1fr))`,
            }}
          >
            {c.signatories.map((s) => (
              <li key={s.name + s.title} className="flex flex-col items-center">
                <div className="flex h-12 items-end">
                  {s.signature_path && (
                    <img
                      src={signatureUrl(s.signature_path)}
                      alt={`Signature of ${s.name}`}
                      className="max-h-12 max-w-full object-contain"
                    />
                  )}
                </div>
                <div className="mt-1 h-px w-full bg-foreground/60" />
                <p className="mt-1 text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.title}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-8 text-xs text-muted-foreground">Certificate no. {c.certificate_no}</p>
      </div>
    </figure>
  )
}
