import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Scrolls horizontally inside its container on small screens instead of breaking the page. */
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-outline bg-card">
      <table className={cn('w-full text-left text-sm', className)} {...props} />
    </div>
  )
}
export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'bg-muted px-4 py-3 text-xs font-bold tracking-wide text-muted-foreground uppercase',
        className,
      )}
      {...props}
    />
  )
}
export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-t px-4 py-3 align-middle', className)} {...props} />
}
