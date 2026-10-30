import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { friendlyError } from '@/lib/errors'
import type { Lesson } from '@/types/domain'
import { completeLesson, fetchLesson, getLessonFileUrl, learningKeys } from './api'
import { useMyLearning } from './hooks'
import { lessonOrder, toEmbedUrl } from './utils'

const isVideoFile = (url: string) => /\.(mp4|webm)(\?.*)?$/i.test(url)

function VideoOrDocument({ lesson }: { lesson: Lesson }) {
  const path = lesson.content_path
  const signed = useQuery({
    queryKey: ['learning', 'file', path],
    queryFn: () => getLessonFileUrl(path!),
    enabled: !!path,
    staleTime: 20 * 60_000,
  })

  if (path) {
    if (signed.isPending) return <LoadingState rows={1} />
    if (signed.error)
      return (
        <ErrorState
          message="This file could not be loaded."
          onRetry={() => void signed.refetch()}
        />
      )
    const url = signed.data
    return lesson.lesson_type === 'video' ? (
      // eslint-disable-next-line jsx-a11y/media-has-caption -- lessons cannot carry caption tracks yet (accessibility follow-up)
      <video
        controls
        className="aspect-video w-full rounded-lg bg-black"
        src={url}
        aria-label={lesson.title}
      />
    ) : (
      <div className="space-y-3">
        <iframe title={lesson.title} src={url} className="h-[70vh] w-full rounded-lg border" />
        <Button asChild variant="outline" size="sm">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" aria-hidden="true" />
            Open in a new tab
          </a>
        </Button>
      </div>
    )
  }

  const url = lesson.content_url
  if (!url) return <EmptyState title="No content yet" description="This lesson has no content." />
  const embed = lesson.lesson_type === 'video' ? toEmbedUrl(url) : null
  if (embed) {
    return (
      <iframe
        title={lesson.title}
        src={embed}
        className="aspect-video w-full rounded-lg border"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    )
  }
  if (lesson.lesson_type === 'video' && isVideoFile(url)) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption -- lessons cannot carry caption tracks yet (accessibility follow-up)
      <video
        controls
        className="aspect-video w-full rounded-lg bg-black"
        src={url}
        aria-label={lesson.title}
      />
    )
  }
  return (
    <Button asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="size-4" aria-hidden="true" />
        Open {lesson.lesson_type === 'video' ? 'the video' : 'the document'}
      </a>
    </Button>
  )
}

function TextContent({ text }: { text: string }) {
  return (
    <div className="max-w-prose space-y-4 leading-relaxed">
      {text
        .split(/\n{2,}/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {p}
          </p>
        ))}
    </div>
  )
}

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const queryClient = useQueryClient()
  const learning = useMyLearning()
  const lesson = useQuery({
    queryKey: learningKeys.lesson(lessonId),
    queryFn: () => fetchLesson(lessonId),
    enabled: !!lessonId,
  })

  const complete = useMutation({
    mutationFn: () => completeLesson(lessonId),
    onSuccess: async () => {
      toast.success('Lesson completed.')
      await queryClient.invalidateQueries({ queryKey: learningKeys.completions })
      await queryClient.invalidateQueries({ queryKey: learningKeys.modules })
      await queryClient.invalidateQueries({ queryKey: learningKeys.progress })
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  if (lesson.isPending || learning.isPending) return <LoadingState />
  if (lesson.error)
    return (
      <ErrorState message={friendlyError(lesson.error)} onRetry={() => void lesson.refetch()} />
    )
  if (!lesson.data) {
    return (
      <EmptyState
        title="This lesson is not available"
        description="It may be locked until you finish the previous module, or it is no longer published."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard/stack">Back to my stack</Link>
          </Button>
        }
      />
    )
  }

  const l = lesson.data
  const done = learning.completedLessonIds.has(l.id)
  const order = lessonOrder(learning.modules)
  const index = order.findIndex((x) => x.id === l.id)
  const next = index >= 0 ? order[index + 1] : undefined
  const canComplete = learning.membership?.status === 'active'

  return (
    <article>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
        <Link to="/dashboard/stack">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to my stack
        </Link>
      </Button>
      <p className="text-sm text-muted-foreground">{l.modules.title}</p>
      <div className="mt-1 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{l.title}</h1>
        {done && (
          <Badge variant="success">
            <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
            Completed
          </Badge>
        )}
      </div>
      {l.description && <p className="mb-6 max-w-prose text-muted-foreground">{l.description}</p>}
      {l.lesson_type === 'text' ? (
        <TextContent text={l.content_text ?? ''} />
      ) : (
        <VideoOrDocument lesson={l} />
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
        {!done && canComplete && (
          <Button loading={complete.isPending} onClick={() => complete.mutate()}>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Mark as complete
          </Button>
        )}
        {next && (
          <Button asChild variant={done ? 'primary' : 'outline'}>
            <Link to={`/dashboard/stack/lessons/${next.id}`}>
              Next lesson
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
        {!next && done && (
          <Button asChild>
            <Link to="/dashboard/stack">Back to my stack</Link>
          </Button>
        )}
      </div>
    </article>
  )
}
