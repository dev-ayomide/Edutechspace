import { LogOut } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'
import { areaLabel, navByRole } from '@/routes/nav'
import type { Role } from '@/types/domain'
import { ThemeToggle } from './theme'

/** Shared shell for the student, lead and admin areas. Navigation comes from routes/nav.ts. */
export function AppShell({ role }: { role: Role }) {
  const { profile, signOut } = useAuth()
  const items = navByRole[role]

  return (
    <div className="flex min-h-dvh flex-col bg-surface md:flex-row">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <aside className="border-b bg-background md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 md:block md:py-5">
          <Link to="/" aria-label="RUNTech Space home">
            <Logo className="h-8" />
          </Link>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase md:mt-3">
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
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b bg-background px-4">
          <span className="mr-auto truncate text-sm text-muted-foreground md:mr-0">
            {profile?.full_name ?? profile?.email}
          </span>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
