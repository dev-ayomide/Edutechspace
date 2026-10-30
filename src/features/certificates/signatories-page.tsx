import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, Td, Th } from '@/components/ui/table'
import { friendlyError } from '@/lib/errors'
import {
  certKeys,
  listSignatories,
  saveSignatory,
  setSignatoryActive,
  signatureUrl,
  uploadSignature,
  type Signatory,
} from './api'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function SignatoriesPage() {
  const queryClient = useQueryClient()
  const { data, error, isPending, refetch } = useQuery({
    queryKey: certKeys.signatories,
    queryFn: listSignatories,
  })
  const [editing, setEditing] = useState<Signatory | null>(null)
  const [open, setOpen] = useState(false)

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setSignatoryActive(id, active),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: certKeys.signatories }),
    onError: (e) => toast.error(friendlyError(e)),
  })
  const activeCount = (data ?? []).filter((s) => s.is_active).length

  return (
    <>
      <PageHeader
        title="Signatories"
        description="The people whose signatures appear on every certificate, left to right."
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add signatory
          </Button>
        }
      />
      {data && activeCount === 0 && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-warning-soft p-4 text-sm text-warning-soft-foreground"
        >
          No active signatories. Certificates issued now will have no signatures. Add signatories,
          then use “Reissue” on any certificate issued without them.
        </div>
      )}
      {isPending && <LoadingState />}
      {error && <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />}
      {data && data.length === 0 && (
        <EmptyState
          title="No signatories yet"
          description="Add the President, Technical Lead, Staff Patron and, when available, the VC."
        />
      )}
      {data && data.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Signatory</Th>
              <Th>Signature</Th>
              <Th>Status</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id}>
                <Td className="tabular-nums">{s.display_order}</Td>
                <Td>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.title}</p>
                </Td>
                <Td>
                  {s.signature_path ? (
                    <img
                      src={signatureUrl(s.signature_path)}
                      alt={`Signature of ${s.name}`}
                      className="max-h-10 rounded border bg-background p-1"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </Td>
                <Td>
                  <Badge variant={s.is_active ? 'success' : 'neutral'}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Edit ${s.name}`}
                      onClick={() => {
                        setEditing(s)
                        setOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${s.is_active ? 'Deactivate' : 'Activate'} ${s.name}`}
                      loading={toggle.isPending && toggle.variables?.id === s.id}
                      onClick={() => toggle.mutate({ id: s.id, active: !s.is_active })}
                    >
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Certificates keep the signatories that were active when they were issued. Changing this list
        affects new certificates and reissued ones only.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={editing ? 'Edit signatory' : 'Add signatory'}
          description="Upload a transparent PNG of the signature for the best result."
        >
          <SignatoryForm
            signatory={editing}
            onDone={() => setOpen(false)}
            nextOrder={(data?.length ?? 0) + 1}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function SignatoryForm({
  signatory,
  onDone,
  nextOrder,
}: {
  signatory: Signatory | null
  onDone: () => void
  nextOrder: number
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(signatory?.name ?? '')
  const [title, setTitle] = useState(signatory?.title ?? '')
  const [order, setOrder] = useState(String(signatory?.display_order ?? nextOrder))
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<{
    name?: string
    title?: string
    order?: string
    file?: string
  }>({})

  const save = useMutation({
    mutationFn: async () => {
      // A replaced signature is a new file; the old one stays because issued certificates still use it.
      const path = file ? await uploadSignature(file) : (signatory?.signature_path ?? null)
      await saveSignatory(
        {
          name: name.trim(),
          title: title.trim(),
          display_order: Number(order),
          signature_path: path,
        },
        signatory?.id,
      )
    },
    onSuccess: async () => {
      toast.success('Saved.')
      await queryClient.invalidateQueries({ queryKey: certKeys.signatories })
      onDone()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const onFile = (picked: File | null) => {
    if (!picked) return setFile(null)
    if (!IMAGE_TYPES.includes(picked.type))
      return void (setFile(null),
      setErrors((x) => ({ ...x, file: 'Upload a PNG, JPG or WebP image.' })))
    if (picked.size > 1_048_576)
      return void (setFile(null),
      setErrors((x) => ({ ...x, file: 'The image is larger than 1 MB.' })))
    setErrors((x) => ({ ...x, file: undefined }))
    setFile(picked)
  }

  const submit = () => {
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Enter a name'
    if (title.trim().length < 2) next.title = 'Enter a title, e.g. President'
    if (!/^\d+$/.test(order)) next.order = 'Enter a whole number'
    setErrors(next)
    if (Object.keys(next).length === 0 && !errors.file) save.mutate()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-4"
      noValidate
    >
      <FormField id="sig-name" label="Name" error={errors.name}>
        <Input
          id="sig-name"
          value={name}
          aria-invalid={!!errors.name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>
      <FormField id="sig-title" label="Title" error={errors.title}>
        <Input
          id="sig-title"
          value={title}
          aria-invalid={!!errors.title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>
      <FormField
        id="sig-order"
        label="Position"
        hint="1 is the leftmost signature."
        error={errors.order}
      >
        <Input
          id="sig-order"
          inputMode="numeric"
          className="w-24"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />
      </FormField>
      <FormField
        id="sig-file"
        label="Signature image"
        hint="PNG, JPG or WebP, up to 1 MB."
        error={errors.file}
      >
        <Input
          id="sig-file"
          type="file"
          accept={IMAGE_TYPES.join(',')}
          className="py-2"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {signatory?.signature_path && !file && (
          <img
            src={signatureUrl(signatory.signature_path)}
            alt="Current signature"
            className="mt-2 max-h-12 rounded border bg-background p-1"
          />
        )}
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}
