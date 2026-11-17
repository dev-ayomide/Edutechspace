import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { homeForRole } from '@/features/auth/roles'
import { cn } from '@/lib/utils'
import { SmoothScroll } from './smooth-scroll'
import { ThemeToggle } from './theme'
import { useDocumentTitle } from './use-document-title'

const skipLink =
  'bg-primary text-primary-foreground sr-only z-50 rounded-full px-4 py-2 font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2'

/** Main navigation. `section` links highlight while that part of the home page is on screen. */
const links = [
  { to: '/stacks', label: 'Stacks', section: 'stacks' },
  { to: '/#platform', label: 'The platform', section: 'platform' },
  { to: '/#certificate', label: 'Certificates', section: 'certificate' },
  { to: '/#faq', label: 'Questions', section: 'faq' },
] as const

/** Condensed once you scroll; tucks away while you scroll down, returns as soon as you scroll up. */
function useHeaderState() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    let anchor = last
    let dir = 0
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      const d = Math.sign(y - last)
      if (d && d !== dir) {
        dir = d
        anchor = y
      }
      if (y < 600) setHidden(false)
      else if (dir > 0 && y - anchor > 80) setHidden(true)
      else if (dir < 0 && anchor - y > 40) setHidden(false)
      last = y
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])
  return { scrolled, hidden }
}

/** Which nav link is "here": the route for /stacks, the section in view on the home page. */
function useActiveLink() {
  const { pathname } = useLocation()
  const [section, setSection] = useState<string | null>(null)
  useEffect(() => {
    if (pathname !== '/') return
    let ticking = false
    const check = () => {
      ticking = false
      const mid = innerHeight * 0.45
      const hit = links.find((l) => {
        const el = document.getElementById(l.section)
        if (!el) return false
        const r = el.getBoundingClientRect()
        return r.top < mid && r.bottom > mid
      })
      setSection(hit?.section ?? null)
    }
    const onScroll = () => {
      if (!ticking) requestAnimationFrame(check)
      ticking = true
    }
    check()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [pathname])
  if (pathname.startsWith('/stacks')) return 'stacks'
  return pathname === '/' ? section : null
}

export function PublicShell() {
  useDocumentTitle()
  const { status, role } = useAuth()
  const { scrolled, hidden } = useHeaderState()
  const active = useActiveLink()
  const [menu, setMenu] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  // slide the white pill to the active link
  useLayoutEffect(() => {
    const el = navRef.current?.querySelector<HTMLAnchorElement>(`[data-section="${active}"]`)
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null)
  }, [active])

  const signedIn = status === 'authenticated' && role

  return (
    <SmoothScroll>
      <div className="flex min-h-dvh flex-col">
        <a href="#main" className={skipLink}>
          Skip to content
        </a>
        <header
          className={cn(
            'sticky top-0 z-40 transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            scrolled &&
              'bg-background/80 shadow-[0_1px_0_var(--border)] backdrop-blur-xl backdrop-saturate-150',
            hidden && !menu && '-translate-y-full',
          )}
        >
          <div
            className={cn(
              'mx-auto flex max-w-7xl items-center gap-2 px-4 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6',
              scrolled ? 'h-16' : 'h-20',
            )}
          >
            <Link to="/" aria-label="RUNTech Space home" className="mr-auto shrink-0">
              <Logo className="[&_img]:h-9" />
            </Link>
            <nav
              ref={navRef}
              aria-label="Main"
              className="relative hidden items-center gap-1 lg:flex"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 rounded-full bg-card shadow-card transition-[left,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ left: pill?.left ?? 0, width: pill?.width ?? 0, opacity: pill ? 1 : 0 }}
              />
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  data-section={l.section}
                  aria-current={active === l.section ? 'page' : undefined}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-[15px] transition-colors',
                    active === l.section
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="ml-3 hidden items-center gap-2 sm:flex">
              <ThemeToggle />
              {signedIn ? (
                <Button asChild>
                  <Link to={homeForRole(role)}>My learning</Link>
                </Button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-full px-3 py-2 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign in
                  </Link>
                  <Button asChild className="group">
                    <Link to="/join">
                      Apply to join
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
            <button
              type="button"
              aria-label={menu ? 'Close menu' : 'Open menu'}
              aria-expanded={menu}
              aria-controls="mobile-menu"
              onClick={() => setMenu((m) => !m)}
              className="relative ml-1 size-11 lg:hidden"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-3 h-[1.5px] bg-foreground transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  menu ? 'top-[21px] rotate-45' : 'top-[17px]',
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-3 h-[1.5px] bg-foreground transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  menu ? 'top-[21px] -rotate-45' : 'top-[25px]',
                )}
              />
            </button>
          </div>
        </header>

        {/* phone menu: a full sheet that wipes down, large serif links */}
        <div
          id="mobile-menu"
          inert={!menu}
          className={cn(
            'fixed inset-0 z-30 flex flex-col bg-background px-6 pt-28 pb-10 transition-[clip-path] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden',
            menu
              ? '[clip-path:inset(0_0_0_0)]'
              : 'pointer-events-none [clip-path:inset(0_0_100%_0)]',
          )}
        >
          <nav aria-label="Menu" className="flex flex-col gap-1">
            {[...links, { to: '/verify', label: 'Verify a certificate', section: 'verify' }].map(
              (l, i) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenu(false)}
                  className={cn(
                    'font-display text-[2.6rem] leading-tight tracking-[-0.03em] transition-[opacity,transform] duration-500',
                    menu ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                  )}
                  style={{ transitionDelay: menu ? `${80 + i * 50}ms` : '0ms' }}
                >
                  {l.label}
                </Link>
              ),
            )}
          </nav>
          <div className="mt-auto flex flex-wrap items-center gap-3">
            {signedIn ? (
              <Button asChild size="lg">
                <Link to={homeForRole(role)} onClick={() => setMenu(false)}>
                  My learning
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/join" onClick={() => setMenu(false)}>
                    Apply to join
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login" onClick={() => setMenu(false)}>
                    Sign in
                  </Link>
                </Button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>

        <main id="main" className="flex-1 overflow-x-clip">
          <Outlet />
        </main>

        <footer className="text-sm text-muted-foreground">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-20 pb-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <Logo className="[&_img]:h-9" />
              <p className="mt-4 max-w-xs">
                Stack-led tech learning at Redeemer&apos;s University.
              </p>
            </div>
            <FooterColumn
              title="Learn"
              links={[
                ['/stacks', 'All stacks'],
                ['/#platform', 'The platform'],
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
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t px-4 py-6 text-xs sm:px-6">
            <p>© {new Date().getFullYear()} RUNTech Space</p>
            <p>Redeemer&apos;s University</p>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  )
}

function FooterColumn({ title, links: items }: { title: string; links: [string, string][] }) {
  return (
    <nav aria-label={title}>
      <p className="mb-3 font-semibold text-foreground">{title}</p>
      <ul className="grid gap-2">
        {items.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="transition-colors hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
