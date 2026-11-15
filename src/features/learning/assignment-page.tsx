import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/form-field'
import { OptionTile } from '@/components/option-tile'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/auth-context'
import { friendlyError } from '@/lib/errors'
import type { QuizQuestion, Submission } from '@/types/domain'
import {
  fetchAssignmentDetail,
  getSubmissionFileUrl,
  learningKeys,
  submitQuiz,
  submitWork,
  type AssignmentDetail,
  type QuizResult,
} from './api'
import { useMyLearning } from './hooks'

const MAX_FILE = 25 * 1024 * 1024
const FILE_TYPES = ['application/pdf', 'application/zip', 'image/png', 'image/jpeg', 'text/plain']

const date = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const statusBadge = (s: Submission) => {
  if (s.status === 'submitted') return <Badge variant="warning">Awaiting review</Badge>
  if (s.status === 'needs_resubmission') return <Badge variant="warning">Resubmit</Badge>
  return <Badge variant="neutral">Graded</Badge>
}

export function AssignmentPage() {
  const { assignmentId = '' } = useParams()
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const learning = useMyLearning()
  const queryClient = useQueryClient()
  const detail = useQuery({
    queryKey: learningKeys.assignment(assignmentId),
    queryFn: () => fetchAssignmentDetail(assignmentId, userId),
    enabled: !!assignmentId && !!userId,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: learningKeys.all })
  }

  if (detail.isPending || learning.isPending) return <LoadingState />
  if (detail.error)
    return (
      <ErrorState message={friendlyError(detail.error)} onRetry={() => void detail.refetch()} />
    )
  if (!detail.data) {
    return (
      <EmptyState
        title="This assignment is not available"
        description="It may be locked until you finish the previous module, or it is no longer published."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard/stack">Back to my stack</Link>
          </Button>
        }
      />
    )
  }

  const { assignment: a, questions, submissions, extraAttempts } = detail.data
  const allowedAttempts = a.max_attempts === null ? null : a.max_attempts + extraAttempts
  const state = learning.states.find((s) => s.assignment_id === a.id)
  const passed = !!state?.assignment_passed
  const pending = submissions.some((s) => s.status === 'submitted')
  const attemptsLeft =
    allowedAttempts === null ? null : Math.max(0, allowedAttempts - submissions.length)
  const canAttempt =
    learning.membership?.status === 'active' && !passed && !pending && attemptsLeft !== 0
  const latestNote = submissions.find((s) => s.status === 'needs_resubmission')

  return (
    <article>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
        <Link to="/dashboard/stack">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to my stack
        </Link>
      </Button>
      <p className="text-sm font-bold tracking-[0.12em] text-link uppercase">{a.modules.title}</p>
      <h1 className="mt-2 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
        {a.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {a.type === 'quiz' ? 'Quiz' : 'Project'} · Pass mark {a.pass_mark}% ·{' '}
        {allowedAttempts === null
          ? 'Unlimited attempts'
          : `${submissions.length} of ${allowedAttempts} attempts used`}
      </p>
      {a.instructions && <p className="mt-4 max-w-prose whitespace-pre-wrap">{a.instructions}</p>}

      {passed && (
        <div
          role="status"
          className="mt-6 flex items-center gap-2 rounded-lg bg-success-soft p-4 text-success-soft-foreground"
        >
          <CheckCircle2 className="size-5" aria-hidden="true" />
          You passed this assignment
          {state?.best_score != null ? ` with ${state.best_score} / ${a.max_score}` : ''}.
        </div>
      )}
      {pending && (
        <div
          role="status"
          className="mt-6 rounded-lg bg-warning-soft p-4 text-warning-soft-foreground"
        >
          Your submission is waiting for your stack lead to review it. You will see the result here.
        </div>
      )}
      {latestNote && !pending && (
        <div
          role="status"
          className="mt-6 rounded-lg bg-warning-soft p-4 text-warning-soft-foreground"
        >
          Your stack lead asked you to resubmit
          {latestNote.feedback ? `: “${latestNote.feedback}”` : '.'}
        </div>
      )}
      {!passed && !pending && attemptsLeft === 0 && (
        <div
          role="status"
          className="mt-6 rounded-lg bg-danger-soft p-4 text-danger-soft-foreground"
        >
          You have used all your attempts. Your stack lead can give you another one.
        </div>
      )}

      {canAttempt && (
        <div className="mt-8">
          {a.type === 'quiz' ? (
            <QuizForm
              assignmentId={a.id}
              questions={questions}
              passMark={a.pass_mark}
              onDone={refresh}
            />
          ) : (
            <WorkForm
              stackId={a.modules.stack_id}
              userId={userId}
              assignmentId={a.id}
              onDone={refresh}
              isResubmission={submissions.length > 0}
            />
          )}
        </div>
      )}

      {submissions.length > 0 && <History submissions={submissions} detail={detail.data} />}
    </article>
  )
}

