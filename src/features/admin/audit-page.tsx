import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Table, Td, Th } from '@/components/ui/table'
import { listStacks, stackKeys } from '@/features/stacks/api'
import { friendlyError } from '@/lib/errors'
import { auditKeys, listAuditLog } from './api'
import { actionLabels } from './audit-labels'

const PAGE = 100

const details = (meta: Record<string, unknown>, stackName: (id: string) => string | undefined) => {
  const stack = typeof meta.stack_id === 'string' ? stackName(meta.stack_id) : undefined
  const rest = Object.entries(meta)
    .filter(([k]) => !k.endsWith('_id') && k !== 'id')
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v)}`)
  return [stack, ...rest].filter(Boolean).join(' · ')
}

export function AuditPage() {
  const [limit, setLimit] = useState(PAGE)
  const log = useQuery({
    queryKey: auditKeys.list(limit),
    queryFn: () => listAuditLog(limit),
    placeholderData: (prev) => prev,
  })
  const stacks = useQuery({ queryKey: stackKeys.all, queryFn: listStacks })
  const stackName = (id: string) => stacks.data?.find((s) => s.id === id)?.name

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every sensitive action on the platform: who did it and when."
      />
      {log.isPending && <LoadingState />}
      {log.error && (
        <ErrorState message={friendlyError(log.error)} onRetry={() => void log.refetch()} />
      )}
      {log.data && log.data.length === 0 && (
        <EmptyState
          title="Nothing recorded yet"
          description="Actions appear here as they happen."
        />
      )}
      {log.data && log.data.length > 0 && (
        <>
          <Table>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>What</Th>
                <Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              {log.data.map((e) => (
                <tr key={e.id}>
                  <Td className="whitespace-nowrap tabular-nums">
                    {format(new Date(e.created_at), 'd MMM yyyy, HH:mm')}
                  </Td>
                  <Td>{e.actor ?? (e.actor_id ? 'Deleted user' : 'System')}</Td>
                  <Td className="font-medium">{actionLabels[e.action] ?? e.action}</Td>
                  <Td className="text-muted-foreground">{details(e.meta, stackName)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {log.data.length >= limit && (
            <Button
              variant="outline"
              className="mt-4"
              loading={log.isFetching}
              onClick={() => setLimit((n) => n + PAGE)}
            >
              Show older entries
            </Button>
          )}
        </>
      )}
    </>
  )
}
