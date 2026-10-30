import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { friendlyError } from '@/lib/errors'
import type { Lesson } from '@/types/domain'
import { getLessonFileUrl } from './api'

/** Opens a lesson's link, or a short-lived signed URL for an uploaded file, in a new tab. */
export function LessonPreview({ lesson }: { lesson: Lesson }) {
  const [loading, setLoading] = useState(false)
  if (lesson.lesson_type === 'text') return null

  if (lesson.content_url) {
    return (
      <Button asChild variant="ghost" size="sm">
        <a
          href={lesson.content_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${lesson.title} link (new tab)`}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Open
        </a>
      </Button>
    )
  }
  if (!lesson.content_path) return null
  const path = lesson.content_path
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Open ${lesson.title} file (new tab)`}
      loading={loading}
      onClick={async () => {
        setLoading(true)
        try {
          window.open(await getLessonFileUrl(path), '_blank', 'noopener,noreferrer')
        } catch (e) {
          toast.error(friendlyError(e, 'Could not open the file.'))
        } finally {
          setLoading(false)
        }
      }}
    >
      <ExternalLink className="size-4" aria-hidden="true" />
      Open
    </Button>
  )
}
