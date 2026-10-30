import { useMutation, useQuery } from '@tanstack/react-query'
import { Copy, Download, ExternalLink, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { examKeys, fetchMyExam } from '@/features/exams/api'
import { friendlyError } from '@/lib/errors'
import { certKeys, listMyCertificates, loadSignatureDataUrl, sendCertificateEmail } from './api'
import { CertificateView } from './certificate-view'
import { certificateFilename, pickCertificate, verifyUrl } from './utils'

export function CertificatePage() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const certs = useQuery({
    queryKey: certKeys.mine(userId),
    queryFn: () => listMyCertificates(userId),
    enabled: !!userId,
  })
  const exam = useQuery({ queryKey: examKeys.mine, queryFn: fetchMyExam })
  const [downloading, setDownloading] = useState(false)

  const email = useMutation({
    mutationFn: (id: string) => sendCertificateEmail(id),
    onSuccess: () => toast.success('We sent a link to your email.'),
    onError: (e) =>
      toast.error(friendlyError(e, 'The email could not be sent. Please try again later.')),
  })

  if (certs.isPending) {
    return (
      <>
        <PageHeader title="Certificate" />
        <LoadingState rows={2} />
      </>
    )
  }
  if (certs.error)
    return <ErrorState message={friendlyError(certs.error)} onRetry={() => void certs.refetch()} />

  const { active, latest } = pickCertificate(certs.data)

  if (!active) {
    return (
      <>
        <PageHeader
          title="Certificate"
          description="Your signed, verifiable certificate of completion."
        />
        {latest?.revoked_at ? (
          <EmptyState
            title="This certificate was revoked"
            description={`${latest.revoked_reason ? `Reason: ${latest.revoked_reason}. ` : ''}Please contact RUNTech Space if you think this is a mistake.`}
          />
        ) : (
          <Card>
            <CardTitle>Not earned yet</CardTitle>
            <CardDescription className="mt-1">
              You receive your certificate automatically when you complete every module, pass every
              assignment and pass the final exam.
            </CardDescription>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/dashboard/progress">See my progress</Link>
              </Button>
              {(exam.data?.state === 'ready' || exam.data?.state === 'in_progress') && (
                <Button asChild>
                  <Link to="/dashboard/exam">Go to the exam</Link>
                </Button>
              )}
            </div>
          </Card>
        )}
      </>
    )
  }

  const link = verifyUrl(window.location.origin, active.certificate_no)
  const download = async () => {
    setDownloading(true)
    try {
      const { buildCertificatePdf } = await import('./pdf')
      const doc = await buildCertificatePdf({
        certificate: active,
        verifyUrl: link,
        loadSignature: loadSignatureDataUrl,
      })
      doc.save(certificateFilename(active))
    } catch {
      toast.error('The PDF could not be created. Please try again.')
    } finally {
      setDownloading(false)
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Verification link copied.')
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.')
    }
  }

  return (
    <>
      <PageHeader
        title="Certificate"
        description="Congratulations! Share it with anyone who wants to check it is genuine."
      />
      <CertificateView certificate={active} />
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button loading={downloading} onClick={() => void download()}>
          <Download className="size-4" aria-hidden="true" />
          Download PDF
        </Button>
        <Button variant="outline" loading={email.isPending} onClick={() => email.mutate(active.id)}>
          <Mail className="size-4" aria-hidden="true" />
          Email me a link
        </Button>
        <Button variant="outline" onClick={() => void copy()}>
          <Copy className="size-4" aria-hidden="true" />
          Copy verification link
        </Button>
        <Button asChild variant="ghost">
          <Link to={`/verify/${encodeURIComponent(active.certificate_no)}`}>
            <ExternalLink className="size-4" aria-hidden="true" />
            Open verification page
          </Link>
        </Button>
      </div>
      <p className="mt-3 text-center text-xs break-all text-muted-foreground">{link}</p>
    </>
  )
}
