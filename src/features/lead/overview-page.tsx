import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { friendlyError } from '@/lib/errors'
import { fetchStackSummary, leadKeys } from './api'
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
      <div className="space-y-8">
        {stacks.map((stack, i) => {
          const summary = summaries[i]?.data
          return (
            <section key={stack.id} aria-labelledby={`stack-${stack.id}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <CardTitle id={`stack-${stack.id}`} className="text-lg">
                  {stack.name}
                </CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/lead/content?stack=${stack.id}`}>Manage content</Link>
                </Button>
              </div>
              {summaries[i]?.isPending && <LoadingState rows={1} />}
              {summary && (
                <>
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                      label="Modules published"
                      value={`${summary.publishedModules} / ${summary.modules}`}
                    />
                    <StatCard
                      label="Lessons published"
                      value={`${summary.publishedLessons} / ${summary.lessons}`}
                    />
                    <StatCard label="Active students" value={summary.students} />
                  </dl>
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
