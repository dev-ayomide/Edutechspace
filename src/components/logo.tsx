import { cn } from '@/lib/utils'

/**
 * RUNTech Space logo. The "R" mark is a vector reconstruction of the brand mark (three flat shapes);
 * the wordmark is live text so it adapts to light and dark themes and stays crisp at any size.
 * To use the original artwork instead, replace the body of this component with the supplied SVG files:
 * it is the only place the logo is drawn.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 423 477" aria-hidden="true" className={cn('h-8 w-auto', className)}>
      <path d="M0 0 L265 295 L0 477Z" fill="#0a84ff" />
      <path d="M0 0H270C350 0 408 62 408 132C408 182 385 212 355 232L265 295Z" fill="#2fd8ff" />
      <path d="M265 295L423 477H0Z" fill="#2a24b2" />
    </svg>
  )
}

export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <span
      role="img"
      aria-label="RUNTech Space"
      className={cn('inline-flex items-center gap-2.5', className)}
    >
      <LogoMark className="h-9" />
      {!markOnly && (
        <span aria-hidden="true" className="flex flex-col font-display leading-[0.95]">
          <span className="text-[1.05rem] tracking-tight">
            <span className="font-extrabold text-logo-run">RUN</span>
            <span className="font-medium text-foreground">Tech</span>
          </span>
          <span className="text-[1.05rem] font-medium tracking-tight text-foreground">Space</span>
        </span>
      )}
    </span>
  )
}
