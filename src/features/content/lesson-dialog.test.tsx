import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render'
import { LessonDialog } from './lesson-dialog'
import { saveLessonWithFile } from './save-lesson'

vi.mock('./save-lesson', () => ({ saveLessonWithFile: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function open(onSaved = vi.fn()) {
  renderWithProviders(
    <LessonDialog
      open
      onOpenChange={vi.fn()}
      stackId="s"
      moduleId="m"
      lesson={null}
      onSaved={onSaved}
    />,
  )
  return onSaved
}

describe('LessonDialog', () => {
  beforeEach(() => vi.mocked(saveLessonWithFile).mockReset().mockResolvedValue(undefined))

  it('saves a draft with only a title', async () => {
    const onSaved = open()
    await userEvent.type(screen.getByLabelText('Title'), 'Intro to HTML')
    await userEvent.click(screen.getByRole('button', { name: 'Add lesson' }))
    await waitFor(() => expect(saveLessonWithFile).toHaveBeenCalled())
    expect(vi.mocked(saveLessonWithFile).mock.calls[0]![0].input).toMatchObject({
      title: 'Intro to HTML',
      is_published: false,
    })
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
  })

  it('will not publish a lesson that has no content', async () => {
    open()
    await userEvent.type(screen.getByLabelText('Title'), 'Intro')
    await userEvent.click(screen.getByLabelText(/Published/))
    await userEvent.click(screen.getByRole('button', { name: 'Add lesson' }))
    expect(await screen.findByText('Add a link before publishing')).toBeInTheDocument()
    expect(saveLessonWithFile).not.toHaveBeenCalled()
  })

  it('shows a text area for written lessons instead of a link', async () => {
    open()
    expect(screen.getByLabelText('Link')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Lesson type'), 'text')
    expect(screen.getByLabelText('Lesson text')).toBeInTheDocument()
    expect(screen.queryByLabelText('Link')).not.toBeInTheDocument()
  })

  it('rejects a file of the wrong type', async () => {
    open()
    await userEvent.selectOptions(screen.getByLabelText('Lesson type'), 'pdf')
    await userEvent.click(screen.getByLabelText('Upload a file'))
    const input = screen.getByLabelText('File')
    await userEvent.upload(input, new File(['x'], 'pic.png', { type: 'image/png' }), {
      applyAccept: false,
    })
    expect(await screen.findByText('Upload a PDF file.')).toBeInTheDocument()
  })

  it('accepts a PDF and publishes it', async () => {
    open()
    await userEvent.type(screen.getByLabelText('Title'), 'Cheat sheet')
    await userEvent.selectOptions(screen.getByLabelText('Lesson type'), 'pdf')
    await userEvent.click(screen.getByLabelText('Upload a file'))
    await userEvent.upload(
      screen.getByLabelText('File'),
      new File(['x'], 'sheet.pdf', { type: 'application/pdf' }),
    )
    await userEvent.click(screen.getByLabelText(/Published/))
    await userEvent.click(screen.getByRole('button', { name: 'Add lesson' }))
    await waitFor(() => expect(saveLessonWithFile).toHaveBeenCalled())
    const args = vi.mocked(saveLessonWithFile).mock.calls[0]![0]
    expect(args.file?.name).toBe('sheet.pdf')
    expect(args.input.is_published).toBe(true)
  })
})
