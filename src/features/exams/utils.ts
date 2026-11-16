import type { ExamState, MyExam } from '@/types/domain'

export const examStateLabel = (exam: MyExam | null): { text: string; hint: string } => {
  if (!exam) return { text: 'Not yet', hint: 'Your stack lead has not published the exam' }
  const labels: Record<ExamState, { text: string; hint: string }> = {
    locked: { text: 'Locked', hint: 'Finish every module first' },
    ready: { text: 'Ready', hint: 'You can start the exam' },
    in_progress: { text: 'In progress', hint: 'You have a running attempt' },
    cooldown: { text: 'Wait', hint: 'You can try again soon' },
    exhausted: { text: 'No attempts left', hint: 'Contact your stack lead' },
    passed: {
      text: 'Passed',
      hint: exam.best_score !== null ? `Best score ${exam.best_score}%` : 'Well done',
    },
  }
  return labels[exam.state]
}

export const attemptsLeft = (
  exam: Pick<MyExam, 'max_attempts' | 'attempts_used'>,
): number | null =>
  exam.max_attempts === null ? null : Math.max(0, exam.max_attempts - exam.attempts_used)
