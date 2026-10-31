import { cn } from '@/lib/utils'
import type { JourneyStop } from './utils'

const dot: Record<JourneyStop['status'], string> = {
  done: 'bg-primary text-primary-foreground border-outline',
  now: 'bg-accent text-accent-foreground border-outline ring-8 ring-accent/30',
  lock: 'bg-card text-muted-foreground border-border',
  gold: 'bg-gold text-gold-foreground border-outline',
}

/** The whole route to the certificate: horizontal on wide screens, vertical on phones. */
export function JourneyTrack({ stops }: { stops: JourneyStop[] }) {
  return (
    <ol className="relative grid gap-5 md:auto-cols-fr md:grid-flow-col md:gap-0">
      <span
        aria-hidden="true"
        className="absolute top-9 bottom-9 left-[1.65rem] w-1.5 rounded-full bg-border md:top-[1.65rem] md:right-12 md:bottom-auto md:left-12 md:h-1.5 md:w-auto"
      />
      {stops.map((s) => (
        <li
          key={s.key}
          className="relative grid grid-cols-[3.5rem_1fr] items-center gap-4 md:block md:text-center"
          aria-current={s.status === 'now' ? 'step' : undefined}
        >
          <span
            className={cn(
              'relative z-10 grid size-14 place-items-center rounded-full border-[3px] font-display text-xl font-extrabold md:mx-auto md:mb-3',
              dot[s.status],
            )}
          >
            <span aria-hidden="true">{s.symbol}</span>
          </span>
          <div className={cn('md:px-2', s.status === 'lock' && 'opacity-70')}>
            <p className="font-display text-sm leading-tight font-extrabold">{s.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
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
