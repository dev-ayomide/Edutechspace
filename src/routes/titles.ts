import { navByRole } from './nav'

const SITE = 'RUNTech Space'

const publicTitles: [RegExp, string][] = [
  [/^\/$/, 'Learn. Grow. Build.'],
  [/^\/login/, 'Sign in'],
  [/^\/join/, 'Join a stack'],
  [/^\/accept-invite/, 'Finish setting up your account'],
  [/^\/forgot-password/, 'Forgot your password'],
  [/^\/reset-password/, 'Choose a new password'],
  [/^\/verify/, 'Verify a certificate'],
  [/^\/dashboard\/stack\/lessons\//, 'Lesson'],
  [/^\/dashboard\/stack\/assignments\//, 'Assignment'],
]

const navTitles = new Map(
  Object.values(navByRole).flatMap((items) => items.map((i) => [i.to, i.label] as const)),
)

/** The browser tab / history title for a path, e.g. "Review queue · RUNTech Space". */
export function titleFor(pathname: string): string {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  const fromNav = navTitles.get(path)
  const match = publicTitles.find(([re]) => re.test(path))?.[1]
  const label = match ?? fromNav
  return label ? `${label} · ${SITE}` : SITE
}
