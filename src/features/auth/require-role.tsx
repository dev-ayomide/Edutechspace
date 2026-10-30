import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/states'
import type { Role } from '@/types/domain'
import { useAuth } from './auth-context'
import { canAccess, homeForRole } from './roles'

/**
 * Route guard. This is UX only: the real enforcement is Postgres RLS.
 * Signed-out users go to /login; signed-in users without access go to their own home.
 */
export function RequireRole({ roles }: { roles: readonly Role[] }) {
  const { status, role } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <LoadingState />
      </div>
    )
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!canAccess(role, roles)) {
    return <Navigate to={role ? homeForRole(role) : '/login'} replace />
  }
  return <Outlet />
}