function QuizForm({
  assignmentId,
  questions,
  passMark,
  onDone,
}: {
  assignmentId: string
  questions: QuizQuestion[]
  passMark: number
  onDone: () => Promise<void>
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [result, setResult] = useState<QuizResult | null>(null)
  const complete = answers.every((x) => x !== null)

  const submit = useMutation({
    mutationFn: () => submitQuiz(assignmentId, answers as number[]),
    onSuccess: async (r) => {
      setResult(r)
      await onDone()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  if (result) {
    const pct = Math.round((result.score * 100) / result.max_score)
    return (
      <Card
        role="status"
        tone={result.passed ? 'gold' : 'default'}
        lift="lg"
        className="text-center"
      >
        {result.passed ? (
          <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
        ) : (
          <XCircle className="mx-auto size-10 text-danger" aria-hidden="true" />
        )}
        <h2 className="mt-3 text-xl font-bold">
          {result.passed ? 'You passed!' : 'Not quite yet'}
        </h2>
        <p className="mt-1 text-muted-foreground">
          You scored {result.score} / {result.max_score} ({pct}%). The pass mark is {passMark}%.
        </p>
      </Card>
    )
  }

  if (questions.length === 0)
    return (
      <EmptyState
        title="No questions yet"
        description="Your stack lead is still preparing this quiz."
      />
    )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (complete) submit.mutate()
      }}
      className="space-y-5"
    >
      {questions.map((q, qi) => (
        <fieldset
          key={q.id}
          className="space-y-3 rounded-2xl border-2 border-outline bg-card p-5 sm:p-6"
        >
          <legend className="sr-only">
            Question {qi + 1}: {q.prompt}
          </legend>
          <p
            aria-hidden="true"
            className="flex items-start gap-3 font-display text-xl leading-snug font-extrabold tracking-tight"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border-2 border-outline bg-accent text-base">
              {qi + 1}
            </span>
            {q.prompt}
          </p>
          <div className="grid gap-2.5">
            {q.options.map((option, oi) => (
              <OptionTile
                key={oi}
                name={`q-${q.id}`}
                checked={answers[qi] === oi}
                onChange={() => setAnswers((prev) => prev.map((v, i) => (i === qi ? oi : v)))}
              >
                {option}
              </OptionTile>
            ))}
          </div>
        </fieldset>
      ))}
      <Button type="submit" size="lg" disabled={!complete} loading={submit.isPending}>
        Submit answers
      </Button>
      {!complete && (
        <p className="text-sm text-muted-foreground">Answer every question to submit.</p>
      )}
    </form>
  )
}

const workSchema = z.object({
  text: z.string().max(20000, 'Keep it under 20,000 characters'),
  url: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || /^https?:\/\/\S+$/i.test(v),
      'Enter a link starting with http:// or https://',
    ),
})
type WorkValues = z.infer<typeof workSchema>

