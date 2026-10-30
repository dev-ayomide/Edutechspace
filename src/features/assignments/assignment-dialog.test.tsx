import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { assignment } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { AssignmentDialog } from './assignment-dialog'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('./api', () => ({
  saveAssignment: vi.fn(),
  fetchQuizForEditing: vi.fn(),
  deleteAssignment: vi.fn(),
}))

function open(existing = null as ReturnType<typeof assignment> | null) {
  const onSaved = vi.fn()
  renderWithProviders(
    <AssignmentDialog
      open
      onOpenChange={vi.fn()}
      moduleId="m1"
      moduleTitle="HTML"
      assignment={existing}
      onSaved={onSaved}
    />,
  )
  return onSaved
}

describe('AssignmentDialog', () => {
  beforeEach(() => vi.mocked(api.saveAssignment).mockReset().mockResolvedValue(undefined))

  it('saves a draft quiz with only a title', async () => {
    const onSaved = open()
    await userEvent.type(screen.getByLabelText('Title'), 'HTML quiz')
    await userEvent.click(screen.getByRole('button', { name: 'Add assignment' }))
    await waitFor(() => expect(api.saveAssignment).toHaveBeenCalled())
    expect(vi.mocked(api.saveAssignment).mock.calls[0]![1]).toMatchObject({
      title: 'HTML quiz',
      type: 'quiz',
      is_published: false,
      pass_mark: '60',
    })
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
  })

  it('will not publish a quiz without questions', async () => {
    open()
    await userEvent.type(screen.getByLabelText('Title'), 'HTML quiz')
    await userEvent.click(screen.getByLabelText(/Published/))
    await userEvent.click(screen.getByRole('button', { name: 'Add assignment' }))
    expect(
      await screen.findByText('Add at least one question before publishing'),
    ).toBeInTheDocument()
    expect(api.saveAssignment).not.toHaveBeenCalled()
  })

  it('builds a question with options and a correct answer', async () => {
    open()
    await userEvent.type(screen.getByLabelText('Title'), 'HTML quiz')
    await userEvent.click(screen.getByRole('button', { name: 'Add question' }))
    await userEvent.type(screen.getByLabelText('Question'), 'What is HTML?')
    await userEvent.type(screen.getByLabelText('Option 1'), 'A fruit')
    await userEvent.type(screen.getByLabelText('Option 2'), 'A language')
    await userEvent.click(screen.getByLabelText('Option 2 is correct'))
    await userEvent.click(screen.getByRole('button', { name: 'Add option' }))
    await userEvent.type(screen.getByLabelText('Option 3'), 'A car')
    await userEvent.click(screen.getByLabelText(/Published/))
    await userEvent.click(screen.getByRole('button', { name: 'Add assignment' }))
    await waitFor(() => expect(api.saveAssignment).toHaveBeenCalled())
    const input = vi.mocked(api.saveAssignment).mock.calls[0]![1]
    expect(input.is_published).toBe(true)
    expect(input.questions[0]).toMatchObject({
      prompt: 'What is HTML?',
      correct_index: 1,
      options: [{ text: 'A fruit' }, { text: 'A language' }, { text: 'A car' }],
    })
  })

  it('requires every option to be filled in', async () => {
    open()
    await userEvent.type(screen.getByLabelText('Title'), 'Quiz')
    await userEvent.click(screen.getByRole('button', { name: 'Add question' }))
    await userEvent.type(screen.getByLabelText('Question'), 'Q?')
    await userEvent.type(screen.getByLabelText('Option 1'), 'Only one')
    await userEvent.click(screen.getByRole('button', { name: 'Add assignment' }))
    expect(await screen.findByText('Fill in this option')).toBeInTheDocument()
    expect(api.saveAssignment).not.toHaveBeenCalled()
  })

  it('keeps at least two options', async () => {
    open()
    await userEvent.click(screen.getByRole('button', { name: 'Add question' }))
    expect(screen.getByRole('button', { name: 'Remove option 1' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Add option' }))
    expect(screen.getByRole('button', { name: 'Remove option 1' })).toBeEnabled()
  })

  it('shows no questions for a project and needs instructions to publish', async () => {
    open()
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'submission')
    expect(screen.queryByRole('button', { name: 'Add question' })).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Title'), 'Portfolio')
    await userEvent.click(screen.getByLabelText(/Published/))
    await userEvent.click(screen.getByRole('button', { name: 'Add assignment' }))
    expect(await screen.findByText('Write the instructions before publishing')).toBeInTheDocument()
  })

  it('loads an existing quiz with its answer key and locks the type', async () => {
    vi.mocked(api.fetchQuizForEditing).mockResolvedValue([
      { prompt: 'Existing?', options: ['yes', 'no'], correct_index: 1, points: 2 },
    ])
    open(assignment('a1', { title: 'Old quiz' }))
    expect(await screen.findByDisplayValue('Existing?')).toBeInTheDocument()
    expect(screen.getByLabelText('Option 2 is correct')).toBeChecked()
    expect(screen.getByLabelText('Type')).toBeDisabled()
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Save changes' }),
    ).toBeInTheDocument()
  })
})
