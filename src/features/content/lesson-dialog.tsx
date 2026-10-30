import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { friendlyError } from '@/lib/errors'
import type { Lesson } from '@/types/domain'
import { saveLessonWithFile } from './save-lesson'
import { lessonSchema, validateUpload, type LessonInput } from './schemas'

const emptyValues = (lesson: Lesson | null): LessonInput => ({
  title: lesson?.title ?? '',
  description: lesson?.description ?? '',
  lesson_type: lesson?.lesson_type ?? 'video',
  source: lesson?.content_path ? 'upload' : 'url',
  content_url: lesson?.content_url ?? '',
  content_text: lesson?.content_text ?? '',
  duration_minutes: lesson?.duration_minutes ? String(lesson.duration_minutes) : '',
  is_required: lesson?.is_required ?? true,
  is_published: lesson?.is_published ?? false,
  hasFile: !!lesson?.content_path,
})

const fileLabel = (path: string) =>
  path
    .split('/')
    .pop()
    ?.replace(/^[0-9a-f-]{36}-/, '') ?? path

interface LessonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stackId: string
  moduleId: string
  lesson: Lesson | null
  onSaved: () => void
}

/** Radix unmounts the content when closed, so LessonForm starts fresh (empty file, defaults) every time. */
export function LessonDialog(props: LessonDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        title={props.lesson ? 'Edit lesson' : 'New lesson'}
        description="Lessons stay hidden from students until you publish them."
        className="max-w-xl"
      >
        <LessonForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

function LessonForm({ onOpenChange, stackId, moduleId, lesson, onSaved }: LessonDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<LessonInput>({
    resolver: zodResolver(lessonSchema),
    defaultValues: emptyValues(null),
  })

  const type = useWatch({ control, name: 'lesson_type' })
  const source = useWatch({ control, name: 'source' })
  const isText = type === 'text'
  // A stored file only counts while the lesson is still the same kind as when it was uploaded.
  const storedPath = lesson && lesson.lesson_type === type ? lesson.content_path : null

  useEffect(() => {
    setValue('hasFile', !!file || !!storedPath)
  }, [file, storedPath, setValue])

  const mutation = useMutation({
    mutationFn: (input: LessonInput) =>
      saveLessonWithFile({ stackId, moduleId, input, file, existing: lesson }),
    onSuccess: () => {
      toast.success(lesson ? 'Lesson updated.' : 'Lesson added.')
      onOpenChange(false)
      onSaved()
    },
    onError: (e) => toast.error(friendlyError(e)),
  })

  const onFile = (picked: File | null) => {
    if (!picked || isText) return
    const problem = validateUpload(picked, type as 'video' | 'pdf')
    setFileError(problem)
    setFile(problem ? null : picked)
  }

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
      <FormField id="lesson-title" label="Title" error={errors.title?.message}>
        <Input
          id="lesson-title"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'lesson-title-error' : undefined}
          {...register('title')}
        />
      </FormField>
      <FormField
        id="lesson-description"
        label="Short description"
        error={errors.description?.message}
      >
        <Textarea id="lesson-description" className="min-h-16" {...register('description')} />
      </FormField>
      <FormField id="lesson-type" label="Lesson type">
        <Select id="lesson-type" {...register('lesson_type')}>
          <option value="video">Video</option>
          <option value="pdf">PDF document</option>
          <option value="text">Written lesson</option>
        </Select>
      </FormField>

      {isText ? (
        <FormField
          id="lesson-text"
          label="Lesson text"
          hint="Plain text. Separate paragraphs with a blank line."
          error={errors.content_text?.message}
        >
          <Textarea
            id="lesson-text"
            className="min-h-40"
            aria-invalid={!!errors.content_text}
            aria-describedby={errors.content_text ? 'lesson-text-error' : undefined}
            {...register('content_text')}
          />
        </FormField>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Where is the {type === 'video' ? 'video' : 'document'}?
            </legend>
            <div className="flex gap-6">
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="radio" value="url" className="size-4" {...register('source')} />
                Paste a link
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="radio" value="upload" className="size-4" {...register('source')} />
                Upload a file
              </label>
            </div>
          </fieldset>
          {source === 'url' ? (
            <FormField
              id="lesson-url"
              label="Link"
              hint={
                type === 'video' ? 'A YouTube, Vimeo or direct video link.' : 'A link to the PDF.'
              }
              error={errors.content_url?.message}
            >
              <Input
                id="lesson-url"
                type="url"
                inputMode="url"
                placeholder="https://"
                aria-invalid={!!errors.content_url}
                aria-describedby={errors.content_url ? 'lesson-url-error' : undefined}
                {...register('content_url')}
              />
            </FormField>
          ) : (
            <FormField
              id="lesson-file"
              label="File"
              hint={type === 'video' ? 'MP4 or WebM, up to 100 MB.' : 'PDF, up to 100 MB.'}
              error={fileError ?? errors.hasFile?.message}
            >
              <Input
                id="lesson-file"
                type="file"
                accept={type === 'video' ? 'video/mp4,video/webm' : 'application/pdf'}
                className="py-2"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              {(file || storedPath) && (
                <p className="text-xs text-muted-foreground">
                  {file ? `Selected: ${file.name}` : `Current file: ${fileLabel(storedPath!)}`}
                </p>
              )}
            </FormField>
          )}
        </>
      )}

      <FormField
        id="lesson-duration"
        label="Duration (minutes, optional)"
        error={errors.duration_minutes?.message}
      >
        <Input
          id="lesson-duration"
          inputMode="numeric"
          className="max-w-32"
          {...register('duration_minutes')}
        />
      </FormField>
      <div className="space-y-1">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" {...register('is_required')} />
          Required to complete the module
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" {...register('is_published')} />
          Published (visible to students)
        </label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {lesson ? 'Save changes' : 'Add lesson'}
        </Button>
      </DialogFooter>
    </form>
  )
}
