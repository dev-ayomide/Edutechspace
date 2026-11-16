import { Award, Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JourneyStop } from './utils'

const dot: Record<JourneyStop['status'], string> = {
  done: 'bg-success text-success-foreground',
  now: 'border-2 border-primary text-primary',
  lock: 'bg-muted text-muted-foreground',
  gold: 'bg-gold-soft text-gold-soft-foreground',
}

/** The whole route to the certificate as a checklist: done, current, locked. */
export function JourneyTrack({ stops }: { stops: JourneyStop[] }) {
  return (
    <ol>
      {stops.map((s) => (
        <li
          key={s.key}
          className={cn(
            'flex items-center gap-3.5 border-t px-5 py-3.5 first:border-t-0',
            s.status === 'now' && 'bg-primary/5',
          )}
          aria-current={s.status === 'now' ? 'step' : undefined}
        >
          <span
            className={cn(
              'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold',
              dot[s.status],
            )}
            aria-hidden="true"
          >
            {s.status === 'done' ? (
              <Check className="size-3.5" strokeWidth={3} />
            ) : s.status === 'gold' || s.key === 'certificate' ? (
              <Award className="size-3.5" />
            ) : s.status === 'lock' ? (
              <Lock className="size-3" />
            ) : (
              s.symbol
            )}
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                'text-[15px] leading-snug font-bold',
                s.status === 'lock' && 'text-muted-foreground',
              )}
            >
              {s.label}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {s.status === 'done' && <span className="sr-only">Done. </span>}
              {s.status === 'now' && <span className="sr-only">Current. </span>}
              {s.status === 'lock' && <span className="sr-only">Locked. </span>}
              {s.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
