import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { ReviewPage } from './review-page'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  listProjectSubmissions: vi.fn(),
  gradeSubmission: vi.fn(),
}))
vi.mock('@/features/learning/api', () => ({ getSubmissionFileUrl: vi.fn() }))

const item = (
  id: string,
  name: string,
  status: api.ReviewItem['status'],
  over: Partial<api.ReviewItem> = {},
): api.ReviewItem => ({
  id,
  assignment_id: 'a1',
  user_id: `u-${id}`,
  attempt: 1,
  content_text: `${name}'s work`,
  content_url: 'https://github.com/x/y',
  file_path: null,
  status,
  score: status === 'graded' ? 70 : null,
  feedback: status === 'graded' ? 'Nice' : null,
  graded_at: null,
  submitted_at: '2026-10-01T00:00:00Z',
  profiles: { full_name: name, email: `${id}@x.test` },
  assignments: {
    title: 'Portfolio',
    max_score: 100,
    pass_mark: 60,
    instructions: 'Build a site',
    modules: { title: 'HTML', stacks: { name: 'Frontend' } },
  },
  ...over,
})

describe('ReviewPage', () => {
  beforeEach(() => {
    vi.mocked(api.listProjectSubmissions).mockResolvedValue([
      item('s1', 'Ada', 'submitted'),
      item('s2', 'Bob', 'graded'),
    ])
    vi.mocked(api.gradeSubmission).mockReset().mockResolvedValue(undefined)
  })

  it('queues only submissions that need review by default', async () => {
    renderWithProviders(<ReviewPage />)
    expect(await screen.findByText('Ada')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  async function openReview() {
    renderWithProviders(<ReviewPage />)
    await userEvent.click(await screen.findByRole('button', { name: /Review Ada's submission/ }))
    return await screen.findByRole('dialog')
  }

  it("shows the student's work in the review dialog", async () => {
    const dialog = await openReview()
    expect(within(dialog).getByText("Ada's work")).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: /Open link/ })).toHaveAttribute(
      'href',
      'https://github.com/x/y',
    )
  })

  it.each(['', '101', '-1', '7.5', 'abc'])('rejects the score "%s"', async (value) => {
    const dialog = await openReview()
    if (value) await userEvent.type(within(dialog).getByLabelText(/Score/), value)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save grade' }))
    expect(
      await within(dialog).findByText('Enter a whole number from 0 to 100.'),
    ).toBeInTheDocument()
    expect(api.gradeSubmission).not.toHaveBeenCalled()
  })

  it('saves a grade with feedback', async () => {
    const dialog = await openReview()
    await userEvent.type(within(dialog).getByLabelText(/Score/), '85')
    await userEvent.type(within(dialog).getByLabelText(/Feedback/), 'Great work')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save grade' }))
    await waitFor(() =>
      expect(api.gradeSubmission).toHaveBeenCalledWith('s1', 85, 'Great work', false),
    )
  })

  it('requests a resubmission without needing a score', async () => {
    const dialog = await openReview()
    await userEvent.type(within(dialog).getByLabelText(/Feedback/), 'Add tests')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Request resubmission' }))
    await waitFor(() =>
      expect(api.gradeSubmission).toHaveBeenCalledWith('s1', null, 'Add tests', true),
    )
  })

  it('has an empty state', async () => {
    vi.mocked(api.listProjectSubmissions).mockResolvedValue([])
    renderWithProviders(<ReviewPage />)
    expect(await screen.findByText('Nothing to review')).toBeInTheDocument()
  })
})
