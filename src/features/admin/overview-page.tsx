import { useQuery } from '@tanstack/react-query'
import { PenLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AttentionCard } from '@/components/attention-card'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/states'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { friendlyError } from '@/lib/errors'
import { adminKeys, fetchOverview } from './api'

export function AdminOverviewPage() {
  const { profile } = useAuth()
  const { data, error, isPending, refetch } = useQuery({
    queryKey: adminKeys.overview,
    queryFn: fetchOverview,
  })
  const name = profile?.full_name?.split(' ')[0]

  return (
    <>
      <PageHeader
        title={name ? `Welcome, ${name}` : 'Welcome'}
        description="Platform overview."
        actions={
          <Button asChild>
            <Link to="/admin/invitations">Invite a stack lead</Link>
          </Button>
        }
      />
      {isPending && <LoadingState rows={2} />}
      {error && <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />}
      {data && (
        <>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active stacks" value={data.stacks} />
            <StatCard label="Stack leads" value={data.leads} />
            <StatCard label="Students in a stack" value={data.students} />
            <StatCard label="Pending invitations" value={data.pendingInvitations} />
          </dl>

          <section aria-labelledby="attention" className="mt-10">
            <h2 id="attention" className="mb-4 font-display text-2xl font-extrabold tracking-tight">
              Needs attention
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <AttentionCard
                to="/admin/applications"
                count={data.pendingApplications}
                label="applications waiting for review"
                emptyLabel="No applications waiting"
              />
              <AttentionCard
                to="/admin/invitations"
                count={data.pendingInvitations}
                label="invitations not accepted yet"
                emptyLabel="No pending invitations"
              />
            </div>
            {data.activeSignatories === 0 && (
              <Card
                tone="gold"
                className="mt-4 flex flex-wrap items-center justify-between gap-4"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <PenLine className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <p className="font-bold">
                    No active certificate signatories. Certificates issued now will have no
                    signatures.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/signatories">Add signatories</Link>
                </Button>
              </Card>
            )}
          </section>
        </>
      )}
    </>
  )
}
