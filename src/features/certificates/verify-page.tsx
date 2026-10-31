import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, ShieldAlert, SearchX } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { certKeys, verifyCertificate } from './api'
import { formatIssueDate } from './utils'

/** Public: anyone can check a certificate number. Shows only what is printed on the certificate. */
export function VerifyPage() {
  const { number = '' } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(number)
  const result = useQuery({
    queryKey: certKeys.verify(number),
    queryFn: () => verifyCertificate(number),
    enabled: number.trim() !== '',
  })

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Verify a certificate</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the certificate number printed on the certificate, or scan its QR code.
      </p>
      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (input.trim()) navigate(`/verify/${encodeURIComponent(input.trim())}`)
        }}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="cert-no">Certificate number</Label>
          <Input
            id="cert-no"
            value={input}
            placeholder="RTS-2026-XXXXXXXXXX"
            autoComplete="off"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <Button type="submit">Check</Button>
      </form>

      <div className="mt-8" aria-live="polite">
        {number && result.isPending && <LoadingState rows={1} />}
        {number && result.error && (
          <Card role="alert" className="text-center">
            <p className="font-semibold">We could not check this right now.</p>
            <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
          </Card>
        )}
        {number && result.data === null && (
          <Card className="text-center">
            <SearchX className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold">No certificate found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the number and try again. It should look like RTS-2026-XXXXXXXXXX.
            </p>
          </Card>
        )}
        {result.data && (
          <Card className={result.data.status === 'valid' ? 'border-success' : 'border-danger'}>
            <div className="flex items-center gap-3">
              {result.data.status === 'valid' ? (
                <BadgeCheck className="size-10 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <ShieldAlert className="size-10 shrink-0 text-danger" aria-hidden="true" />
              )}
              <div>
                <h2 className="text-lg font-bold">
                  {result.data.status === 'valid'
                    ? 'This certificate is valid'
                    : 'This certificate has been revoked'}
                </h2>
                {result.data.revoked_at && (
                  <p className="text-sm text-muted-foreground">
                    Revoked on {formatIssueDate(result.data.revoked_at)}
                  </p>
                )}
              </div>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ['Awarded to', result.data.student_name],
                ['Stack', result.data.stack_name],
                ['Issued on', formatIssueDate(result.data.issued_at)],
                ['Certificate number', result.data.certificate_no],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>
    </div>
  )
}
