import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Role } from '@/types/domain'
import { fetchProfile, signOut as apiSignOut } from './api'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthValue {
  status: AuthStatus
  session: Session | null
  profile: Profile | null
  role: Role | undefined
  signOut: () => Promise<void>
}

// Exported for the dev-only screen preview (features/design/preview-page.tsx), which supplies a sample student.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionLoaded(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setSessionLoaded(true)
      if (!next) queryClient.clear()
    })
    return () => data.subscription.unsubscribe()
  }, [queryClient])

  const userId = session?.user.id
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  })

  const value = useMemo<AuthValue>(() => {
    const profile = profileQuery.data ?? null
    let status: AuthStatus = 'authenticated'
    if (!sessionLoaded || (userId && profileQuery.isPending)) status = 'loading'
    else if (!session) status = 'unauthenticated'
    return {
      status,
      session,
      profile,
      role: profile?.role,
      signOut: apiSignOut,
    }
  }, [session, sessionLoaded, userId, profileQuery.data, profileQuery.isPending])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
