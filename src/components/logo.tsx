import logo from '@/assets/brand/logo.png'
import { cn } from '@/lib/utils'

/**
 * The brand logo is a single-colour mark, so it is drawn as a mask filled with the
 * theme foreground colour: navy on light backgrounds, white on dark ones.
 */
export function Logo({ className }: { className?: string }) {
  const mask = `url(${logo}) center / contain no-repeat`
  return (
    <span
      role="img"
      aria-label="RUNTech Space"
      className={cn('block aspect-[495/149] h-9 bg-foreground', className)}
      style={{ mask, WebkitMask: mask }}
    />
  )
}
