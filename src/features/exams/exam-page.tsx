import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Award, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { OptionTile } from '@/components/option-tile'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { sendCertificateEmail } from '@/features/certificates/api'
import { learningKeys } from '@/features/learning/api'
import { friendlyError } from '@/lib/errors'
import type { MyExam } from '@/types/domain'
import {
  examKeys,
  fetchExamQuestions,
  fetchMyExam,
  startExam,
  submitExam,
  type ExamResult,
} from './api'
import { formatClock, useCountdown } from './use-countdown'
import { attemptsLeft } from './utils'

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function ExamPage() {
  const queryClient = useQueryClient()
  const exam = useQuery({ queryKey: examKeys.mine, queryFn: fetchMyExam })
  const [result, setResult] = useState<ExamResult | null>(null)

  const start = useMutation({
    mutationFn: (examId: string) => startExam(examId),
    onSuccess: async () => {
      setResult(null)
      await queryClient.invalidateQueries({ queryKey: examKeys.all })
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const finished = async (r: ExamResult) => {
    setResult(r)
    // Best effort: the certificate page also offers "Email me a link" if this does not arrive.
    if (r.certificate_id) void sendCertificateEmail(r.certificate_id).catch(() => undefined)
    await queryClient.invalidateQueries({ queryKey: examKeys.all })
    await queryClient.invalidateQueries({ queryKey: learningKeys.all })
    await queryClient.invalidateQueries({ queryKey: ['certificate'] })
  }

  if (exam.isPending) {
    return (
      <>
        <PageHeader title="Final exam" />
        <LoadingState rows={2} />
      </>
    )
  }
  if (exam.error)
    return <ErrorState message={friendlyError(exam.error)} onRetry={() => void exam.refetch()} />
  const e = exam.data
  if (!e) {
    return (
      <>
        <PageHeader title="Final exam" />
        <EmptyState
          title="No final exam yet"
          description="Your stack lead has not published the final exam. It appears here once it is ready."
        />
      </>
    )
  }

  if (e.state === 'in_progress') return <ExamTaker exam={e} onFinished={finished} />

  return (
    <>
      <PageHeader title={e.title} description="Pass the final exam to earn your certificate." />
      {result && <ResultCard result={result} passMark={e.pass_mark} />}
      <Details exam={e} />
      {e.state === 'ready' && (
        <Button
          size="lg"
          className="mt-6"
          loading={start.isPending}
          onClick={() => start.mutate(e.exam_id)}
        >
          Start exam
        </Button>
      )}
      {e.state === 'locked' && (
        <Card className="mt-6">
          <CardTitle>Not unlocked yet</CardTitle>
          <CardDescription className="mt-1">
            Complete every module (all required lessons and passing each assignment) to unlock the
            exam.
          </CardDescription>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/dashboard/progress">See what is left</Link>
          </Button>
        </Card>
      )}
      {e.state === 'cooldown' && e.next_available_at && (
        <Card className="mt-6">
          <Clock className="size-5 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="mt-2">Take a breath</CardTitle>
          <CardDescription className="mt-1">
            You can try again after {when(e.next_available_at)}. Use the time to revise.
          </CardDescription>
        </Card>
      )}
      {e.state === 'exhausted' && (
        <Card className="mt-6">
          <CardTitle>No attempts left</CardTitle>
          <CardDescription className="mt-1">
            You have used every attempt. Your stack lead can give you another one if you ask.
          </CardDescription>
        </Card>
      )}
      {e.state === 'passed' && (
        <Card className="mt-6 text-center">
          <Award className="mx-auto size-10 text-success" aria-hidden="true" />
          <CardTitle className="mt-3 text-xl">You passed the final exam</CardTitle>
          <CardDescription className="mt-1">
            Congratulations! Your certificate is ready.
          </CardDescription>
          <Button asChild className="mt-4">
            <Link to="/dashboard/certificate">View my certificate</Link>
          </Button>
        </Card>
      )}
    </>
  )
}

function Details({ exam }: { exam: MyExam }) {
  const left = attemptsLeft(exam)
  return (
    <Card>
      {exam.instructions && (
        <p className="mb-4 max-w-prose whitespace-pre-wrap">{exam.instructions}</p>
      )}
      <dl className="grid gap-4 sm:grid-cols-4">
        {[
          ['Questions', String(exam.question_count)],
          ['Time limit', exam.time_limit_minutes ? `${exam.time_limit_minutes} minutes` : 'None'],
          ['Pass mark', `${exam.pass_mark}%`],
          ['Attempts left', left === null ? 'Unlimited' : String(left)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-display text-2xl font-extrabold tracking-tight">{value}</dd>
          </div>
        ))}
      </dl>
      {exam.best_score !== null && (
        <p className="mt-4 text-sm text-muted-foreground">
          Your best score so far: {exam.best_score}%
        </p>
      )}
    </Card>
  )
}

function ResultCard({ result, passMark }: { result: ExamResult; passMark: number }) {
  const ok = result.passed
  return (
    <Card role="status" tone={ok ? 'gold' : 'default'} lift="lg" className="mb-6 text-center">
      {ok ? (
        <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
      ) : (
        <XCircle className="mx-auto size-10 text-danger" aria-hidden="true" />
      )}
      <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight">
        {result.expired ? 'Time ran out' : ok ? 'You passed!' : 'Not this time'}
      </h2>
      <p className="mt-1 text-muted-foreground">
        {result.expired
          ? 'Your answers arrived after the time limit, so this attempt did not count.'
          : `You scored ${result.percent}% (${result.score} / ${result.max_score}). The pass mark is ${passMark}%.`}
      </p>
    </Card>
  )
}

function ExamTaker({
  exam,
  onFinished,
}: {
  exam: MyExam
  onFinished: (r: ExamResult) => Promise<void>
}) {
  const questions = useQuery({
    queryKey: examKeys.questions(exam.exam_id),
    queryFn: () => fetchExamQuestions(exam.exam_id),
  })
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [confirm, setConfirm] = useState(false)
  const answersRef = useRef(answers)
  useEffect(() => {
    answersRef.current = answers
  })

  const submit = useMutation({
    mutationFn: () => {
      // Unanswered questions are sent as -1 (always wrong); the server only needs one entry per question.
      const list = (questions.data ?? []).map((q) => answersRef.current[q.id] ?? -1)
      return submitExam(exam.attempt_id!, list)
    },
    onSuccess: onFinished,
    onError: (e) => toast.error(friendlyError(e)),
  })

  // Leaving mid-exam is almost always an accident.
  useEffect(() => {
    const warn = (ev: BeforeUnloadEvent) => ev.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const remaining = useCountdown(exam.deadline, () => {
    if (questions.data && !submit.isPending) submit.mutate()
  })
  const minutes = remaining === null ? null : Math.ceil(remaining / 60_000)
  const announcement =
    remaining === null
      ? ''
      : remaining <= 60_000
        ? 'One minute left'
        : remaining <= 300_000
          ? 'Five minutes left'
          : ''

  if (questions.isPending) return <LoadingState />
  if (questions.error)
    return (
      <ErrorState
        message={friendlyError(questions.error)}
        onRetry={() => void questions.refetch()}
      />
    )
  const list = questions.data
  const complete = list.every((q) => answers[q.id] !== undefined)

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-6 flex items-center justify-between gap-4 border-b bg-background px-4 py-3 md:-mx-8 md:-mt-8 md:px-8">
        <h1 className="text-lg font-bold">{exam.title}</h1>
        {remaining !== null && (
          <p
            role="timer"
            aria-live="off"
            className={`flex items-center gap-1.5 text-lg font-semibold tabular-nums ${minutes !== null && minutes <= 5 ? 'text-danger' : ''}`}
          >
            <Clock className="size-5" aria-hidden="true" />
            {formatClock(remaining)}
          </p>
        )}
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <form
        onSubmit={(ev) => {
          ev.preventDefault()
          if (complete) setConfirm(true)
        }}
        className="space-y-5"
      >
        {list.map((q, qi) => (
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
                  checked={answers[q.id] === oi}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                >
                  {option}
                </OptionTile>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={!complete} loading={submit.isPending}>
            Submit exam
          </Button>
          <p className="text-sm text-muted-foreground">
            {Object.keys(answers).length} of {list.length} answered
          </p>
        </div>
      </form>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Submit your exam?"
        description="You cannot change your answers after submitting."
        confirmLabel="Submit"
        tone="primary"
        loading={submit.isPending}
        onConfirm={() => {
          setConfirm(false)
          submit.mutate()
        }}
      />
    </>
  )
}
