import { removeLessonFile, saveLesson, uploadLessonFile } from './api'
import type { LessonInput } from './schemas'
import type { Lesson } from '@/types/domain'

interface SaveLessonArgs {
  stackId: string
  moduleId: string
  input: LessonInput
  file: File | null
  /** The lesson being edited, if any. */
  existing: Lesson | null
}

/**
 * Saves a lesson together with its file, keeping storage tidy:
 * - a freshly uploaded file is removed again if saving the lesson fails;
 * - a replaced or abandoned old file is removed once the lesson has been saved.
 */
export async function saveLessonWithFile({
  stackId,
  moduleId,
  input,
  file,
  existing,
}: SaveLessonArgs) {
  const wantsFile = input.lesson_type !== 'text' && input.source === 'upload'
  // A stored file only carries over if the lesson is still the same kind (a PDF cannot become a video).
  const reusablePath =
    existing && existing.lesson_type === input.lesson_type ? existing.content_path : null

  let uploadedPath: string | null = null
  if (wantsFile && file) uploadedPath = await uploadLessonFile(stackId, moduleId, file)
  const contentPath = wantsFile ? (uploadedPath ?? reusablePath) : null

  try {
    await saveLesson(moduleId, { input, contentPath }, existing?.id)
  } catch (error) {
    if (uploadedPath) await removeLessonFile(uploadedPath)
    throw error
  }

  const oldPath = existing?.content_path
  if (oldPath && oldPath !== contentPath) await removeLessonFile(oldPath)
}
