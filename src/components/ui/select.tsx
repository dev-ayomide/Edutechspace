import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Native select: fully accessible and mobile friendly. */
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'min-h-12 w-full rounded-xl border border-input bg-card px-3.5 text-base text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger',
        className,
      )}
      {...props}
    />
  )
}
