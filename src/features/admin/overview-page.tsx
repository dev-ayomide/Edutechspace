import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { ErrorState, LoadingState } from '@/components/states'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
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
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active stacks" value={data.stacks} />
          <StatCard label="Stack leads" value={data.leads} />
          <StatCard label="Students in a stack" value={data.students} />
          <StatCard label="Pending invitations" value={data.pendingInvitations} />
        </dl>
      )}
    </>
  )
}
