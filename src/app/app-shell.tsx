import { LogOut } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { homeForRole } from '@/features/auth/roles'
import { cn } from '@/lib/utils'
import { areaLabel, navByRole } from '@/routes/nav'
import type { Role } from '@/types/domain'
import { ThemeToggle } from './theme'
import { useDocumentTitle } from './use-document-title'

const skipLink =
  'bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2'

/** Student top bar: text tabs with an underline for the current page, like the big course platforms. */
const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex h-16 items-center border-b px-1 text-sm font-semibold whitespace-nowrap transition-colors',
    isActive
      ? 'border-foreground text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  )

/** Lead and admin sidebar: quiet list, current page marked with a tint and a bar. */
const sideClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-10 items-center rounded-md px-3 text-sm font-semibold whitespace-nowrap transition-colors',
    isActive
      ? 'bg-primary/10 text-primary shadow-[inset_3px_0_0_var(--primary)]'
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
      <Link
        to={profile ? `${homeForRole(profile.role)}/profile` : '/'}
        className="flex items-center gap-2 rounded-full"
        aria-label="Your profile"
      >
        <span className="hidden max-w-40 truncate text-sm font-semibold text-foreground sm:block">
          {profile?.full_name ?? profile?.email}
        </span>
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground"
        >
          {initials}
        </span>
      </Link>
      <ThemeToggle />
      <Button variant="ghost" size="sm" onClick={() => void signOut()}>
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
  useDocumentTitle()
  const items = navByRole[role]

  if (role === 'student') {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <a href="#main" className={skipLink}>
          Skip to content
        </a>
        <header className="sticky top-0 z-30 border-b bg-background">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 px-4 sm:px-6">
            <Link to="/" aria-label="RUNTech Space home" className="flex h-16 items-center">
              <Logo className="[&_img]:h-8" />
            </Link>
            <nav
              aria-label={`${areaLabel[role]} navigation`}
              className="order-3 -mx-4 w-[calc(100%+2rem)] overflow-x-auto border-t px-4 md:order-none md:mx-0 md:w-auto md:border-t-0 md:px-0"
            >
              <ul className="flex gap-6">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} className={tabClass}>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="ml-auto flex h-16 items-center">
              <UserBar />
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 md:py-10">
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
      <aside className="border-b bg-background md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 md:block md:py-5">
          <Link to="/" aria-label="RUNTech Space home">
            <Logo className="[&_img]:h-8" />
          </Link>
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase md:mt-6 md:px-3">
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
                <NavLink to={item.to} end={item.end} className={sideClass}>
                  <item.icon className="mr-3 size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b bg-background px-4">
          <UserBar />
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
