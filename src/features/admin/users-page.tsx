import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, Td, Th } from '@/components/ui/table'
import { useAuth } from '@/features/auth/auth-context'
import { stackKeys } from '@/features/stacks/api'
import { friendlyError } from '@/lib/errors'
import { ROLES, type Role } from '@/types/domain'
import { adminKeys, listUsers, removeLeadFromStack, setUserRole, type AdminUser } from './api'

const roleLabel: Record<Role, string> = {
  student: 'Student',
  stack_lead: 'Stack lead',
  admin: 'Admin',
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const { data, error, isPending, refetch } = useQuery({
    queryKey: adminKeys.users,
    queryFn: listUsers,
  })
  const [search, setSearch] = useState('')
  const [pendingRole, setPendingRole] = useState<{ user: AdminUser; role: Role } | null>(null)
  const [pendingRemove, setPendingRemove] = useState<{
    user: AdminUser
    stackId: string
    stackName: string
  } | null>(null)

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: adminKeys.users })
    await queryClient.invalidateQueries({ queryKey: adminKeys.overview })
    await queryClient.invalidateQueries({ queryKey: stackKeys.all })
  }

  const changeRole = useMutation({
    mutationFn: ({ user, role }: { user: AdminUser; role: Role }) => setUserRole(user.id, role),
    onSuccess: async () => {
      toast.success('Role updated.')
      setPendingRole(null)
      await refresh()
    },
    onError: (e) => {
      toast.error(friendlyError(e))
      setPendingRole(null)
    },
  })

  const removeLead = useMutation({
    mutationFn: ({ user, stackId }: { user: AdminUser; stackId: string }) =>
      removeLeadFromStack(user.id, stackId),
    onSuccess: async () => {
      toast.success('Lead removed from the stack.')
      setPendingRemove(null)
      await refresh()
    },
    onError: (e) => {
      toast.error(friendlyError(e))
      setPendingRemove(null)
    },
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!data) return []
    return q
      ? data.filter(
          (u) => u.email.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q),
        )
      : data
  }, [data, search])

  return (
    <>
      <PageHeader title="Users" description="Everyone with an account, and what they can do." />
      <div className="mb-4 max-w-sm">
        <label htmlFor="user-search" className="sr-only">
          Search users
        </label>
        <Input
          id="user-search"
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {isPending && <LoadingState />}
      {error && <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />}
      {data && filtered.length === 0 && (
        <EmptyState title="No users found" description="Try a different search." />
      )}
      {filtered.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Stacks</Th>
              <Th>Role</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const isSelf = user.id === session?.user.id
              const activeStack = user.stack_members.find((m) => m.status === 'active')
              return (
                <tr key={user.id}>
                  <Td>
                    <p className="font-medium">{user.full_name ?? 'Not set'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </Td>
                  <Td>
                    {user.role === 'stack_lead' &&
                      (user.stack_leads.length === 0 ? (
                        <span className="text-muted-foreground">No stack</span>
                      ) : (
                        <ul className="flex flex-wrap gap-1.5">
                          {user.stack_leads.map((l) => (
                            <li key={l.stack_id}>
                              <Badge variant="primary" className="gap-1">
                                {l.stacks?.name}
                                <button
                                  type="button"
                                  className="-mr-1 rounded-full p-0.5 hover:bg-primary-foreground/20"
                                  aria-label={`Remove ${user.email} from ${l.stacks?.name}`}
                                  onClick={() =>
                                    setPendingRemove({
                                      user,
                                      stackId: l.stack_id,
                                      stackName: l.stacks?.name ?? 'this stack',
                                    })
                                  }
                                >
                                  <X className="size-3" aria-hidden="true" />
                                </button>
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ))}
                    {user.role === 'student' &&
                      (activeStack ? (
                        <Badge variant="success">{activeStack.stacks?.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">No stack</span>
                      ))}
                    {user.role === 'admin' && (
                      <span className="text-muted-foreground">Platform</span>
                    )}
                  </Td>
                  <Td>
                    <label htmlFor={`role-${user.id}`} className="sr-only">
                      Role for {user.email}
                    </label>
                    <Select
                      id={`role-${user.id}`}
                      className="min-w-36"
                      value={user.role}
                      disabled={isSelf}
                      title={isSelf ? 'You cannot change your own role' : undefined}
                      onChange={(e) => setPendingRole({ user, role: e.target.value as Role })}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel[r]}
                        </option>
                      ))}
                    </Select>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
      <ConfirmDialog
        open={!!pendingRole}
        onOpenChange={(o) => !o && setPendingRole(null)}
        title="Change role?"
        description={
          pendingRole
            ? `${pendingRole.user.email} will become ${roleLabel[pendingRole.role].toLowerCase()}. This changes what they can see and do immediately.`
            : ''
        }
        confirmLabel="Change role"
        loading={changeRole.isPending}
        onConfirm={() => pendingRole && changeRole.mutate(pendingRole)}
      />
      <ConfirmDialog
        open={!!pendingRemove}
        onOpenChange={(o) => !o && setPendingRemove(null)}
        title="Remove lead from stack?"
        description={
          pendingRemove
            ? `${pendingRemove.user.email} will no longer lead ${pendingRemove.stackName}.`
            : ''
        }
        confirmLabel="Remove"
        loading={removeLead.isPending}
        onConfirm={() => pendingRemove && removeLead.mutate(pendingRemove)}
      />
    </>
  )
}
