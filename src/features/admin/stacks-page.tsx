import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, Td, Th } from '@/components/ui/table'
import {
  listStackSummaries,
  setStackActive,
  stackKeys,
  type StackSummary,
} from '@/features/stacks/api'
import { friendlyError } from '@/lib/errors'
import { StackDialog } from './stack-dialog'

export function StacksPage() {
  const queryClient = useQueryClient()
  const { data, error, isPending, refetch } = useQuery({
    queryKey: stackKeys.summaries,
    queryFn: listStackSummaries,
  })
  const [editing, setEditing] = useState<StackSummary | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setStackActive(id, active),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: stackKeys.all }),
    onError: (e) => toast.error(friendlyError(e)),
  })

  const openDialog = (stack: StackSummary | null) => {
    setEditing(stack)
    setDialogOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Stacks"
        description="The learning tracks on the platform."
        actions={
          <Button onClick={() => openDialog(null)}>
            <Plus className="size-4" aria-hidden="true" />
            New stack
          </Button>
        }
      />
      {isPending && <LoadingState />}
      {error && <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />}
      {data && data.length === 0 && (
        <EmptyState title="No stacks yet" description="Create the first stack to get started." />
      )}
      {data && data.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Stack</Th>
              <Th>Leads</Th>
              <Th>Students</Th>
              <Th>Status</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {data.map((stack) => (
              <tr key={stack.id}>
                <Td>
                  <p className="font-medium">{stack.name}</p>
                  <p className="text-xs text-muted-foreground">{stack.slug}</p>
                </Td>
                <Td>{stack.lead_count}</Td>
                <Td>{stack.member_count}</Td>
                <Td>
                  <Badge variant={stack.is_active ? 'success' : 'neutral'}>
                    {stack.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Edit ${stack.name}`}
                      onClick={() => openDialog(stack)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${stack.is_active ? 'Deactivate' : 'Activate'} ${stack.name}`}
                      loading={toggle.isPending && toggle.variables?.id === stack.id}
                      onClick={() => toggle.mutate({ id: stack.id, active: !stack.is_active })}
                    >
                      {stack.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <StackDialog open={dialogOpen} onOpenChange={setDialogOpen} stack={editing} />
    </>
  )
}
