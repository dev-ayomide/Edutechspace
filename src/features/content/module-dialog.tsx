import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { friendlyError } from '@/lib/errors'
import type { Module } from '@/types/domain'
import { saveModule } from './api'
import { moduleSchema, type ModuleInput } from './schemas'

export function ModuleDialog({
  open,
  onOpenChange,
  stackId,
  module,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  stackId: string
  module: Module | null
  onSaved: () => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModuleInput>({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: '', description: '' },
  })

  useEffect(() => {
    if (open) reset({ title: module?.title ?? '', description: module?.description ?? '' })
  }, [open, module, reset])

  const mutation = useMutation({
    mutationFn: (values: ModuleInput) => saveModule(stackId, values, module?.id),
    onSuccess: () => {
      toast.success(module ? 'Module updated.' : 'Module added as a draft.')
      onOpenChange(false)
      onSaved()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={module ? 'Edit module' : 'New module'}
        description="A module groups related lessons. Students complete modules in order."
      >
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <FormField id="module-title" label="Title" error={errors.title?.message}>
            <Input
              id="module-title"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'module-title-error' : undefined}
              {...register('title')}
            />
          </FormField>
          <FormField
            id="module-description"
            label="Description"
            error={errors.description?.message}
          >
            <Textarea
              id="module-description"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {module ? 'Save changes' : 'Add module'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
