import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Type,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Assignment, Lesson, LessonType, ModuleWithLessons } from '@/types/domain'
import { LessonPreview } from './lesson-preview'

const typeIcon: Record<LessonType, typeof Video> = { video: Video, pdf: FileText, text: Type }
const typeLabel: Record<LessonType, string> = { video: 'Video', pdf: 'PDF', text: 'Written' }

interface Handlers {
  onMoveModule: (direction: 'up' | 'down') => void
  onEditModule: () => void
  onDeleteModule: () => void
  onTogglePublishModule: () => void
  onAddLesson: () => void
  onMoveLesson: (index: number, direction: 'up' | 'down') => void
  onEditLesson: (lesson: Lesson) => void
  onDeleteLesson: (lesson: Lesson) => void
  onTogglePublishLesson: (lesson: Lesson) => void
  onEditAssignment: (assignment: Assignment | null) => void
  onDeleteAssignment: (assignment: Assignment) => void
}

export function ModuleCard({
  module,
  index,
  total,
  busy,
  ...h
}: { module: ModuleWithLessons; index: number; total: number; busy: boolean } & Handlers) {
  const lessonCount = module.lessons.length
  return (
    <Card className={cn('overflow-hidden p-0', busy && 'opacity-70')} aria-busy={busy}>
      <div className="flex flex-wrap items-start gap-4 border-b-2 border-outline bg-surface p-4">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-outline bg-accent font-display text-xl font-extrabold text-accent-foreground"
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 basis-full sm:basis-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-extrabold tracking-tight">
              <span className="sr-only">Module {index + 1}. </span>
              {module.title}
            </h3>
            <Badge variant={module.is_published ? 'success' : 'warning'}>
              {module.is_published ? 'Published' : 'Draft'}
            </Badge>
          </div>
          {module.description && (
            <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={index === 0 || busy}
            aria-label={`Move module ${module.title} up`}
            onClick={() => h.onMoveModule('up')}
          >
            <ChevronUp className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={index === total - 1 || busy}
            aria-label={`Move module ${module.title} down`}
            onClick={() => h.onMoveModule('down')}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            aria-label={`${module.is_published ? 'Unpublish' : 'Publish'} module ${module.title}`}
            onClick={h.onTogglePublishModule}
          >
            {module.is_published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            aria-label={`Edit module ${module.title}`}
            onClick={h.onEditModule}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            aria-label={`Delete module ${module.title}`}
            onClick={h.onDeleteModule}
          >
            <Trash2 className="size-4 text-danger" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {lessonCount === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">No lessons in this module yet.</p>
      ) : (
        <ol className="divide-y">
          {module.lessons.map((lesson, i) => {
            const Icon = typeIcon[lesson.lesson_type]
            return (
              <li key={lesson.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{lesson.title}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>{typeLabel[lesson.lesson_type]}</span>
                    {lesson.duration_minutes && <span>{lesson.duration_minutes} min</span>}
                    {!lesson.is_required && <span>Optional</span>}
                  </p>
                </div>
                <Badge variant={lesson.is_published ? 'success' : 'warning'}>
                  {lesson.is_published ? 'Published' : 'Draft'}
                </Badge>
                <div className="flex flex-wrap items-center gap-1">
                  <LessonPreview lesson={lesson} />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={i === 0 || busy}
                    aria-label={`Move lesson ${lesson.title} up`}
                    onClick={() => h.onMoveLesson(i, 'up')}
                  >
                    <ChevronUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={i === lessonCount - 1 || busy}
                    aria-label={`Move lesson ${lesson.title} down`}
                    onClick={() => h.onMoveLesson(i, 'down')}
                  >
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => h.onTogglePublishLesson(lesson)}
                  >
                    {lesson.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    aria-label={`Edit lesson ${lesson.title}`}
                    onClick={() => h.onEditLesson(lesson)}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    aria-label={`Delete lesson ${lesson.title}`}
                    onClick={() => h.onDeleteLesson(lesson)}
                  >
                    <Trash2 className="size-4 text-danger" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <div className="border-t p-3">
        {module.assignments[0] ? (
          <div className="flex flex-wrap items-center gap-3 px-1">
            <ClipboardCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{module.assignments[0].title}</p>
              <p className="text-xs text-muted-foreground">
                {module.assignments[0].type === 'quiz' ? 'Quiz' : 'Project'} · pass mark{' '}
                {module.assignments[0].pass_mark}%
              </p>
            </div>
            <Badge variant={module.assignments[0].is_published ? 'success' : 'warning'}>
              {module.assignments[0].is_published ? 'Published' : 'Draft'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              aria-label={`Edit assignment ${module.assignments[0].title}`}
              onClick={() => h.onEditAssignment(module.assignments[0]!)}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              aria-label={`Delete assignment ${module.assignments[0].title}`}
              onClick={() => h.onDeleteAssignment(module.assignments[0]!)}
            >
              <Trash2 className="size-4 text-danger" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            aria-label={`Add assignment to ${module.title}`}
            onClick={() => h.onEditAssignment(null)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add assignment
          </Button>
        )}
      </div>
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          aria-label={`Add lesson to ${module.title}`}
          onClick={h.onAddLesson}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add lesson
        </Button>
      </div>
    </Card>
  )
}
