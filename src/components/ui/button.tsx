import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 px-5 text-sm font-bold transition duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'border-outline bg-primary text-primary-foreground hover:shadow-hard-primary',
        accent: 'border-outline bg-accent text-accent-foreground hover:shadow-hard',
        outline: 'border-outline bg-background text-foreground hover:shadow-hard',
        ghost:
          'border-transparent text-foreground hover:bg-muted hover:translate-x-0 hover:translate-y-0',
        danger: 'border-danger bg-danger text-danger-foreground hover:shadow-hard',
      },
      size: {
        md: '',
        sm: 'min-h-9 rounded-lg px-3.5',
        lg: 'min-h-14 rounded-2xl px-7 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className)
  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    )
  }
  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
