import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ModuleWithLessons } from '@/types/domain'
import { renderWithProviders } from '@/test/render'
import * as api from './api'
import { ContentPage } from './content-page'

vi.mock('./api', async (orig) => ({
  ...(await orig<typeof api>()),
  listModulesWithLessons: vi.fn(),
  reorderModules: vi.fn(),
  reorderLessons: vi.fn(),
  setModulePublished: vi.fn(),
  setLessonPublished: vi.fn(),
  deleteModule: vi.fn(),
}))
vi.mock('@/features/lead/use-my-stacks', () => ({
  useMyStacks: () => ({
    stacks: [{ id: 'fe', name: 'Frontend Development' }],
    selected: { id: 'fe', name: 'Frontend Development' },
    select: vi.fn(),
    isPending: false,
    error: null,
  }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const lesson = (id: string, title: string, order: number, published: boolean) => ({
  id,
  module_id: 'm1',
  title,
  description: null,
  lesson_type: 'text' as const,
  content_url: null,
  content_path: null,
  content_text: 'x',
  duration_minutes: null,
  order_index: order,
  is_required: true,
  is_published: published,
})
const modules: ModuleWithLessons[] = [
  {
    id: 'm1',
    stack_id: 'fe',
    title: 'HTML',
    description: null,
    order_index: 1,
    is_published: true,
    assignments: [],
    lessons: [lesson('l1', 'Tags', 1, true), lesson('l2', 'Forms', 2, false)],
  },
  {
    id: 'm2',
    stack_id: 'fe',
    title: 'CSS',
    description: null,
    order_index: 2,
    is_published: false,
    assignments: [],
    lessons: [],
  },
]

describe('ContentPage', () => {
  beforeEach(() => {
    vi.mocked(api.listModulesWithLessons).mockResolvedValue(modules)
    for (const fn of [
      api.reorderModules,
      api.reorderLessons,
      api.setModulePublished,
      api.setLessonPublished,
      api.deleteModule,
    ]) {
      vi.mocked(fn).mockReset().mockResolvedValue(undefined)
    }
  })

  it('shows modules and lessons with their draft or published state', async () => {
    renderWithProviders(<ContentPage />)
    expect(await screen.findByText('HTML')).toBeInTheDocument()
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getAllByText('Draft').length).toBe(2) // Forms lesson + CSS module
    expect(screen.getByText('No lessons in this module yet.')).toBeInTheDocument()
  })

  it('cannot move the first module up or the last one down', async () => {
    renderWithProviders(<ContentPage />)
    await screen.findByText('HTML')
    expect(screen.getByRole('button', { name: 'Move module HTML up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move module CSS down' })).toBeDisabled()
  })

  it('reorders modules with the full new order', async () => {
    renderWithProviders(<ContentPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Move module HTML down' }))
    await waitFor(() => expect(api.reorderModules).toHaveBeenCalledWith('fe', ['m2', 'm1']))
  })

  it('reorders lessons within a module', async () => {
    renderWithProviders(<ContentPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Move lesson Forms up' }))
    await waitFor(() => expect(api.reorderLessons).toHaveBeenCalledWith('m1', ['l2', 'l1']))
  })

  it('publishes a draft module', async () => {
    renderWithProviders(<ContentPage />)
    await userEvent.click(await screen.findByRole('button', { name: /Publish module CSS/ }))
    await waitFor(() => expect(api.setModulePublished).toHaveBeenCalledWith('m2', true))
  })

  it('asks before deleting a module', async () => {
    renderWithProviders(<ContentPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete module CSS' }))
    expect(api.deleteModule).not.toHaveBeenCalled()
    expect(
      await screen.findByText(/"CSS" and all of its lessons will be permanently deleted/),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(api.deleteModule).toHaveBeenCalledWith('m2'))
  })
})
