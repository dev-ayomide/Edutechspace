import { cn } from '@/lib/utils'

/** Big circular progress for hero moments. `value` is a server-computed percentage (0-100). */
export function ProgressRing({
  value,
  label,
  size = 220,
  className,
}: {
  value: number
  label: string
  size?: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center" aria-hidden="true">
        <div>
          <p className="font-display text-5xl leading-none font-extrabold tracking-tighter tabular-nums">
            {clamped}
            <span className="align-top text-2xl">%</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">to certificate</p>
        </div>
      </div>
    </div>
  )
}
