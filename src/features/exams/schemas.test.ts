import { examSchema, type ExamInput } from './schemas'

const base: ExamInput = {
  title: 'Final exam',
  instructions: '',
  time_limit_minutes: '',
  pass_mark: '60',
  max_attempts: '3',
  cooldown_hours: '24',
  is_published: false,
  questions: [],
}
const q = { prompt: 'Q?', options: [{ text: 'a' }, { text: 'b' }], correct_index: 0, points: '1' }

describe('examSchema', () => {
  it('lets a draft exam be empty', () => {
    expect(examSchema.safeParse(base).success).toBe(true)
  })
  it('needs a question to publish', () => {
    expect(examSchema.safeParse({ ...base, is_published: true }).success).toBe(false)
    expect(examSchema.safeParse({ ...base, is_published: true, questions: [q] }).success).toBe(true)
  })
  it('validates the limits', () => {
    expect(examSchema.safeParse({ ...base, time_limit_minutes: '0' }).success).toBe(false)
    expect(examSchema.safeParse({ ...base, time_limit_minutes: '90' }).success).toBe(true)
    expect(examSchema.safeParse({ ...base, pass_mark: '' }).success).toBe(false)
    expect(examSchema.safeParse({ ...base, cooldown_hours: '-1' }).success).toBe(false)
    expect(examSchema.safeParse({ ...base, cooldown_hours: '0' }).success).toBe(true)
    expect(examSchema.safeParse({ ...base, max_attempts: '' }).success).toBe(true)
  })
  it('rejects an out-of-range correct answer', () => {
    expect(examSchema.safeParse({ ...base, questions: [{ ...q, correct_index: 4 }] }).success).toBe(
      false,
    )
  })
})
