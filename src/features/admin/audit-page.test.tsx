import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import * as stacksApi from '@/features/stacks/api'
import * as api from './api'
import { AuditPage } from './audit-page'

vi.mock('./api', async (orig) => ({ ...(await orig<typeof api>()), listAuditLog: vi.fn() }))
vi.mock('@/features/stacks/api', async (orig) => ({
  ...(await orig<typeof stacksApi>()),
  listStacks: vi.fn(),
}))

describe('AuditPage', () => {
  beforeEach(() => {
    vi.mocked(stacksApi.listStacks).mockResolvedValue([
      {
        id: 's1',
        name: 'Frontend',
        slug: 'frontend',
        description: null,
        is_active: true,
        created_at: '',
      },
    ])
  })

  it('lists actions in plain language with who did them', async () => {
    vi.mocked(api.listAuditLog).mockResolvedValue([
      {
        id: 1,
        actor_id: 'u1',
        actor: 'Lee Lead',
        action: 'grant_attempts',
        entity: 'assignment',
        entity_id: 'a1',
        meta: { stack_id: 's1', user_id: 'x', extra: 1 },
        created_at: '2026-11-15T10:00:00Z',
      },
      {
        id: 2,
        actor_id: null,
        actor: null,
        action: 'issue_certificate',
        entity: 'certificate',
        entity_id: 'c1',
        meta: {},
        created_at: '2026-11-14T10:00:00Z',
      },
    ])
    renderWithProviders(<AuditPage />)
    expect(await screen.findByText('Gave extra attempts')).toBeInTheDocument()
    expect(screen.getByText('Lee Lead')).toBeInTheDocument()
    expect(await screen.findByText('Frontend · extra: 1')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('has an empty state', async () => {
    vi.mocked(api.listAuditLog).mockResolvedValue([])
    renderWithProviders(<AuditPage />)
    expect(await screen.findByText('Nothing recorded yet')).toBeInTheDocument()
  })
})
