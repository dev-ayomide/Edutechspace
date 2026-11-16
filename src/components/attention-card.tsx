import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** A "this needs you" tile: a big number, what it is, and where to go. Quiet when the count is zero. */
export function AttentionCard({
  to,
  count,
  label,
  emptyLabel,
}: {
  to: string
  count: number
  label: string
  emptyLabel: string
}) {
  const active = count > 0
  return (
    <Link to={to} className="group block rounded-lg">
      <Card
        className={cn(
          'flex items-center justify-between gap-4 transition-colors group-hover:bg-surface',
          active && 'border-l-4 border-l-primary',
        )}
      >
        <div className="flex items-center gap-4">
          <span
            className={cn(
              'text-3xl leading-none font-extrabold tabular-nums',
              !active && 'text-muted-foreground',
            )}
          >
            {count}
          </span>
          <span className={cn('text-base font-semibold', !active && 'text-muted-foreground')}>
            {active ? label : emptyLabel}
          </span>
        </div>
        <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
      </Card>
    </Link>
  )
}
