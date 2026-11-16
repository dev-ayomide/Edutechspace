import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { ExamBuilderPage } from './exam-builder-page'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  fetchExamForEditing: vi.fn(),
  createExam: vi.fn(),
  saveExam: vi.fn(),
}))
vi.mock('@/features/lead/use-my-stacks', () => ({
  useMyStacks: () => ({
    stacks: [{ id: 'fe', name: 'Frontend' }],
    selected: { id: 'fe', name: 'Frontend' },
    select: vi.fn(),
    isPending: false,
    error: null,
  }),
}))

const exam = {
  id: 'e1',
  stack_id: 'fe',
  title: 'Final exam',
  instructions: null,
  time_limit_minutes: 45,
  pass_mark: 70,
  max_attempts: 2,
  cooldown_hours: 12,
  is_published: false,
}

describe('ExamBuilderPage', () => {
  beforeEach(() => {
    vi.mocked(api.saveExam).mockReset().mockResolvedValue(undefined)
    vi.mocked(api.createExam).mockReset().mockResolvedValue(undefined)
  })

  it('offers to create the exam when there is none', async () => {
    vi.mocked(api.fetchExamForEditing).mockResolvedValue(null)
    renderWithProviders(<ExamBuilderPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Create the exam' }))
    await waitFor(() => expect(api.createExam).toHaveBeenCalledWith('fe'))
  })

  it('loads the settings and questions with the answer key', async () => {
    vi.mocked(api.fetchExamForEditing).mockResolvedValue({
      exam,
      questions: [{ prompt: 'Existing?', options: ['yes', 'no'], correct_index: 1, points: 2 }],
    })
    renderWithProviders(<ExamBuilderPage />)
    expect(await screen.findByDisplayValue('45')).toBeInTheDocument()
    expect(screen.getByDisplayValue('70')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing?')).toBeInTheDocument()
    expect(screen.getByLabelText('Option 2 is correct')).toBeChecked()
  })

  it('will not publish an exam without questions', async () => {
    vi.mocked(api.fetchExamForEditing).mockResolvedValue({ exam, questions: [] })
    renderWithProviders(<ExamBuilderPage />)
    await userEvent.click(await screen.findByLabelText(/Published/))
    await userEvent.click(screen.getByRole('button', { name: 'Save exam' }))
    expect(
      await screen.findByText('Add at least one question before publishing'),
    ).toBeInTheDocument()
    expect(api.saveExam).not.toHaveBeenCalled()
  })

  it('saves settings and a new question', async () => {
    vi.mocked(api.fetchExamForEditing).mockResolvedValue({ exam, questions: [] })
    renderWithProviders(<ExamBuilderPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Add question' }))
    await userEvent.type(screen.getByLabelText('Question'), 'What is HTML?')
    await userEvent.type(screen.getByLabelText('Option 1'), 'Markup')
    await userEvent.type(screen.getByLabelText('Option 2'), 'Fruit')
    await userEvent.click(screen.getByLabelText(/Published/))
    await userEvent.click(screen.getByRole('button', { name: 'Save exam' }))
    await waitFor(() => expect(api.saveExam).toHaveBeenCalled())
    const [id, input] = vi.mocked(api.saveExam).mock.calls[0]!
    expect(id).toBe('e1')
    expect(input).toMatchObject({ pass_mark: '70', is_published: true })
    expect(input.questions[0]).toMatchObject({ prompt: 'What is HTML?', correct_index: 0 })
  })

  it('validates the numeric settings', async () => {
    vi.mocked(api.fetchExamForEditing).mockResolvedValue({ exam, questions: [] })
    renderWithProviders(<ExamBuilderPage />)
    const pass = await screen.findByLabelText('Pass mark (%)')
    await userEvent.clear(pass)
    await userEvent.type(pass, '150')
    await userEvent.click(screen.getByRole('button', { name: 'Save exam' }))
    expect(await screen.findByText('Enter a percentage from 1 to 100')).toBeInTheDocument()
    expect(api.saveExam).not.toHaveBeenCalled()
  })
})
