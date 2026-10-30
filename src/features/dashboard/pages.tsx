import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/features/auth/auth-context'

export function ComingSoonPage({ title, phase }: { title: string; phase: number }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        title="Coming soon"
        description={`This screen is planned for Phase ${phase} of the platform roadmap.`}
      />
    </>
  )
}

function greeting(name: string | null | undefined) {
  return name ? `Welcome, ${name.split(' ')[0]}` : 'Welcome'
}

export function StudentOverviewPage() {
  const { profile } = useAuth()
  return (
    <>
      <PageHeader title={greeting(profile?.full_name)} description="Your learning at a glance." />
      <Card>
        <CardTitle>Your progress</CardTitle>
        <CardDescription className="mt-1">
          You are not in a stack yet. Once your application is approved, your progress toward
          certification appears here.
        </CardDescription>
        <Progress value={0} label="Overall progress" className="mt-4" />
      </Card>
    </>
  )
}

export function LeadOverviewPage() {
  const { profile } = useAuth()
  return (
    <>
      <PageHeader title={greeting(profile?.full_name)} description="Your stack at a glance." />
      <EmptyState
        title="No stack assigned yet"
        description="An admin assigns you to a stack when they invite you. Students, applications and submissions will show up here."
      />
    </>
  )
}

export function AdminOverviewPage() {
  const { profile } = useAuth()
  return (
    <>
      <PageHeader title={greeting(profile?.full_name)} description="Platform overview." />
      <EmptyState
        title="Nothing to review yet"
        description="Stacks, lead invitations and certificates will be managed from here."
      />
    </>
  )
}

export function JoinPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <PageHeader title="Join a stack" description="Applications open soon." />
      <Card>
        <CardDescription>
          The application form is built in Phase 2. Already approved?{' '}
          <Button asChild variant="ghost" size="sm" className="inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
        </CardDescription>
      </Card>
    </div>
  )
}
