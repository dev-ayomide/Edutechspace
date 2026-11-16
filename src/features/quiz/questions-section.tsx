import { Plus, Trash2 } from 'lucide-react'
import {
  useFieldArray,
  useFormContext,
  useWatch,
  type Control,
  type FieldError,
  type FieldErrorsImpl,
  type Merge,
  type UseFormRegister,
  type UseFormReturn,
} from 'react-hook-form'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { blankQuestion, type QuestionInput } from './schemas'

/** The only shape this section needs from its parent form. */
export interface QuestionsForm {
  questions: QuestionInput[]
}

type QuestionErrors = Merge<FieldError, FieldErrorsImpl<QuestionInput>> | undefined

/**
 * The "Questions" part of the quiz and exam builders. It reads the surrounding form through context
 * (wrap the form in <FormProvider>), so both builders share one editor.
 */
export function QuestionsSection({ emptyHint }: { emptyHint: string }) {
  // Parent forms have more fields than this section knows about; it only ever touches `questions`.
  const form = useFormContext() as unknown as UseFormReturn<QuestionsForm>
  const {
    control,
    register,
    formState: { errors },
  } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'questions' })

  return (
    <section aria-labelledby="questions-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 id="questions-heading" className="font-semibold">
          Questions
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={() => append(blankQuestion())}>
          <Plus className="size-4" aria-hidden="true" />
          Add question
        </Button>
      </div>
      {fields.length === 0 && <p className="text-sm text-muted-foreground">{emptyHint}</p>}
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
  )
}

function QuestionEditor({
  index,
  control,
  register,
  onRemove,
  error,
}: {
  index: number
  control: Control<QuestionsForm>
  register: UseFormRegister<QuestionsForm>
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
