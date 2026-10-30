import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/states'
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
