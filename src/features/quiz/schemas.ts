import { z } from 'zod'

export const optionalInt = (min: number, max: number, message: string) =>
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
export type QuestionInput = z.infer<typeof questionSchema>

export const blankQuestion = (): QuestionInput => ({
  prompt: '',
  options: [{ text: '' }, { text: '' }],
  correct_index: 0,
  points: '1',
})

/** A question whose correct answer index points past its options is invalid. */
export function checkCorrectAnswers(questions: QuestionInput[], ctx: z.RefinementCtx) {
  questions.forEach((q, i) => {
    if (q.correct_index >= q.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['questions', i, 'correct_index'],
        message: 'Choose the correct answer',
      })
    }
  })
}

export interface QuestionWithKey {
  prompt: string
  options: string[]
  correct_index: number
  points: number
}

export const toFormQuestions = (qs: QuestionWithKey[] | undefined): QuestionInput[] =>
  (qs ?? []).map((q) => ({
    prompt: q.prompt,
    options: q.options.map((text) => ({ text })),
    correct_index: q.correct_index,
    points: String(q.points),
  }))

export const toRpcQuestions = (qs: QuestionInput[]): QuestionWithKey[] =>
  qs.map((q) => ({
    prompt: q.prompt,
    options: q.options.map((o) => o.text),
    correct_index: q.correct_index,
    points: Number(q.points || 1),
  }))
