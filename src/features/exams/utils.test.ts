import type { MyExam } from '@/types/domain'
import { attemptsLeft, examStateLabel } from './utils'

const exam = (over: Partial<MyExam> = {}): MyExam => ({
  exam_id: 'e',
  title: 'Final',
  instructions: null,
  time_limit_minutes: 30,
  pass_mark: 60,
  max_attempts: 3,
  cooldown_hours: 24,
  question_count: 10,
  attempts_used: 1,
  best_score: null,
  passed: false,
  state: 'ready',
  next_available_at: null,
  certificate_id: null,
  attempt_id: null,
  started_at: null,
  deadline: null,
  ...over,
})

describe('examStateLabel', () => {
  it('describes every state', () => {
    expect(examStateLabel(null).text).toBe('Not yet')
    expect(examStateLabel(exam({ state: 'locked' })).text).toBe('Locked')
    expect(examStateLabel(exam({ state: 'ready' })).text).toBe('Ready')
    expect(examStateLabel(exam({ state: 'cooldown' })).text).toBe('Wait')
    expect(examStateLabel(exam({ state: 'exhausted' })).text).toBe('No attempts left')
    expect(examStateLabel(exam({ state: 'passed', best_score: 85 })).hint).toBe('Best score 85%')
  })
})

describe('attemptsLeft', () => {
  it('counts down, never below zero, and is null when unlimited', () => {
    expect(attemptsLeft(exam())).toBe(2)
    expect(attemptsLeft(exam({ attempts_used: 5 }))).toBe(0)
    expect(attemptsLeft(exam({ max_attempts: null }))).toBeNull()
  })
})
