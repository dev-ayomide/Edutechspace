import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, Td, Th } from '@/components/ui/table'
import { listStacks, stackKeys } from '@/features/stacks/api'
import { friendlyError } from '@/lib/errors'
import type { InvitationStatus } from '@/types/domain'
import { adminKeys, inviteLead, listInvitations, revokeInvitation } from './api'

const schema = z.object({
  email: z.string().trim().min(1, 'Enter an email').email('Enter a valid email'),
  stack_id: z.string().min(1, 'Choose a stack'),
})
type FormValues = z.infer<typeof schema>

const statusBadge: Record<InvitationStatus, 'warning' | 'success' | 'neutral'> = {
  pending: 'warning',
  accepted: 'success',
  revoked: 'neutral',
}

const date = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export function InvitationsPage() {
  const queryClient = useQueryClient()
  const stacks = useQuery({ queryKey: stackKeys.all, queryFn: listStacks })
  const invitations = useQuery({ queryKey: adminKeys.invitations, queryFn: listInvitations })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', stack_id: '' },
  })

  const invite = useMutation({
    mutationFn: (v: FormValues) => inviteLead(v.email, v.stack_id),
    onSuccess: async (result, v) => {
      toast.success(
        result.status === 'assigned'
          ? `${v.email} is already a stack lead and now leads this stack too.`
          : `Invitation sent to ${v.email}.`,
      )
      reset()
      await queryClient.invalidateQueries({ queryKey: adminKeys.invitations })
      await queryClient.invalidateQueries({ queryKey: stackKeys.all })
      await queryClient.invalidateQueries({ queryKey: adminKeys.overview })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : friendlyError(e)),
  })

  const revoke = useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: async () => {
      toast.success('Invitation revoked.')
      await queryClient.invalidateQueries({ queryKey: adminKeys.invitations })
      await queryClient.invalidateQueries({ queryKey: adminKeys.overview })
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const activeStacks = stacks.data?.filter((s) => s.is_active) ?? []

  return (
    <>
      <PageHeader
        title="Lead invitations"
        description="Invite stack leads by email. They set their own password."
      />
      <Card className="mb-8">
        <CardTitle>Invite a stack lead</CardTitle>
        <CardDescription className="mt-1">
          If the person is already a stack lead, they are added to the chosen stack without a new
          email.
        </CardDescription>
        <form
          onSubmit={handleSubmit((v) => invite.mutate(v))}
          className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
          noValidate
        >
          <FormField id="invite-email" label="Email" error={errors.email?.message}>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'invite-email-error' : undefined}
              {...register('email')}
            />
          </FormField>
          <FormField id="invite-stack" label="Stack" error={errors.stack_id?.message}>
            <Select
              id="invite-stack"
              aria-invalid={!!errors.stack_id}
              aria-describedby={errors.stack_id ? 'invite-stack-error' : undefined}
              {...register('stack_id')}
            >
              <option value="">Select a stack</option>
              {activeStacks.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>
          <Button type="submit" className="sm:mt-[1.625rem]" loading={invite.isPending}>
            Send invitation
          </Button>
        </form>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Invitations</h2>
      {invitations.isPending && <LoadingState rows={2} />}
      {invitations.error && (
        <ErrorState
          message={friendlyError(invitations.error)}
          onRetry={() => void invitations.refetch()}
        />
      )}
      {invitations.data && invitations.data.length === 0 && (
        <EmptyState
          title="No invitations yet"
          description="Invitations you send appear here with their status."
        />
      )}
      {invitations.data && invitations.data.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Stack</Th>
              <Th>Status</Th>
              <Th>Sent</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {invitations.data.map((inv) => (
              <tr key={inv.id}>
                <Td className="font-medium">{inv.email}</Td>
                <Td>{inv.role === 'stack_lead' ? 'Stack lead' : 'Student'}</Td>
                <Td>{inv.stacks?.name ?? '-'}</Td>
                <Td>
                  <Badge variant={statusBadge[inv.status]}>{inv.status}</Badge>
                </Td>
                <Td>{date(inv.created_at)}</Td>
                <Td>
                  {inv.status === 'pending' && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Revoke invitation for ${inv.email}`}
                        loading={revoke.isPending && revoke.variables === inv.id}
                        onClick={() => revoke.mutate(inv.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
