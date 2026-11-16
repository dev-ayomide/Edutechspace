import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { expectAccessible } from '@/test/a11y'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { StackDetailPage } from './stack-detail-page'

vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  listStacks: vi.fn(),
  fetchStackOutline: vi.fn(),
}))

const show = (slug = 'frontend') =>
  renderWithProviders(
    <Routes>
      <Route path="/stacks/:slug" element={<StackDetailPage />} />
    </Routes>,
    `/stacks/${slug}`,
  )

const row = (over: Partial<api.OutlineRow>): api.OutlineRow => ({
  kind: 'module',
  module_number: 1,
  title: 'How the web works',
  description: null,
  lesson_count: 3,
  video_count: 2,
  reading_count: 1,
  total_minutes: 75,
  has_assignment: true,
  question_count: null,
  time_limit_minutes: null,
  ...over,
})

describe('StackDetailPage', () => {
  beforeEach(() => {
    vi.mocked(api.listStacks).mockResolvedValue([
      {
        id: 'fe',
        slug: 'frontend',
        name: 'Frontend Development',
        description: 'Build web interfaces.',
        is_active: true,
        created_at: '2026-10-01',
      },
    ])
  })

  it('shows the curriculum and a way to apply', async () => {
    vi.mocked(api.fetchStackOutline).mockResolvedValue([
      row({}),
      row({ module_number: 2, title: 'HTML', lesson_count: 4, total_minutes: 60 }),
      row({
        kind: 'exam',
        module_number: null,
        title: 'Final exam',
        question_count: 40,
        time_limit_minutes: 60,
      }),
    ])
    const { container } = show()
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Frontend Development' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('1. How the web works')).toBeInTheDocument()
    expect(screen.getByText('2 modules · 7 lessons · about 2 h 15 min')).toBeInTheDocument()
    expect(screen.getByText('Final exam')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Apply to this stack' })).toHaveAttribute(
      'href',
      '/join?stack=frontend',
    )
    await expectAccessible(container)
  })

  it('stays calm when the outline cannot be loaded', async () => {
    vi.mocked(api.fetchStackOutline).mockRejectedValue(new Error('missing function'))
    show()
    expect(await screen.findByText(/still preparing/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('handles an unknown stack', async () => {
    vi.mocked(api.fetchStackOutline).mockResolvedValue([])
    show('nope')
    expect(await screen.findByText("We couldn't find that stack")).toBeInTheDocument()
  })
})
