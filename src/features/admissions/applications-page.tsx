import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { friendlyError } from '@/lib/errors'
import type { Application, ApplicationStatus } from '@/types/domain'
import { admissionsKeys, listApplications, reviewApplication } from './api'

const statusBadge: Record<ApplicationStatus, 'warning' | 'success' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'neutral',
}
const date = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

type Filter = 'pending' | 'all'

/** Shared by stack leads and admins; the database only returns the applications each may see. */
export function ApplicationsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Filter>('pending')
  const [review, setReview] = useState<{ application: Application; approve: boolean } | null>(null)
  const [note, setNote] = useState('')
  const { data, error, isPending, refetch } = useQuery({
    queryKey: admissionsKeys.all,
    queryFn: listApplications,
  })

  const mutation = useMutation({
    mutationFn: ({ application, approve }: { application: Application; approve: boolean }) =>
      reviewApplication(application.id, approve, note),
    onSuccess: async (result, vars) => {
      if (result.status === 'rejected')
        toast.success(
          result.emailSent
            ? 'Application rejected. The applicant was emailed.'
            : 'Application rejected.',
        )
      else if (result.status === 'added')
        toast.success(`${vars.application.full_name} was added to the stack.`)
      else if (result.emailSent)
        toast.success(`Approved. An invitation email was sent to ${vars.application.email}.`)
      else
        toast.warning(
          'Approved, but the invitation email could not be sent. Please follow up with the applicant.',
        )
      setReview(null)
      setNote('')
      await queryClient.invalidateQueries({ queryKey: admissionsKeys.all })
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : friendlyError(e))
      setReview(null)
    },
  })

  const items = (data ?? []).filter((a) => filter === 'all' || a.status === 'pending')
  const pendingCount = (data ?? []).filter((a) => a.status === 'pending').length

  return (
    <>
      <PageHeader title="Applications" description="People who applied to join a stack." />
      <div className="mb-4 flex gap-2" role="group" aria-label="Filter applications">
        <Button
          variant={filter === 'pending' ? 'primary' : 'outline'}
          size="sm"
          aria-pressed={filter === 'pending'}
          onClick={() => setFilter('pending')}
        >
          Pending{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </Button>
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
      </div>

      {isPending && <LoadingState />}
      {error && <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />}
      {data && items.length === 0 && (
        <EmptyState
          title={filter === 'pending' ? 'No applications waiting' : 'No applications yet'}
          description="New applications appear here as soon as someone applies."
        />
      )}
      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.id}>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{a.full_name}</h2>
                    <Badge variant={statusBadge[a.status]}>{a.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {a.email}
                    {a.phone ? ` · ${a.phone}` : ''}
                  </p>
                  <p className="mt-1 text-sm">
                    Applied to <span className="font-medium">{a.stacks?.name ?? 'a stack'}</span> on{' '}
                    {date(a.created_at)}
                  </p>
                  {a.motivation && (
                    <p className="mt-2 max-w-prose text-sm text-muted-foreground">{a.motivation}</p>
                  )}
                  {a.review_note && a.status !== 'pending' && (
                    <p className="mt-2 text-sm text-muted-foreground italic">
                      Note: {a.review_note}
                    </p>
                  )}
                </div>
                {a.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Reject ${a.full_name}`}
                      onClick={() => setReview({ application: a, approve: false })}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      aria-label={`Approve ${a.full_name}`}
                      onClick={() => setReview({ application: a, approve: true })}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog open={!!review} onOpenChange={(o) => !o && setReview(null)}>
        {review && (
          <DialogContent
            title={
              review.approve
                ? `Approve ${review.application.full_name}?`
                : `Reject ${review.application.full_name}?`
            }
            description={
              review.approve
                ? 'They get an email with a link to set up their account and join the stack.'
                : 'The application is closed and the applicant gets a polite email. They can apply again later.'
            }
          >
            <FormField
              id="review-note"
              label={review.approve ? 'Note (optional)' : 'Reason (optional)'}
              hint={
                review.approve
                  ? 'Saved with the application. It is not emailed.'
                  : 'Saved with the application and included in the email to the applicant.'
              }
            >
              <Textarea
                id="review-note"
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
              />
            </FormField>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReview(null)}>
                Cancel
              </Button>
              <Button
                variant={review.approve ? 'primary' : 'danger'}
                loading={mutation.isPending}
                onClick={() => mutation.mutate(review)}
              >
                {review.approve ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
