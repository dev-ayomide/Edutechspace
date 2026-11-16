import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { lesson, moduleWith } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { LessonPage } from './lesson-page'

const learning = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('./hooks', () => ({ useMyLearning: () => learning.current }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  fetchLesson: vi.fn(),
  completeLesson: vi.fn(),
  getLessonFileUrl: vi.fn(),
}))

const withModule = (l: ReturnType<typeof lesson>) => ({
  ...l,
  modules: { title: 'HTML', stack_id: 'fe' },
})
const show = () =>
  renderWithProviders(
    <Routes>
      <Route path="/dashboard/stack/lessons/:lessonId" element={<LessonPage />} />
    </Routes>,
    '/dashboard/stack/lessons/l1',
  )

describe('LessonPage', () => {
  beforeEach(() => {
    learning.current = {
      isPending: false,
      error: null,
      membership: { status: 'active' },
      completedLessonIds: new Set<string>(),
      modules: [moduleWith('m1', { lessons: [lesson('l1'), lesson('l2')] })],
    }
    vi.mocked(api.completeLesson).mockReset().mockResolvedValue(undefined)
  })

  it('renders written lessons paragraph by paragraph', async () => {
    vi.mocked(api.fetchLesson).mockResolvedValue(
      withModule(lesson('l1', { content_text: 'First paragraph\n\nSecond paragraph' })),
    )
    show()
    expect(await screen.findByText('First paragraph')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph')).toBeInTheDocument()
  })

  it('marks a lesson complete', async () => {
    vi.mocked(api.fetchLesson).mockResolvedValue(withModule(lesson('l1')))
    show()
    await userEvent.click(await screen.findByRole('button', { name: 'Mark as complete' }))
    await waitFor(() => expect(api.completeLesson).toHaveBeenCalledWith('l1'))
  })

  it('links to the next lesson and hides the button once completed', async () => {
    learning.current = { ...(learning.current as object), completedLessonIds: new Set(['l1']) }
    vi.mocked(api.fetchLesson).mockResolvedValue(withModule(lesson('l1')))
    show()
    expect(await screen.findByText('Completed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark as complete' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Next lesson/ })).toHaveAttribute(
      'href',
      '/dashboard/stack/lessons/l2',
    )
  })

  it('embeds recognised video links and never embeds unknown hosts', async () => {
    vi.mocked(api.fetchLesson).mockResolvedValue(
      withModule(
        lesson('l1', {
          lesson_type: 'video',
          content_text: null,
          content_url: 'https://youtu.be/dQw4w9WgXcQ',
        }),
      ),
    )
    show()
    const frame = await screen.findByTitle('Lesson l1')
    expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('offers a plain link for unknown video hosts instead of an iframe', async () => {
    vi.mocked(api.fetchLesson).mockResolvedValue(
      withModule(
        lesson('l1', {
          lesson_type: 'video',
          content_text: null,
          content_url: 'https://example.com/clip',
        }),
      ),
    )
    show()
    const link = await screen.findByRole('link', { name: /Open the video/ })
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(screen.queryByTitle('Lesson l1')).not.toBeInTheDocument()
  })

  it('does not let completed students record new progress', async () => {
    learning.current = { ...(learning.current as object), membership: { status: 'completed' } }
    vi.mocked(api.fetchLesson).mockResolvedValue(withModule(lesson('l1')))
    show()
    await screen.findByText('Hello world')
    expect(screen.queryByRole('button', { name: 'Mark as complete' })).not.toBeInTheDocument()
  })

  it('explains an unavailable (locked) lesson', async () => {
    vi.mocked(api.fetchLesson).mockResolvedValue(null)
    show()
    expect(await screen.findByText('This lesson is not available')).toBeInTheDocument()
  })
})
