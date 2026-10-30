import { z } from 'zod'
import { LESSON_TYPES } from '@/types/domain'

export const moduleSchema = z.object({
  title: z.string().trim().min(2, 'Enter a title').max(160, 'Keep it under 160 characters'),
  description: z.string().trim().max(2000, 'Keep it under 2000 characters'),
})
export type ModuleInput = z.infer<typeof moduleSchema>

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024
export const UPLOAD_TYPES: Record<'video' | 'pdf', string[]> = {
  video: ['video/mp4', 'video/webm'],
  pdf: ['application/pdf'],
}

export const lessonSchema = z
  .object({
    title: z.string().trim().min(2, 'Enter a title').max(160, 'Keep it under 160 characters'),
    description: z.string().trim().max(2000, 'Keep it under 2000 characters'),
    lesson_type: z.enum(LESSON_TYPES),
    source: z.enum(['url', 'upload']),
    content_url: z.string().trim(),
    content_text: z.string(),
    duration_minutes: z
      .string()
      .trim()
      .refine(
        (v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 1000),
        'Enter minutes between 1 and 1000',
      ),
    is_required: z.boolean(),
    is_published: z.boolean(),
    // Not part of the stored row: lets the form know whether a file is attached or already stored.
    hasFile: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (
      v.lesson_type !== 'text' &&
      v.source === 'url' &&
      v.content_url !== '' &&
      !/^https?:\/\/\S+$/i.test(v.content_url)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['content_url'],
        message: 'Enter a link starting with http:// or https://',
      })
    }
    if (!v.is_published) return
    if (v.lesson_type === 'text') {
      if (v.content_text.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['content_text'],
          message: 'Write the lesson text before publishing',
        })
      }
    } else if (v.source === 'url') {
      if (v.content_url === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['content_url'],
          message: 'Add a link before publishing',
        })
      }
    } else if (!v.hasFile) {
      ctx.addIssue({
        code: 'custom',
        path: ['hasFile'],
        message: 'Upload a file before publishing',
      })
    }
  })
export type LessonInput = z.infer<typeof lessonSchema>

export function validateUpload(file: File, kind: 'video' | 'pdf'): string | null {
  if (!UPLOAD_TYPES[kind].includes(file.type)) {
    return kind === 'pdf' ? 'Upload a PDF file.' : 'Upload an MP4 or WebM video.'
  }
  if (file.size > MAX_UPLOAD_BYTES) return 'The file is larger than 100 MB.'
  return null
}
