import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/states'

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
