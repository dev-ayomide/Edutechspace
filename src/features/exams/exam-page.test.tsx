import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import type { ExamQuestion, MyExam } from '@/types/domain'
import * as api from './api'
import { ExamPage } from './exam-page'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  fetchMyExam: vi.fn(),
  startExam: vi.fn(),
  fetchExamQuestions: vi.fn(),
  submitExam: vi.fn(),
}))
vi.mock('@/features/certificates/api', () => ({
  sendCertificateEmail: vi.fn().mockResolvedValue(undefined),
}))

const exam = (over: Partial<MyExam> = {}): MyExam => ({
  exam_id: 'e1',
  title: 'Frontend final',
  instructions: 'Good luck',
  time_limit_minutes: 30,
  pass_mark: 60,
  max_attempts: 3,
  cooldown_hours: 24,
  question_count: 2,
  attempts_used: 0,
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
const questions: ExamQuestion[] = [
  {
    id: 'q1',
    exam_id: 'e1',
    prompt: 'What is HTML?',
    options: ['A language', 'A fruit'],
    points: 1,
    order_index: 1,
  },
  {
    id: 'q2',
    exam_id: 'e1',
    prompt: 'What is CSS?',
    options: ['Styles', 'Data'],
    points: 1,
    order_index: 2,
  },
]
const running = (deadline: string | null = new Date(Date.now() + 20 * 60_000).toISOString()) =>
  exam({ state: 'in_progress', attempt_id: 'att1', started_at: new Date().toISOString(), deadline })

describe('ExamPage states', () => {
  beforeEach(() => vi.mocked(api.fetchMyExam).mockReset())

  it('explains when no exam is published', async () => {
    vi.mocked(api.fetchMyExam).mockResolvedValue(null)
    renderWithProviders(<ExamPage />)
    expect(await screen.findByText('No final exam yet')).toBeInTheDocument()
  })

  it('shows the rules and starts the exam', async () => {
    vi.mocked(api.fetchMyExam).mockResolvedValue(exam())
    vi.mocked(api.startExam).mockReset().mockResolvedValue(running())
    renderWithProviders(<ExamPage />)
    expect(await screen.findByText('30 minutes')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('Good luck')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Start exam' }))
    await waitFor(() => expect(api.startExam).toHaveBeenCalledWith('e1'))
  })

  it('is locked until the modules are finished', async () => {
    vi.mocked(api.fetchMyExam).mockResolvedValue(exam({ state: 'locked' }))
    renderWithProviders(<ExamPage />)
    expect(await screen.findByText('Not unlocked yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start exam' })).not.toBeInTheDocument()
  })

  it('shows when the next attempt opens during the waiting period', async () => {
    vi.mocked(api.fetchMyExam).mockResolvedValue(
      exam({
        state: 'cooldown',
        attempts_used: 1,
        best_score: 40,
        next_available_at: '2026-11-01T10:00:00Z',
      }),
    )
    renderWithProviders(<ExamPage />)
    expect(await screen.findByText('Take a breath')).toBeInTheDocument()
    expect(screen.getByText(/Your best score so far: 40%/)).toBeInTheDocument()
  })

  it('stops when attempts are exhausted', async () => {
    vi.mocked(api.fetchMyExam).mockResolvedValue(exam({ state: 'exhausted', attempts_used: 3 }))
    renderWithProviders(<ExamPage />)
    expect(await screen.findByText('No attempts left', { selector: 'h3' })).toBeInTheDocument()
  })

  it('links to the certificate once passed', async () => {
    vi.mocked(api.fetchMyExam).mockResolvedValue(
      exam({ state: 'passed', passed: true, best_score: 90 }),
    )
    renderWithProviders(<ExamPage />)
    expect(await screen.findByRole('link', { name: 'View my certificate' })).toHaveAttribute(
      'href',
      '/dashboard/certificate',
    )
  })
})

describe('ExamTaker', () => {
  beforeEach(() => {
    vi.mocked(api.fetchMyExam).mockReset().mockResolvedValue(running())
    vi.mocked(api.fetchExamQuestions).mockReset().mockResolvedValue(questions)
    vi.mocked(api.submitExam).mockReset().mockResolvedValue({
      score: 2,
      max_score: 2,
      percent: 100,
      passed: true,
      expired: false,
      certificate_id: 'c1',
    })
  })

  it('shows a countdown and requires every answer before submitting', async () => {
    renderWithProviders(<ExamPage />)
    expect(await screen.findByRole('timer')).toHaveTextContent(/\d\d:\d\d/)
    const submit = screen.getByRole('button', { name: 'Submit exam' })
    expect(submit).toBeDisabled()
    await userEvent.click(screen.getByLabelText('A language'))
    expect(submit).toBeDisabled()
    await userEvent.click(screen.getByLabelText('Styles'))
    expect(submit).toBeEnabled()
    expect(screen.getByText('2 of 2 answered')).toBeInTheDocument()
  })

  it('confirms, then sends one answer per question in order', async () => {
    renderWithProviders(<ExamPage />)
    await userEvent.click(await screen.findByLabelText('A fruit'))
    await userEvent.click(screen.getByLabelText('Styles'))
    await userEvent.click(screen.getByRole('button', { name: 'Submit exam' }))
    const dialog = await screen.findByRole('dialog')
    expect(api.submitExam).not.toHaveBeenCalled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(api.submitExam).toHaveBeenCalledWith('att1', [1, 0]))
  })

  it('shows the result and the certificate link after passing', async () => {
    vi.mocked(api.fetchMyExam)
      .mockResolvedValueOnce(running())
      .mockResolvedValue(exam({ state: 'passed', passed: true, best_score: 100 }))
    renderWithProviders(<ExamPage />)
    await userEvent.click(await screen.findByLabelText('A language'))
    await userEvent.click(screen.getByLabelText('Styles'))
    await userEvent.click(screen.getByRole('button', { name: 'Submit exam' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Submit' }),
    )
    expect(await screen.findByText('You passed!')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'View my certificate' })).toBeInTheDocument()
  })

  it('auto-submits when time runs out, marking unanswered questions with -1', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      vi.mocked(api.fetchMyExam).mockResolvedValue(
        running(new Date(Date.now() + 2000).toISOString()),
      )
      renderWithProviders(<ExamPage />)
      await screen.findByRole('timer')
      await userEvent
        .setup({ advanceTimers: vi.advanceTimersByTime })
        .click(screen.getByLabelText('A language'))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000)
      })
      await waitFor(() => expect(api.submitExam).toHaveBeenCalledWith('att1', [0, -1]))
    } finally {
      vi.useRealTimers()
    }
  })
})
