export const ROLES = ['student', 'stack_lead', 'admin'] as const
export type Role = (typeof ROLES)[number]

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: Role
}
