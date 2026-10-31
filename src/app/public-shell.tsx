import { Link, Outlet } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { homeForRole } from '@/features/auth/roles'
import { ThemeToggle } from './theme'
import { useDocumentTitle } from './use-document-title'

const skipLink =
  'bg-primary text-primary-foreground sr-only z-50 rounded-lg px-4 py-2 font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2'

export function PublicShell() {
  useDocumentTitle()
  const { status, role } = useAuth()
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className={skipLink}>
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b-2 border-outline bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-5">
          <Link to="/" aria-label="RUNTech Space home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1.5">
            <Link
              to="/verify"
              className="hidden px-3 text-sm font-semibold text-muted-foreground hover:text-foreground sm:block"
            >
              Verify a certificate
            </Link>
            <ThemeToggle />
            {status === 'authenticated' && role ? (
              <Button asChild size="sm">
                <Link to={homeForRole(role)}>Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
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
      <footer className="border-t-2 border-outline bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-10">
          <div>
            <p className="font-display text-xl font-extrabold">Learn. Grow. Build.</p>
            <p className="mt-1 text-sm opacity-80">
              © {new Date().getFullYear()} RUNTech Space. All rights reserved.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            <Link to="/join" className="hover:underline">
              Join a stack
            </Link>
            <Link to="/login" className="hover:underline">
              Sign in
            </Link>
            <Link to="/verify" className="hover:underline">
              Verify a certificate
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
