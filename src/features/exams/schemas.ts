import { z } from 'zod'
import { checkCorrectAnswers, optionalInt, questionSchema } from '@/features/quiz/schemas'

export const examSchema = z
  .object({
    title: z.string().trim().min(2, 'Enter a title').max(160, 'Keep it under 160 characters'),
    instructions: z.string().max(10000, 'Keep it under 10,000 characters'),
    time_limit_minutes: optionalInt(1, 600, 'Enter 1 to 600 minutes, or leave empty for no limit'),
    pass_mark: optionalInt(1, 100, 'Enter a percentage from 1 to 100').refine(
      (v) => v !== '',
      'Enter a percentage from 1 to 100',
    ),
    max_attempts: optionalInt(1, 20, 'Enter 1 to 20, or leave empty for unlimited'),
    cooldown_hours: optionalInt(0, 720, 'Enter 0 to 720 hours').refine(
      (v) => v !== '',
      'Enter 0 to 720 hours',
    ),
    is_published: z.boolean(),
    questions: z.array(questionSchema),
  })
  .superRefine((v, ctx) => {
    if (v.is_published && v.questions.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['questions'],
        message: 'Add at least one question before publishing',
      })
    }
    checkCorrectAnswers(v.questions, ctx)
  })
export type ExamInput = z.infer<typeof examSchema>
