import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldError,
  type FieldErrorsImpl,
  type Merge,
  type UseFormRegister,
} from 'react-hook-form'
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
import { fetchQuizForEditing, saveAssignment } from './api'
import {
  assignmentSchema,
  blankQuestion,
  type AssignmentInput,
  type QuestionInput,
} from './schemas'

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
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: assignment?.title ?? '',
      type: assignment?.type ?? 'quiz',
      instructions: assignment?.instructions ?? '',
      max_score: String(assignment?.max_score ?? 100),
      pass_mark: String(assignment?.pass_mark ?? 60),
      max_attempts: assignment?.max_attempts ? String(assignment.max_attempts) : '',
      is_published: assignment?.is_published ?? false,
      questions: (existingQuestions ?? []).map((q) => ({
        prompt: q.prompt,
        options: q.options.map((text) => ({ text })),
        correct_index: q.correct_index,
        points: String(q.points),
      })),
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'questions' })
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
        <section aria-labelledby="questions-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 id="questions-heading" className="font-semibold">
              Questions
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(blankQuestion())}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add question
            </Button>
          </div>
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No questions yet. Add at least one to publish.
            </p>
          )}
          {errors.questions?.message && (
            <p role="alert" className="text-sm text-danger">
              {errors.questions.message}
            </p>
          )}
          {fields.map((field, qi) => (
            <QuestionEditor
              key={field.id}
              index={qi}
              control={control}
              register={register}
              onRemove={() => remove(qi)}
              error={errors.questions?.[qi]}
            />
          ))}
        </section>
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
  )
}

type QuestionErrors = Merge<FieldError, FieldErrorsImpl<QuestionInput>> | undefined

function QuestionEditor({
  index,
  control,
  register,
  onRemove,
  error,
}: {
  index: number
  control: Control<AssignmentInput>
  register: UseFormRegister<AssignmentInput>
  onRemove: () => void
  error: QuestionErrors
}) {
  const { fields, append, remove } = useFieldArray({ control, name: `questions.${index}.options` })
  const correct = useWatch({ control, name: `questions.${index}.correct_index` })
  const { onChange: onCorrectChange, ...correctProps } = register(
    `questions.${index}.correct_index`,
    { valueAsNumber: true },
  )

  return (
    <fieldset className="space-y-3 rounded-lg border bg-muted/40 p-4">
      <legend className="px-1 text-sm font-semibold">Question {index + 1}</legend>
      <FormField id={`q-${index}-prompt`} label="Question" error={error?.prompt?.message}>
        <Textarea
          id={`q-${index}-prompt`}
          className="min-h-16"
          aria-invalid={!!error?.prompt}
          {...register(`questions.${index}.prompt`)}
        />
      </FormField>
      <div className="space-y-2">
        <p className="text-sm font-medium">Options (select the correct one)</p>
        {fields.map((opt, oi) => (
          <div key={opt.id}>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                className="size-4 shrink-0"
                aria-label={`Option ${oi + 1} is correct`}
                value={oi}
                checked={correct === oi}
                onChange={(e) =>
                  void onCorrectChange({
                    target: { name: correctProps.name, value: oi },
                    type: e.type,
                  })
                }
              />
              <Input
                aria-label={`Option ${oi + 1}`}
                aria-invalid={!!error?.options?.[oi]?.text}
                aria-describedby={
                  error?.options?.[oi]?.text ? `q-${index}-opt-${oi}-error` : undefined
                }
                {...register(`questions.${index}.options.${oi}.text`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={fields.length <= 2}
                aria-label={`Remove option ${oi + 1}`}
                onClick={() => remove(oi)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
            {error?.options?.[oi]?.text?.message && (
              <p
                id={`q-${index}-opt-${oi}-error`}
                role="alert"
                className="mt-1 ml-6 text-sm text-danger"
              >
                {error.options[oi]?.text?.message}
              </p>
            )}
          </div>
        ))}
        {(error?.options?.message || error?.options?.root?.message) && (
          <p role="alert" className="text-sm text-danger">
            {error.options.message ?? error.options.root?.message}
          </p>
        )}
        {error?.correct_index?.message && (
          <p role="alert" className="text-sm text-danger">
            {error.correct_index.message}
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={fields.length >= 6}
          onClick={() => append({ text: '' })}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add option
        </Button>
      </div>
      <div className="flex items-end justify-between gap-3">
        <FormField id={`q-${index}-points`} label="Points" error={error?.points?.message}>
          <Input
            id={`q-${index}-points`}
            inputMode="numeric"
            className="w-24"
            {...register(`questions.${index}.points`)}
          />
        </FormField>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="size-4 text-danger" aria-hidden="true" />
          Remove question
        </Button>
      </div>
    </fieldset>
  )
}
