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
import { StackContentNav } from './stack-content-nav'
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
        className="aspect-video w-full rounded-md bg-black"
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
        className="aspect-video w-full rounded-md border"
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
        className="aspect-video w-full rounded-md bg-black"
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
    <div className="max-w-prose space-y-5 text-[17px] leading-[1.7]">
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

  const moduleIndex = learning.modules.findIndex((m) => m.lessons.some((x) => x.id === l.id))
  const moduleLessons = learning.modules[moduleIndex]?.lessons ?? []
  const position = moduleLessons.findIndex((x) => x.id === l.id)

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <article className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm">
          <Link to="/dashboard/stack" className="font-semibold text-link hover:underline">
            <ArrowLeft className="mr-1 inline size-4" aria-hidden="true" />
            My stack
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">
            ›
          </span>
          <span className="text-muted-foreground">{l.modules.title}</span>
        </nav>

        {l.lesson_type === 'text' ? null : (
          <div className="mb-6">
            <VideoOrDocument lesson={l} />
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {moduleIndex >= 0 ? `Module ${moduleIndex + 1}` : l.modules.title}
          {position >= 0 && ` · Lesson ${position + 1} of ${moduleLessons.length}`}
          {l.duration_minutes ? ` · ${l.duration_minutes} min` : ''}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold sm:text-[1.75rem]">{l.title}</h1>
          {done && (
            <Badge variant="success">
              <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
              Completed
            </Badge>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-b pb-5">
          {!done && canComplete && (
            <Button loading={complete.isPending} onClick={() => complete.mutate()}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Mark as complete
            </Button>
          )}
          {done && (
            <p className="text-sm font-semibold text-success-soft-foreground">
              Lesson complete. Nice work.
            </p>
          )}
          {next && (
            <Button asChild variant={done ? 'primary' : 'outline'} className="sm:ml-auto">
              <Link to={`/dashboard/stack/lessons/${next.id}`}>
                Next lesson
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
          {!next && done && (
            <Button asChild className="sm:ml-auto">
              <Link to="/dashboard/stack">Back to my stack</Link>
            </Button>
          )}
        </div>

        {l.description && (
          <p className="mt-5 max-w-prose text-lg text-muted-foreground">{l.description}</p>
        )}
        {l.lesson_type === 'text' && (
          <div className="mt-6">
            <TextContent text={l.content_text ?? ''} />
          </div>
        )}
      </article>

      <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
        <StackContentNav
          modules={learning.modules}
          states={learning.states}
          completedLessonIds={learning.completedLessonIds}
          currentLessonId={l.id}
        />
      </aside>
    </div>
  )
}
