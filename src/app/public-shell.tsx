import { Link, Outlet } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { homeForRole } from '@/features/auth/roles'
import { ThemeToggle } from './theme'

export function PublicShell() {
  const { status, role } = useAuth()
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="RUNTech Space home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-2">
            <ThemeToggle />
            {status === 'authenticated' && role ? (
              <Button asChild size="sm">
                <Link to={homeForRole(role)}>Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/join">Join a stack</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} RUNTech Space. All rights reserved.
      </footer>
    </div>
  )
}
