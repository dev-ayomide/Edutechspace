import { z } from 'zod'

const optionalInt = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), message)

export const questionSchema = z.object({
  prompt: z.string().trim().min(1, 'Write the question').max(1000, 'Keep it under 1000 characters'),
  options: z
    .array(z.object({ text: z.string().trim().min(1, 'Fill in this option') }))
    .min(2, 'Add at least two options')
    .max(6, 'Use at most six options'),
  correct_index: z.number().int().min(0),
  points: optionalInt(1, 100, 'Points must be 1 to 100'),
})

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
    v.questions.forEach((q, i) => {
      if (q.correct_index >= q.options.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', i, 'correct_index'],
          message: 'Choose the correct answer',
        })
      }
    })
  })
export type AssignmentInput = z.infer<typeof assignmentSchema>
export type QuestionInput = z.infer<typeof questionSchema>

export const blankQuestion = (): QuestionInput => ({
  prompt: '',
  options: [{ text: '' }, { text: '' }],
  correct_index: 0,
  points: '1',
})
