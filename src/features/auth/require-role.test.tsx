import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Role } from '@/types/domain'
import { RequireRole } from './require-role'

const auth = vi.hoisted(() => ({
  current: { status: 'unauthenticated', role: undefined } as {
    status: string
    role: Role | undefined
  },
}))
vi.mock('./auth-context', () => ({ useAuth: () => auth.current }))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/dashboard" element={<p>student home</p>} />
        <Route path="/lead" element={<p>lead home</p>} />
        <Route element={<RequireRole roles={['admin']} />}>
          <Route path="/admin" element={<p>admin area</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireRole', () => {
  it('sends signed-out visitors to the login page', () => {
    auth.current = { status: 'unauthenticated', role: undefined }
    renderAt('/admin')
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('sends a student away from the admin area to their own home', () => {
    auth.current = { status: 'authenticated', role: 'student' }
    renderAt('/admin')
    expect(screen.getByText('student home')).toBeInTheDocument()
    expect(screen.queryByText('admin area')).not.toBeInTheDocument()
  })

  it('sends a lead away from the admin area to their own home', () => {
    auth.current = { status: 'authenticated', role: 'stack_lead' }
    renderAt('/admin')
    expect(screen.getByText('lead home')).toBeInTheDocument()
  })

  it('lets an admin in', () => {
    auth.current = { status: 'authenticated', role: 'admin' }
    renderAt('/admin')
    expect(screen.getByText('admin area')).toBeInTheDocument()
  })

  it('shows a loading state while the session resolves', () => {
    auth.current = { status: 'loading', role: undefined }
    renderAt('/admin')
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })
})
