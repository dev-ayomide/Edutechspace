import logoDark from '@/assets/brand/logo-dark.png'
import logoLight from '@/assets/brand/logo-light.png'
import mark from '@/assets/brand/mark.png'
import { cn } from '@/lib/utils'

/**
 * RUNTech Space logo, from the supplied artwork (see design/logos and `npm run logos`).
 * The light logo shows on light backgrounds and the dark logo on dark ones, following the theme.
 */
export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  if (markOnly) {
    return (
      <img
        src={mark}
        alt="RUNTech Space"
        width={263}
        height={256}
        className={cn('h-9 w-auto', className)}
      />
    )
  }
  return (
    <span className={cn('inline-flex', className)}>
      <img
        src={logoLight}
        alt="RUNTech Space"
        width={514}
        height={160}
        className="h-10 w-auto dark:hidden"
      />
      <img
        src={logoDark}
        alt="RUNTech Space"
        width={514}
        height={160}
        className="hidden h-10 w-auto dark:block"
      />
    </span>
  )
}
