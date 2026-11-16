import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AttentionCard } from '@/components/attention-card'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { fetchRoster, rosterKeys } from '@/features/roster/api'
import { friendlyError } from '@/lib/errors'
import { fetchLeadAttention, fetchStackSummary, leadKeys } from './api'
import { STALLED_AFTER_DAYS, stalledStudents } from './stalled'
import { useMyStacks } from './use-my-stacks'

export function LeadOverviewPage() {
  const { profile } = useAuth()
  const { stacks, isPending, error, refetch } = useMyStacks()
  const summaries = useQueries({
    queries: stacks.map((s) => ({
      queryKey: leadKeys.summary(s.id),
      queryFn: () => fetchStackSummary(s.id),
    })),
  })
  const rosters = useQueries({
    queries: stacks.map((s) => ({
      queryKey: rosterKeys.stack(s.id),
      queryFn: () => fetchRoster(s.id),
    })),
  })
  const attention = useQuery({
    queryKey: leadKeys.attention,
    queryFn: fetchLeadAttention,
    enabled: stacks.length > 0,
  })
  const name = profile?.full_name?.split(' ')[0]

  return (
    <>
      <PageHeader
        title={name ? `Welcome, ${name}` : 'Welcome'}
        description="Your stacks at a glance."
      />
      {isPending && <LoadingState rows={2} />}
      {error && <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />}
      {!isPending && !error && stacks.length === 0 && (
        <EmptyState
          title="No stack assigned yet"
          description="An admin assigns you to a stack. Once that happens, your content and students show up here."
        />
      )}
      {stacks.length > 0 && (
        <section aria-labelledby="needs-you" className="mb-10">
          <h2 id="needs-you" className="mb-4 font-display text-2xl font-extrabold">
            Needs you
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <AttentionCard
              to="/lead/applications"
              count={attention.data?.applications ?? 0}
              label="applications to review"
              emptyLabel="No applications waiting"
            />
            <AttentionCard
              to="/lead/reviews"
              count={attention.data?.submissions ?? 0}
              label="projects to grade"
              emptyLabel="Nothing to grade"
            />
          </div>
        </section>
      )}
      <div className="space-y-8">
        {stacks.map((stack, i) => {
          const summary = summaries[i]?.data
          const roster = rosters[i]?.data
          const active = roster?.filter((r) => r.status === 'active') ?? []
          const average =
            active.length > 0
              ? Math.round(active.reduce((sum, r) => sum + r.overall, 0) / active.length)
              : null
          const stalled = roster ? stalledStudents(roster) : []
          return (
            <section key={stack.id} aria-labelledby={`stack-${stack.id}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <CardTitle id={`stack-${stack.id}`} className="text-xl">
                  {stack.name}
                </CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/lead/content?stack=${stack.id}`}>Manage content</Link>
                </Button>
              </div>
              {summaries[i]?.isPending && <LoadingState rows={1} />}
              {summary && (
                <>
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      label="Modules published"
                      value={`${summary.publishedModules} / ${summary.modules}`}
                    />
                    <StatCard
                      label="Lessons published"
                      value={`${summary.publishedLessons} / ${summary.lessons}`}
                    />
                    <StatCard label="Active students" value={summary.students} />
                    <StatCard
                      label="Average progress"
                      value={average === null ? '–' : `${average}%`}
                    />
                  </dl>
                  {stalled.length > 0 && (
                    <Card className="mt-4">
                      <CardTitle className="text-base">
                        {stalled.length} {stalled.length === 1 ? 'student has' : 'students have'}{' '}
                        gone quiet
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        No lessons or submissions for {STALLED_AFTER_DAYS} days or more. A quick
                        message can get them moving again.
                      </p>
                      <ul className="mt-3 divide-y divide-border text-sm">
                        {stalled.slice(0, 5).map((r) => (
                          <li key={r.user_id} className="flex flex-wrap justify-between gap-2 py-2">
                            <span className="font-medium">{r.full_name ?? r.email}</span>
                            <span className="text-muted-foreground">
                              {r.email}
                              {r.phone ? ` · ${r.phone}` : ''} · {r.idleDays} days
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        className="mt-2 inline-block text-sm font-medium text-primary underline"
                        to={`/lead/students?stack=${stack.id}`}
                      >
                        See all students
                      </Link>
                    </Card>
                  )}
                  {summary.modules === 0 && (
                    <Card className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        This stack has no content yet.{' '}
                        <Link
                          className="font-medium text-primary underline"
                          to={`/lead/content?stack=${stack.id}`}
                        >
                          Add the first module
                        </Link>
                        .
                      </p>
                    </Card>
                  )}
                </>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
