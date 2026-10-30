import type { Role } from '@/types/domain'

/** Where each role lands after signing in. */
export function homeForRole(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'stack_lead':
      return '/lead'
    case 'student':
      return '/dashboard'
  }
}

export function canAccess(role: Role | undefined, allowed: readonly Role[]): boolean {
  return role !== undefined && allowed.includes(role)
}
