import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { assignment, moduleState } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import type { QuizQuestion, Submission } from '@/types/domain'
import * as api from './api'
import { AssignmentPage } from './assignment-page'

const learning = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('./hooks', () => ({ useMyLearning: () => learning.current }))
vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'u1' } } }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  fetchAssignmentDetail: vi.fn(),
  submitQuiz: vi.fn(),
  submitWork: vi.fn(),
  getSubmissionFileUrl: vi.fn(),
}))

const questions: QuizQuestion[] = [
  {
    id: 'q1',
    assignment_id: 'a1',
    prompt: 'What is HTML?',
    options: ['A language', 'A fruit'],
    points: 1,
    order_index: 1,
  },
  {
    id: 'q2',
    assignment_id: 'a1',
    prompt: 'What is CSS?',
    options: ['Styles', 'Data'],
    points: 1,
    order_index: 2,
  },
]
const sub = (over: Partial<Submission> = {}): Submission => ({
  id: 's1',
  assignment_id: 'a1',
  user_id: 'u1',
  attempt: 1,
  content_text: 'my work',
  content_url: null,
  file_path: null,
  status: 'graded',
  score: 40,
  feedback: null,
  graded_at: null,
  submitted_at: '2026-10-01T00:00:00Z',
  ...over,
})
const detail = (type: 'quiz' | 'submission', submissions: Submission[] = [], over = {}) => ({
  assignment: {
    ...assignment('a1', { type, title: 'My assignment', instructions: 'Do the thing', ...over }),
    modules: { title: 'HTML', stack_id: 'fe' },
  },
  questions: type === 'quiz' ? questions : [],
  submissions,
  extraAttempts: 0,
})
const show = () =>
  renderWithProviders(
    <Routes>
      <Route path="/dashboard/stack/assignments/:assignmentId" element={<AssignmentPage />} />
    </Routes>,
    '/dashboard/stack/assignments/a1',
  )

describe('AssignmentPage', () => {
  beforeEach(() => {
    learning.current = {
      isPending: false,
      error: null,
      membership: { status: 'active' },
      states: [moduleState('m1', { assignment_id: 'a1' })],
      refetch: vi.fn(),
    }
    vi.mocked(api.submitQuiz).mockReset()
    vi.mocked(api.submitWork).mockReset().mockResolvedValue(undefined)
  })

  describe('quiz', () => {
    it('cannot be submitted until every question is answered', async () => {
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(detail('quiz'))
      show()
      const submit = await screen.findByRole('button', { name: 'Submit answers' })
      expect(submit).toBeDisabled()
      await userEvent.click(screen.getByLabelText('A language'))
      expect(submit).toBeDisabled()
      await userEvent.click(screen.getByLabelText('Styles'))
      expect(submit).toBeEnabled()
    })

    it("sends the chosen answers and shows the server's result", async () => {
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(detail('quiz'))
      vi.mocked(api.submitQuiz).mockResolvedValue({ score: 100, max_score: 100, passed: true })
      show()
      await userEvent.click(await screen.findByLabelText('A language'))
      await userEvent.click(screen.getByLabelText('Styles'))
      await userEvent.click(screen.getByRole('button', { name: 'Submit answers' }))
      expect(await screen.findByText('You passed!')).toBeInTheDocument()
      expect(api.submitQuiz).toHaveBeenCalledWith('a1', [0, 0])
    })

    it('encourages another try after a failing score', async () => {
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(detail('quiz'))
      vi.mocked(api.submitQuiz).mockResolvedValue({ score: 0, max_score: 100, passed: false })
      show()
      await userEvent.click(await screen.findByLabelText('A fruit'))
      await userEvent.click(screen.getByLabelText('Data'))
      await userEvent.click(screen.getByRole('button', { name: 'Submit answers' }))
      expect(await screen.findByText('Not quite yet')).toBeInTheDocument()
    })
  })

  describe('project', () => {
    it('asks for something to submit', async () => {
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(detail('submission'))
      show()
      await userEvent.click(await screen.findByRole('button', { name: 'Submit' }))
      expect(await screen.findByText('Add your answer, a link or a file.')).toBeInTheDocument()
      expect(api.submitWork).not.toHaveBeenCalled()
    })

    it('submits text and a link', async () => {
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(detail('submission'))
      show()
      await userEvent.type(await screen.findByLabelText('Your answer'), 'Here it is')
      await userEvent.type(screen.getByLabelText('Link (optional)'), 'https://github.com/me/repo')
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
      await waitFor(() =>
        expect(api.submitWork).toHaveBeenCalledWith('fe', 'u1', 'a1', {
          text: 'Here it is',
          url: 'https://github.com/me/repo',
          file: null,
        }),
      )
    })

    it('rejects a link that is not http(s)', async () => {
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(detail('submission'))
      show()
      await userEvent.type(await screen.findByLabelText('Link (optional)'), 'javascript:alert(1)')
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
      expect(await screen.findByText(/starting with http/)).toBeInTheDocument()
      expect(api.submitWork).not.toHaveBeenCalled()
    })

    it('hides the form while a submission awaits review', async () => {
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(
        detail('submission', [sub({ status: 'submitted', score: null })]),
      )
      show()
      expect(await screen.findByText(/waiting for your stack lead/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
    })

    it('shows feedback and lets the student submit again after a resubmission request', async () => {
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(
        detail('submission', [
          sub({ status: 'needs_resubmission', score: null, feedback: 'Add tests' }),
        ]),
      )
      show()
      expect(await screen.findAllByText(/Add tests/)).not.toHaveLength(0)
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
      expect(screen.getByText('Submit again')).toBeInTheDocument()
    })

    it('congratulates a pass and offers no further attempts', async () => {
      learning.current = {
        ...(learning.current as object),
        states: [
          moduleState('m1', { assignment_id: 'a1', assignment_passed: true, best_score: 85 }),
        ],
      }
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(
        detail('submission', [sub({ score: 85 })]),
      )
      show()
      expect(
        await screen.findByText(/You passed this assignment with 85 \/ 100/),
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
    })

    it('stops when all attempts are used', async () => {
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(
        detail('submission', [sub()], { max_attempts: 1 }),
      )
      show()
      expect(await screen.findByText(/used all your attempts/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
    })

    it('counts extra attempts granted by the lead', async () => {
      vi.mocked(api.fetchAssignmentDetail).mockResolvedValue({
        ...detail('submission', [sub()], { max_attempts: 1 }),
        extraAttempts: 1,
      })
      show()
      expect(await screen.findByText(/1 of 2 attempts used/)).toBeInTheDocument()
      expect(screen.queryByText(/used all your attempts/)).not.toBeInTheDocument()
    })
  })

  it('explains a locked or missing assignment', async () => {
    vi.mocked(api.fetchAssignmentDetail).mockResolvedValue(null)
    show()
    expect(await screen.findByText('This assignment is not available')).toBeInTheDocument()
  })
})
