import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const cardVariants = cva('rounded-lg border p-5', {
  variants: {
    tone: {
      default: 'bg-card text-card-foreground',
      accent: 'border-transparent bg-accent-soft text-accent-soft-foreground',
      ink: 'border-transparent bg-brand text-brand-foreground',
      gold: 'border-transparent bg-gold-soft text-gold-soft-foreground',
      soft: 'bg-surface text-foreground',
    },
    lift: { none: '', sm: 'shadow-card', lg: 'shadow-float' },
  },
  defaultVariants: { tone: 'default', lift: 'none' },
})

export function Card({
  className,
  tone,
  lift,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>) {
  return <div className={cn(cardVariants({ tone, lift }), className)} {...props} />
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-bold', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}
