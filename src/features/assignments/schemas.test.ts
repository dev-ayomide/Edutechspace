import { assignmentSchema, blankQuestion, type AssignmentInput } from './schemas'

const base: AssignmentInput = {
  title: 'Quiz 1',
  type: 'quiz',
  instructions: '',
  max_score: '100',
  pass_mark: '60',
  max_attempts: '',
  is_published: false,
  questions: [],
}
const question = (over = {}) => ({
  prompt: 'What?',
  options: [{ text: 'a' }, { text: 'b' }],
  correct_index: 1,
  points: '1',
  ...over,
})

describe('assignmentSchema', () => {
  it('lets a draft quiz be empty', () => {
    expect(assignmentSchema.safeParse(base).success).toBe(true)
  })
  it('needs a question to publish a quiz', () => {
    expect(assignmentSchema.safeParse({ ...base, is_published: true }).success).toBe(false)
    expect(
      assignmentSchema.safeParse({ ...base, is_published: true, questions: [question()] }).success,
    ).toBe(true)
  })
  it('needs instructions to publish a project', () => {
    const project = { ...base, type: 'submission' as const }
    expect(assignmentSchema.safeParse({ ...project, is_published: true }).success).toBe(false)
    expect(
      assignmentSchema.safeParse({ ...project, is_published: true, instructions: 'Build it' })
        .success,
    ).toBe(true)
  })
  it('validates score, pass mark and attempts', () => {
    expect(assignmentSchema.safeParse({ ...base, max_score: '0' }).success).toBe(false)
    expect(assignmentSchema.safeParse({ ...base, pass_mark: '101' }).success).toBe(false)
    expect(assignmentSchema.safeParse({ ...base, max_attempts: '25' }).success).toBe(false)
    expect(assignmentSchema.safeParse({ ...base, max_attempts: '3' }).success).toBe(true)
  })
  it('requires two non-empty options and a valid correct answer', () => {
    expect(
      assignmentSchema.safeParse({ ...base, questions: [question({ options: [{ text: 'a' }] })] })
        .success,
    ).toBe(false)
    expect(
      assignmentSchema.safeParse({
        ...base,
        questions: [question({ options: [{ text: 'a' }, { text: '' }] })],
      }).success,
    ).toBe(false)
    expect(
      assignmentSchema.safeParse({ ...base, questions: [question({ correct_index: 5 })] }).success,
    ).toBe(false)
  })
  it('starts new questions with two blank options', () => {
    expect(blankQuestion().options).toHaveLength(2)
  })
})