function WorkForm({
  stackId,
  userId,
  assignmentId,
  onDone,
  isResubmission,
}: {
  stackId: string
  userId: string
  assignmentId: string
  onDone: () => Promise<void>
  isResubmission: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<WorkValues>({
    resolver: zodResolver(workSchema),
    defaultValues: { text: '', url: '' },
  })

  const submit = useMutation({
    mutationFn: (v: WorkValues) =>
      submitWork(stackId, userId, assignmentId, { text: v.text.trim(), url: v.url, file }),
    onSuccess: async () => {
      toast.success('Submitted. Your stack lead will review it.')
      await onDone()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const onFile = (picked: File | null) => {
    if (!picked) return setFile(null)
    if (!FILE_TYPES.includes(picked.type))
      return void (setFile(null), setFileError('Upload a PDF, ZIP, PNG, JPG or text file.'))
    if (picked.size > MAX_FILE)
      return void (setFile(null), setFileError('The file is larger than 25 MB.'))
    setFileError(null)
    setFile(picked)
  }

  return (
    <form
      onSubmit={handleSubmit((v) => {
        if (!v.text.trim() && !v.url && !file) {
          setError('root', { message: 'Add your answer, a link or a file.' })
          return
        }
        submit.mutate(v)
      })}
      className="space-y-4"
      noValidate
    >
      <h2 className="text-lg font-semibold">
        {isResubmission ? 'Submit again' : 'Your submission'}
      </h2>
      <FormField id="work-text" label="Your answer" error={errors.text?.message}>
        <Textarea id="work-text" className="min-h-32" {...register('text')} />
      </FormField>
      <FormField
        id="work-url"
        label="Link (optional)"
        hint="For example your repository or a live demo."
        error={errors.url?.message}
      >
        <Input
          id="work-url"
          type="url"
          inputMode="url"
          placeholder="https://"
          {...register('url')}
        />
      </FormField>
      <FormField
        id="work-file"
        label="File (optional)"
        hint="PDF, ZIP, PNG, JPG or text, up to 25 MB."
        error={fileError ?? undefined}
      >
        <Input
          id="work-file"
          type="file"
          className="py-2"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </FormField>
      {errors.root && (
        <p role="alert" className="text-sm text-danger">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" size="lg" loading={submit.isPending}>
        Submit
      </Button>
    </form>
  )
}

function History({ submissions, detail }: { submissions: Submission[]; detail: AssignmentDetail }) {
  const max = detail.assignment.max_score
  const open = async (path: string) => {
    try {
      window.open(await getSubmissionFileUrl(path), '_blank', 'noopener,noreferrer')
    } catch (e) {
      toast.error(friendlyError(e, 'Could not open the file.'))
    }
  }
  return (
    <section className="mt-10" aria-labelledby="history-heading">
      <h2 id="history-heading" className="mb-3 text-lg font-semibold">
        Your attempts
      </h2>
      <ol className="space-y-3">
        {submissions.map((s) => (
          <li key={s.id}>
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">Attempt {s.attempt}</p>
                {statusBadge(s)}
                {s.score !== null && (
                  <span className="text-sm font-semibold">
                    {s.score} / {max}
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {date(s.submitted_at)}
                </span>
              </div>
              {s.content_text && (
                <p className="mt-2 line-clamp-3 text-sm whitespace-pre-wrap text-muted-foreground">
                  {s.content_text}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {s.content_url && (
                  <Button asChild variant="ghost" size="sm">
                    <a href={s.content_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" aria-hidden="true" />
                      Link
                    </a>
                  </Button>
                )}
                {s.file_path && (
                  <Button variant="ghost" size="sm" onClick={() => void open(s.file_path!)}>
                    <ExternalLink className="size-4" aria-hidden="true" />
                    File
                  </Button>
                )}
              </div>
              {s.feedback && (
                <p className="mt-3 rounded-md bg-muted p-3 text-sm">
                  <span className="font-semibold">Feedback: </span>
                  {s.feedback}
                </p>
              )}
            </Card>
          </li>
        ))}
      </ol>
    </section>
  )
}
