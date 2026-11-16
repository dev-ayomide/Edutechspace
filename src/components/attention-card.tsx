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
    <Link to={to} className="group block rounded-2xl focus-visible:outline-offset-4">
      <Card
        tone={active ? 'accent' : 'default'}
        lift={active ? 'sm' : 'none'}
        className={cn(
          'flex items-center justify-between gap-4 transition duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5',
          !active && 'opacity-80',
        )}
      >
        <div className="flex items-center gap-4">
          <span className="font-display text-5xl leading-none font-extrabold tracking-tighter tabular-nums">
            {count}
          </span>
          <span className="text-base font-bold">{active ? label : emptyLabel}</span>
        </div>
        <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
      </Card>
    </Link>
  )
}
