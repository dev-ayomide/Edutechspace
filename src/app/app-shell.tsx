import { LogOut } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'
import { areaLabel, navByRole } from '@/routes/nav'
import type { Role } from '@/types/domain'
import { ThemeToggle } from './theme'

const skipLink =
  'bg-primary text-primary-foreground sr-only z-50 rounded-lg px-4 py-2 font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-11 items-center rounded-xl px-4 text-sm font-bold whitespace-nowrap transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )

function UserBar() {
  const { profile, signOut } = useAuth()
  const initials = (profile?.full_name ?? profile?.email ?? '?')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-40 truncate text-sm font-semibold text-foreground sm:block">
        {profile?.full_name ?? profile?.email}
      </span>
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-full border-2 border-outline bg-gold text-sm font-extrabold text-gold-foreground"
      >
        {initials}
      </span>
      <ThemeToggle />
      <Button variant="outline" size="sm" onClick={() => void signOut()}>
        <LogOut className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sign out</span>
        <span className="sr-only sm:hidden">Sign out</span>
      </Button>
    </div>
  )
}

/**
 * Shared shell for the student, lead and admin areas. Navigation comes from routes/nav.ts.
 * Students get a top tab bar (few destinations, content-first); leads and admins get a sidebar (many tools).
 */
export function AppShell({ role }: { role: Role }) {
  const items = navByRole[role]

  if (role === 'student') {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <a href="#main" className={skipLink}>
          Skip to content
        </a>
        <header className="border-b-2 border-outline bg-background">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
            <Link to="/" aria-label="RUNTech Space home">
              <Logo />
            </Link>
            <nav
              aria-label={`${areaLabel[role]} navigation`}
              className="order-3 -mx-1 w-full overflow-x-auto md:order-none md:mx-0 md:w-auto"
            >
              <ul className="flex gap-1 px-1">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} className={linkClass}>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <UserBar />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:py-10">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface md:flex-row">
      <a href="#main" className={skipLink}>
        Skip to content
      </a>
      <aside className="border-b-2 border-outline bg-background md:w-64 md:shrink-0 md:border-r-2 md:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 md:block md:py-5">
          <Link to="/" aria-label="RUNTech Space home">
            <Logo />
          </Link>
          <p className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold tracking-wide text-accent-soft-foreground uppercase md:mt-4 md:inline-block">
            {areaLabel[role]}
          </p>
        </div>
        <nav
          aria-label={`${areaLabel[role]} navigation`}
          className="overflow-x-auto px-2 pb-2 md:pb-4"
        >
          <ul className="flex gap-1 md:flex-col">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={linkClass}>
                  <item.icon className="mr-3 size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b-2 border-outline bg-background px-4">
          <UserBar />
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
