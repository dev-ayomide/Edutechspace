import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useMyStacks } from '@/features/lead/use-my-stacks'
import { QuestionsSection } from '@/features/quiz/questions-section'
import { toFormQuestions } from '@/features/quiz/schemas'
import { friendlyError } from '@/lib/errors'
import { createExam, examKeys, fetchExamForEditing, saveExam, type ExamForEditing } from './api'
import { examSchema, type ExamInput } from './schemas'

export function ExamBuilderPage() {
  const queryClient = useQueryClient()
  const { stacks, selected, select, isPending: stacksPending, error: stacksError } = useMyStacks()
  const stackId = selected?.id ?? ''
  const exam = useQuery({
    queryKey: examKeys.forStack(stackId),
    queryFn: () => fetchExamForEditing(stackId),
    enabled: !!stackId,
  })

  const create = useMutation({
    mutationFn: () => createExam(stackId),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: examKeys.forStack(stackId) }),
    onError: (e) => toast.error(friendlyError(e)),
  })

  if (stacksPending) return <LoadingState />
  if (stacksError) return <ErrorState message={friendlyError(stacksError)} />
  if (!selected) {
    return (
      <>
        <PageHeader title="Final exam" />
        <EmptyState
          title="No stack assigned yet"
          description="An admin assigns you to a stack before you can build its exam."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Final exam"
        description={`The exam students take to earn the ${selected.name} certificate.`}
      />
      {stacks.length > 1 && (
        <div className="mb-6 max-w-xs">
          <label htmlFor="exam-stack" className="mb-1.5 block text-sm font-medium">
            Stack
          </label>
          <Select id="exam-stack" value={selected.id} onChange={(e) => select(e.target.value)}>
            {stacks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      {exam.isPending && <LoadingState />}
      {exam.error && (
        <ErrorState message={friendlyError(exam.error)} onRetry={() => void exam.refetch()} />
      )}
      {exam.data === null && (
        <EmptyState
          title="No exam yet"
          description="Create the exam, add its questions, then publish it. Students can take it once they finish every module."
          action={
            <Button loading={create.isPending} onClick={() => create.mutate()}>
              Create the exam
            </Button>
          }
        />
      )}
      {exam.data && (
        <ExamForm key={exam.data.exam.id + exam.dataUpdatedAt} data={exam.data} stackId={stackId} />
      )}
    </>
  )
}

function ExamForm({ data, stackId }: { data: ExamForEditing; stackId: string }) {
  const queryClient = useQueryClient()
  const { exam } = data
  const form = useForm<ExamInput>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: exam.title,
      instructions: exam.instructions ?? '',
      time_limit_minutes: exam.time_limit_minutes ? String(exam.time_limit_minutes) : '',
      pass_mark: String(exam.pass_mark),
      max_attempts: exam.max_attempts ? String(exam.max_attempts) : '',
      cooldown_hours: String(exam.cooldown_hours),
      is_published: exam.is_published,
      questions: toFormQuestions(data.questions),
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  const save = useMutation({
    mutationFn: (v: ExamInput) => saveExam(exam.id, v),
    onSuccess: async () => {
      toast.success('Exam saved.')
      await queryClient.invalidateQueries({ queryKey: examKeys.forStack(stackId) })
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-6" noValidate>
        <Card className="space-y-4">
          <FormField id="ex-title" label="Title" error={errors.title?.message}>
            <Input
              id="ex-title"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'ex-title-error' : undefined}
              {...register('title')}
            />
          </FormField>
          <FormField
            id="ex-instructions"
            label="Instructions (optional)"
            error={errors.instructions?.message}
          >
            <Textarea id="ex-instructions" {...register('instructions')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-4">
            <FormField
              id="ex-time"
              label="Time limit (minutes)"
              hint="Empty means no limit."
              error={errors.time_limit_minutes?.message}
            >
              <Input id="ex-time" inputMode="numeric" {...register('time_limit_minutes')} />
            </FormField>
            <FormField id="ex-pass" label="Pass mark (%)" error={errors.pass_mark?.message}>
              <Input id="ex-pass" inputMode="numeric" {...register('pass_mark')} />
            </FormField>
            <FormField
              id="ex-attempts"
              label="Attempts"
              hint="Empty means unlimited."
              error={errors.max_attempts?.message}
            >
              <Input id="ex-attempts" inputMode="numeric" {...register('max_attempts')} />
            </FormField>
            <FormField
              id="ex-cooldown"
              label="Wait between attempts (hours)"
              error={errors.cooldown_hours?.message}
            >
              <Input id="ex-cooldown" inputMode="numeric" {...register('cooldown_hours')} />
            </FormField>
          </div>
        </Card>
        <QuestionsSection emptyHint="No questions yet. Add at least one to publish." />
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" {...register('is_published')} />
          Published (students who finish every module can take it)
        </label>
        <Button type="submit" size="lg" loading={save.isPending}>
          Save exam
        </Button>
      </form>
    </FormProvider>
  )
}
