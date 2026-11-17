import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

/** Modal with focus trap, Escape to close and labelled title/description (via Radix). */
export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-7 text-card-foreground shadow-float',
          className,
        )}
      >
        <DialogPrimitive.Title className="text-xl font-bold">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description
          className={cn('mt-1 text-sm text-muted-foreground', !description && 'sr-only')}
        >
          {description ?? title}
        </DialogPrimitive.Description>
        <div className="mt-5">{children}</div>
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-wrap justify-end gap-2">{children}</div>
}
