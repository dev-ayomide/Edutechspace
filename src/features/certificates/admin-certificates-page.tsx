import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, Td, Th } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { friendlyError } from '@/lib/errors'
import {
  certKeys,
  listAllCertificates,
  reissueCertificate,
  revokeCertificate,
  type AdminCertificate,
} from './api'
import { formatIssueDate } from './utils'

export function AdminCertificatesPage() {
  const queryClient = useQueryClient()
  const { data, error, isPending, refetch } = useQuery({
    queryKey: certKeys.admin,
    queryFn: listAllCertificates,
  })
  const [search, setSearch] = useState('')
  const [revoking, setRevoking] = useState<AdminCertificate | null>(null)
  const [reissuing, setReissuing] = useState<AdminCertificate | null>(null)
  const [reason, setReason] = useState('')

  const refresh = async () => queryClient.invalidateQueries({ queryKey: certKeys.all })
  const revoke = useMutation({
    mutationFn: (c: AdminCertificate) => revokeCertificate(c.id, reason),
    onSuccess: async () => {
      toast.success('Certificate revoked.')
      setRevoking(null)
      setReason('')
      await refresh()
    },
    onError: (e) => {
      toast.error(friendlyError(e))
      setRevoking(null)
    },
  })
  const reissue = useMutation({
    mutationFn: (c: AdminCertificate) => reissueCertificate(c.id),
    onSuccess: async () => {
      toast.success('A new certificate was issued. The old one is revoked.')
      setReissuing(null)
      await refresh()
    },
    onError: (e) => {
      toast.error(friendlyError(e))
      setReissuing(null)
    },
  })

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const all = data ?? []
    return q
      ? all.filter((c) =>
          [c.certificate_no, c.student_name, c.profiles?.email ?? '', c.stack_name].some((v) =>
            v.toLowerCase().includes(q),
          ),
        )
      : all
  }, [data, search])

  return (
    <>
      <PageHeader title="Certificates" description="Every certificate issued on the platform." />
      <div className="mb-4 max-w-sm">
        <label htmlFor="cert-search" className="sr-only">
          Search certificates
        </label>
        <Input
          id="cert-search"
          type="search"
          placeholder="Search by name, email or number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {isPending && <LoadingState />}
      {error && <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />}
      {data && rows.length === 0 && (
        <EmptyState
          title="No certificates found"
          description="Certificates appear here when students pass their final exam."
        />
      )}
      {rows.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Certificate</Th>
              <Th>Student</Th>
              <Th>Stack</Th>
              <Th>Issued</Th>
              <Th>Status</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <Td className="font-mono text-xs">{c.certificate_no}</Td>
                <Td>
                  <p className="font-medium">{c.student_name}</p>
                  <p className="text-xs text-muted-foreground">{c.profiles?.email}</p>
                </Td>
                <Td>{c.stack_name}</Td>
                <Td className="whitespace-nowrap">{formatIssueDate(c.issued_at)}</Td>
                <Td>
                  {c.revoked_at ? (
                    <Badge variant="danger">
                      Revoked{c.revoked_reason ? `: ${c.revoked_reason}` : ''}
                    </Badge>
                  ) : (
                    <Badge variant="success">Valid</Badge>
                  )}
                  {c.signatories.length === 0 && !c.revoked_at && (
                    <p className="mt-1 text-xs text-warning">No signatures</p>
                  )}
                </Td>
                <Td>
                  <div className="flex justify-end gap-2 whitespace-nowrap">
                    {!c.revoked_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Revoke ${c.certificate_no}`}
                        onClick={() => setRevoking(c)}
                      >
                        Revoke
                      </Button>
                    )}
                    {!c.replaced_by && (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Reissue ${c.certificate_no}`}
                        onClick={() => setReissuing(c)}
                      >
                        Reissue
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Dialog open={!!revoking} onOpenChange={(o) => !o && setRevoking(null)}>
        {revoking && (
          <DialogContent
            title={`Revoke ${revoking.certificate_no}?`}
            description="The public verification page will show it as revoked. This cannot be undone, but you can reissue a new certificate."
          >
            <FormField id="revoke-reason" label="Reason (optional)">
              <Textarea
                id="revoke-reason"
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
              />
            </FormField>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRevoking(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={revoke.isPending}
                onClick={() => revoke.mutate(revoking)}
              >
                Revoke
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      <ConfirmDialog
        open={!!reissuing}
        onOpenChange={(o) => !o && setReissuing(null)}
        title="Reissue this certificate?"
        description="A new certificate with a new number is issued using the student's current name and the active signatories. The old one is revoked."
        confirmLabel="Reissue"
        tone="primary"
        loading={reissue.isPending}
        onConfirm={() => reissuing && reissue.mutate(reissuing)}
      />
    </>
  )
}
