import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { friendlyError } from '@/lib/errors'
import type { Assignment } from '@/types/domain'
import { QuestionsSection } from '@/features/quiz/questions-section'
import { toFormQuestions } from '@/features/quiz/schemas'
import { fetchQuizForEditing, saveAssignment } from './api'
import { assignmentSchema, type AssignmentInput } from './schemas'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string
  moduleTitle: string
  assignment: Assignment | null
  onSaved: () => void
}

/** Radix unmounts the content when closed, so the form starts fresh every time. */
export function AssignmentDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        title={props.assignment ? 'Edit assignment' : 'New assignment'}
        description={`The assignment for ${props.moduleTitle}. Students must pass it to complete the module.`}
        className="max-w-2xl"
      >
        <Loader {...props} />
      </DialogContent>
    </Dialog>
  )
}

function Loader(props: Props) {
  const quiz = useQuery({
    queryKey: ['assignment-edit', props.assignment?.id],
    queryFn: () => fetchQuizForEditing(props.assignment!.id),
    enabled: props.assignment?.type === 'quiz',
  })
  if (props.assignment?.type === 'quiz' && quiz.isPending) return <LoadingState rows={2} />
  return <AssignmentForm {...props} existingQuestions={quiz.data} />
}

function AssignmentForm({
  onOpenChange,
  moduleId,
  assignment,
  onSaved,
  existingQuestions,
}: Props & { existingQuestions: Awaited<ReturnType<typeof fetchQuizForEditing>> | undefined }) {
  const form = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: assignment?.title ?? '',
      type: assignment?.type ?? 'quiz',
      instructions: assignment?.instructions ?? '',
      max_score: String(assignment?.max_score ?? 100),
      pass_mark: String(assignment?.pass_mark ?? 60),
      max_attempts: assignment?.max_attempts ? String(assignment.max_attempts) : '',
      is_published: assignment?.is_published ?? false,
      questions: toFormQuestions(existingQuestions),
    },
  })
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form
  const type = useWatch({ control, name: 'type' })

  const mutation = useMutation({
    mutationFn: (v: AssignmentInput) => saveAssignment(moduleId, v, assignment),
    onSuccess: () => {
      toast.success(assignment ? 'Assignment updated.' : 'Assignment added.')
      onOpenChange(false)
      onSaved()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
        <FormField id="as-title" label="Title" error={errors.title?.message}>
          <Input
            id="as-title"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'as-title-error' : undefined}
            {...register('title')}
          />
        </FormField>
        <FormField
          id="as-type"
          label="Type"
          hint={
            assignment
              ? 'The type cannot be changed after creating the assignment.'
              : 'Quizzes are graded automatically. Projects are graded by you.'
          }
        >
          <Select id="as-type" disabled={!!assignment} {...register('type')}>
            <option value="quiz">Quiz (graded automatically)</option>
            <option value="submission">Project (you grade it)</option>
          </Select>
        </FormField>
        <FormField
          id="as-instructions"
          label={type === 'quiz' ? 'Instructions (optional)' : 'Instructions'}
          error={errors.instructions?.message}
        >
          <Textarea
            id="as-instructions"
            className="min-h-24"
            aria-invalid={!!errors.instructions}
            {...register('instructions')}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField id="as-max" label="Maximum score" error={errors.max_score?.message}>
            <Input id="as-max" inputMode="numeric" {...register('max_score')} />
          </FormField>
          <FormField id="as-pass" label="Pass mark (%)" error={errors.pass_mark?.message}>
            <Input id="as-pass" inputMode="numeric" {...register('pass_mark')} />
          </FormField>
          <FormField
            id="as-attempts"
            label="Attempts"
            hint="Empty means unlimited."
            error={errors.max_attempts?.message}
          >
            <Input id="as-attempts" inputMode="numeric" {...register('max_attempts')} />
          </FormField>
        </div>

        {type === 'quiz' && (
          <QuestionsSection emptyHint="No questions yet. Add at least one to publish." />
        )}

        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" {...register('is_published')} />
          Published (visible to students)
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {assignment ? 'Save changes' : 'Add assignment'}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  )
}
