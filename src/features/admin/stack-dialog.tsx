import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { friendlyError } from '@/lib/errors'
import { saveStack, stackKeys } from '@/features/stacks/api'
import { slugify, stackSchema, type StackInput } from '@/features/stacks/schemas'
import type { Stack } from '@/types/domain'

export function StackDialog({
  open,
  onOpenChange,
  stack,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  stack: Stack | null
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getFieldState,
    formState: { errors },
  } = useForm<StackInput>({
    resolver: zodResolver(stackSchema),
    defaultValues: { name: '', slug: '', description: '' },
  })

  useEffect(() => {
    if (open) {
      reset(
        stack
          ? { name: stack.name, slug: stack.slug, description: stack.description ?? '' }
          : { name: '', slug: '', description: '' },
      )
    }
  }, [open, stack, reset])

  const mutation = useMutation({
    mutationFn: (values: StackInput) => saveStack(values, stack?.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stackKeys.all })
      toast.success(stack ? 'Stack updated.' : 'Stack created.')
      onOpenChange(false)
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const nameField = register('name')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={stack ? 'Edit stack' : 'New stack'}
        description="A stack is a learning track with its own modules, lessons and leads."
      >
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <FormField id="stack-name" label="Name" error={errors.name?.message}>
            <Input
              id="stack-name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'stack-name-error' : undefined}
              {...nameField}
              onChange={(e) => {
                void nameField.onChange(e)
                // Suggest a slug from the name until the admin edits the slug themselves.
                if (!stack && !getFieldState('slug').isDirty)
                  setValue('slug', slugify(e.target.value))
              }}
            />
          </FormField>
          <FormField
            id="stack-slug"
            label="URL name"
            hint="Used in links, e.g. frontend. Lowercase letters, numbers and hyphens."
            error={errors.slug?.message}
          >
            <Input
              id="stack-slug"
              aria-invalid={!!errors.slug}
              aria-describedby={errors.slug ? 'stack-slug-error' : undefined}
              {...register('slug')}
            />
          </FormField>
          <FormField id="stack-description" label="Description" error={errors.description?.message}>
            <Textarea
              id="stack-description"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {stack ? 'Save changes' : 'Create stack'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
