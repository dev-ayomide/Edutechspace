import { z } from 'zod'
import { checkCorrectAnswers, optionalInt, questionSchema } from '@/features/quiz/schemas'

export const assignmentSchema = z
  .object({
    title: z.string().trim().min(2, 'Enter a title').max(160, 'Keep it under 160 characters'),
    type: z.enum(['quiz', 'submission']),
    instructions: z.string().max(10000, 'Keep it under 10,000 characters'),
    max_score: optionalInt(1, 1000, 'Enter a score from 1 to 1000').refine(
      (v) => v !== '',
      'Enter a score from 1 to 1000',
    ),
    pass_mark: optionalInt(1, 100, 'Enter a percentage from 1 to 100').refine(
      (v) => v !== '',
      'Enter a percentage from 1 to 100',
    ),
    max_attempts: optionalInt(1, 20, 'Enter 1 to 20, or leave empty for unlimited'),
    is_published: z.boolean(),
    questions: z.array(questionSchema),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'submission' && v.is_published && v.instructions.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['instructions'],
        message: 'Write the instructions before publishing',
      })
    }
    if (v.type === 'quiz' && v.is_published && v.questions.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['questions'],
        message: 'Add at least one question before publishing',
      })
    }
    checkCorrectAnswers(v.questions, ctx)
  })
export type AssignmentInput = z.infer<typeof assignmentSchema>

export { blankQuestion, type QuestionInput } from '@/features/quiz/schemas'
