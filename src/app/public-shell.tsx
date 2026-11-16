import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { homeForRole } from '@/features/auth/roles'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme'
import { useDocumentTitle } from './use-document-title'

const skipLink =
  'bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2'

const navLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'hidden px-2 py-2 text-sm font-semibold transition-colors hover:text-primary md:block',
    isActive ? 'text-foreground' : 'text-muted-foreground',
  )

export function PublicShell() {
  useDocumentTitle()
  const { status, role } = useAuth()
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className={skipLink}>
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="RUNTech Space home" className="shrink-0">
            <Logo className="[&_img]:h-8" />
          </Link>
          <nav aria-label="Main" className="ml-2 flex items-center gap-2">
            <NavLink to="/stacks" className={navLink}>
              Explore stacks
            </NavLink>
            <NavLink to="/verify" className={navLink}>
              Verify a certificate
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {status === 'authenticated' && role ? (
              <Button asChild size="sm">
                <Link to={homeForRole(role)}>My learning</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link to="/join">Apply to join</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-[#0f1118] text-sm text-[#b4b9c6]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="text-base font-bold text-white">RUNTech Space</p>
            <p className="mt-2 max-w-xs">Stack-led tech learning at Redeemer&apos;s University.</p>
          </div>
          <FooterColumn
            title="Learn"
            links={[
              ['/stacks', 'All stacks'],
              ['/#how', 'How it works'],
              ['/join', 'Apply to join'],
            ]}
          />
          <FooterColumn title="Certificates" links={[['/verify', 'Verify a certificate']]} />
          <FooterColumn
            title="Account"
            links={[
              ['/login', 'Sign in'],
              ['/forgot-password', 'Forgot password'],
            ]}
          />
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-5 text-xs sm:px-6">
            © {new Date().getFullYear()} RUNTech Space. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <nav aria-label={title}>
      <p className="mb-3 font-bold text-white">{title}</p>
      <ul className="grid gap-2">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
