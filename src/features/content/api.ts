import { supabase } from '@/lib/supabase'
import type { Lesson, Module, ModuleWithLessons } from '@/types/domain'
import type { LessonInput, ModuleInput } from './schemas'

export const contentKeys = {
  stack: (stackId: string) => ['content', stackId] as const,
}

export async function listModulesWithLessons(stackId: string): Promise<ModuleWithLessons[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*, lessons(*), assignments(*)')
    .eq('stack_id', stackId)
    .order('order_index')
  if (error) throw error
  return (data as ModuleWithLessons[]).map((m) => ({
    ...m,
    lessons: [...m.lessons].sort((a, b) => a.order_index - b.order_index),
  }))
}

export async function saveModule(stackId: string, input: ModuleInput, id?: string) {
  const row = { title: input.title, description: input.description || null }
  const { error } = id
    ? await supabase.from('modules').update(row).eq('id', id)
    : await supabase.from('modules').insert({ ...row, stack_id: stackId })
  if (error) throw error
}

export async function setModulePublished(id: string, isPublished: boolean) {
  const { error } = await supabase
    .from('modules')
    .update({ is_published: isPublished })
    .eq('id', id)
  if (error) throw error
}

export async function deleteModule(id: string) {
  const { error } = await supabase.from('modules').delete().eq('id', id)
  if (error) throw error
}

export async function reorderModules(stackId: string, ids: string[]) {
  const { error } = await supabase.rpc('reorder_modules', { p_stack_id: stackId, p_ids: ids })
  if (error) throw error
}

export interface LessonSave {
  input: LessonInput
  /** Path of an already stored or freshly uploaded file, when the lesson is upload-based. */
  contentPath: string | null
}

function lessonRow({ input, contentPath }: LessonSave) {
  const isText = input.lesson_type === 'text'
  const useUrl = !isText && input.source === 'url'
  const useFile = !isText && input.source === 'upload'
  return {
    title: input.title,
    description: input.description || null,
    lesson_type: input.lesson_type,
    content_url: useUrl && input.content_url ? input.content_url : null,
    content_path: useFile ? contentPath : null,
    content_text: isText ? input.content_text : null,
    duration_minutes: input.duration_minutes ? Number(input.duration_minutes) : null,
    is_required: input.is_required,
    is_published: input.is_published,
  }
}

export async function saveLesson(moduleId: string, save: LessonSave, id?: string) {
  const row = lessonRow(save)
  const { error } = id
    ? await supabase.from('lessons').update(row).eq('id', id)
    : await supabase.from('lessons').insert({ ...row, module_id: moduleId })
  if (error) throw error
}

export async function setLessonPublished(lesson: Lesson, isPublished: boolean) {
  const { error } = await supabase
    .from('lessons')
    .update({ is_published: isPublished })
    .eq('id', lesson.id)
  if (error) throw error
}

export async function deleteLesson(lesson: Lesson) {
  const { error } = await supabase.from('lessons').delete().eq('id', lesson.id)
  if (error) throw error
  if (lesson.content_path) await removeLessonFile(lesson.content_path)
}

export async function reorderLessons(moduleId: string, ids: string[]) {
  const { error } = await supabase.rpc('reorder_lessons', { p_module_id: moduleId, p_ids: ids })
  if (error) throw error
}

/** Uploads to <stack_id>/<module_id>/<uuid>-<name>; the first folder is what storage policies check. */
export async function uploadLessonFile(
  stackId: string,
  moduleId: string,
  file: File,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80)
  const path = `${stackId}/${moduleId}/${crypto.randomUUID()}-${safeName}`
  const { error } = await supabase.storage
    .from('lesson-media')
    .upload(path, file, { contentType: file.type })
  if (error) throw error
  return path
}

export async function removeLessonFile(path: string) {
  // Best effort: an orphaned file is harmless, so a failed cleanup must not fail the user's action.
  await supabase.storage.from('lesson-media').remove([path])
}

export async function getLessonFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('lesson-media').createSignedUrl(path, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

export type { Module }
