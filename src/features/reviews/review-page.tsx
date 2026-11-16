import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getSubmissionFileUrl } from '@/features/learning/api'
import { friendlyError } from '@/lib/errors'
import { gradeSubmission, listProjectSubmissions, reviewKeys, type ReviewItem } from './api'

const date = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

type Filter = 'pending' | 'all'

export function ReviewPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Filter>('pending')
  const [target, setTarget] = useState<ReviewItem | null>(null)
  const { data, error, isPending, refetch } = useQuery({
    queryKey: reviewKeys.all,
    queryFn: listProjectSubmissions,
  })

  const items = (data ?? []).filter((s) => filter === 'all' || s.status === 'submitted')
  const pendingCount = (data ?? []).filter((s) => s.status === 'submitted').length

  return (
    <>
      <PageHeader title="Review queue" description="Project submissions from your students." />
      <div className="mb-4 flex gap-2" role="group" aria-label="Filter submissions">
        <Button
          variant={filter === 'pending' ? 'primary' : 'outline'}
          size="sm"
          aria-pressed={filter === 'pending'}
          onClick={() => setFilter('pending')}
        >
          To review{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </Button>
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
      </div>
      {isPending && <LoadingState />}
      {error && <ErrorState message={friendlyError(error)} onRetry={() => void refetch()} />}
      {data && items.length === 0 && (
        <EmptyState
          title={filter === 'pending' ? 'Nothing to review' : 'No submissions yet'}
          description="Student submissions appear here as soon as they are sent in."
        />
      )}
      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.id}>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">
                      {s.profiles?.full_name ?? s.profiles?.email ?? 'Student'}
                    </h2>
                    {s.status === 'submitted' && <Badge variant="warning">To review</Badge>}
                    {s.status === 'graded' && (
                      <Badge variant="success">
                        Graded · {s.score} / {s.assignments.max_score}
                      </Badge>
                    )}
                    {s.status === 'needs_resubmission' && <Badge>Resubmission requested</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {s.assignments.title} · {s.assignments.modules?.title} · attempt {s.attempt} ·{' '}
                    {date(s.submitted_at)}
                  </p>
                </div>
                {s.status === 'submitted' && (
                  <Button
                    size="sm"
                    aria-label={`Review ${s.profiles?.full_name ?? s.profiles?.email}'s submission`}
                    onClick={() => setTarget(s)}
                  >
                    Review
                  </Button>
                )}
              </div>
              {s.status !== 'submitted' && s.feedback && (
                <p className="mt-3 rounded-md bg-muted p-3 text-sm">{s.feedback}</p>
              )}
            </Card>
          </li>
        ))}
      </ul>
      <GradeDialog
        item={target}
        onClose={() => setTarget(null)}
        onDone={async () => {
          setTarget(null)
          await queryClient.invalidateQueries({ queryKey: reviewKeys.all })
        }}
      />
    </>
  )
}

function GradeDialog({
  item,
  onClose,
  onDone,
}: {
  item: ReviewItem | null
  onClose: () => void
  onDone: () => Promise<void>
}) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      {item && (
        <DialogContent
          title={`Review: ${item.assignments.title}`}
          description={`Submitted by ${item.profiles?.full_name ?? item.profiles?.email} (attempt ${item.attempt}). Pass mark ${item.assignments.pass_mark}%.`}
          className="max-w-2xl"
        >
          <GradeForm item={item} onClose={onClose} onDone={onDone} />
        </DialogContent>
      )}
    </Dialog>
  )
}

function GradeForm({
  item,
  onClose,
  onDone,
}: {
  item: ReviewItem
  onClose: () => void
  onDone: () => Promise<void>
}) {
  const max = item.assignments.max_score
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [scoreError, setScoreError] = useState<string | null>(null)

  const grade = useMutation({
    mutationFn: (resubmit: boolean) =>
      gradeSubmission(item.id, resubmit ? null : Number(score), feedback.trim(), resubmit),
    onSuccess: async (_d, resubmit) => {
      toast.success(resubmit ? 'Resubmission requested.' : 'Grade saved.')
      await onDone()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const openFile = async () => {
    try {
      window.open(await getSubmissionFileUrl(item.file_path!), '_blank', 'noopener,noreferrer')
    } catch (e) {
      toast.error(friendlyError(e, 'Could not open the file.'))
    }
  }

  const submitGrade = () => {
    const n = Number(score)
    if (score.trim() === '' || !Number.isInteger(n) || n < 0 || n > max) {
      setScoreError(`Enter a whole number from 0 to ${max}.`)
      return
    }
    setScoreError(null)
    grade.mutate(false)
  }

  return (
    <div className="space-y-4">
      {item.assignments.instructions && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">Assignment instructions</summary>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
            {item.assignments.instructions}
          </p>
        </details>
      )}
      <div className="space-y-3 rounded-lg bg-muted p-4">
        {item.content_text && <p className="text-sm whitespace-pre-wrap">{item.content_text}</p>}
        <div className="flex flex-wrap gap-2">
          {item.content_url && (
            <Button asChild variant="outline" size="sm">
              <a href={item.content_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden="true" />
                Open link
              </a>
            </Button>
          )}
          {item.file_path && (
            <Button variant="outline" size="sm" onClick={() => void openFile()}>
              <ExternalLink className="size-4" aria-hidden="true" />
              Open file
            </Button>
          )}
        </div>
        {!item.content_text && !item.content_url && !item.file_path && (
          <p className="text-sm text-muted-foreground">No content.</p>
        )}
      </div>
      <FormField id="grade-score" label={`Score (out of ${max})`} error={scoreError ?? undefined}>
        <Input
          id="grade-score"
          inputMode="numeric"
          className="w-32"
          value={score}
          aria-invalid={!!scoreError}
          aria-describedby={scoreError ? 'grade-score-error' : undefined}
          onChange={(e) => setScore(e.target.value)}
        />
      </FormField>
      <FormField
        id="grade-feedback"
        label="Feedback for the student"
        hint="They see this on their assignment page."
      >
        <Textarea
          id="grade-feedback"
          value={feedback}
          maxLength={5000}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </FormField>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="outline"
          loading={grade.isPending && grade.variables === true}
          onClick={() => grade.mutate(true)}
        >
          Request resubmission
        </Button>
        <Button loading={grade.isPending && grade.variables === false} onClick={submitGrade}>
          Save grade
        </Button>
      </DialogFooter>
    </div>
  )
}
