import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-5 text-[15px] font-medium transition-[background-color,color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-[0_12px_12px_2px_rgb(11_18_48/0.08),0_2px_4px_-1px_rgb(11_18_48/0.06)]',
        accent: 'border-transparent bg-accent text-accent-foreground hover:brightness-95',
        outline:
          'border-[#cfd8ea] bg-transparent text-foreground hover:border-outline hover:bg-card dark:border-border',
        ghost: 'border-transparent text-foreground hover:bg-muted',
        danger: 'border-transparent bg-danger text-danger-foreground hover:brightness-95',
      },
      size: {
        md: '',
        sm: 'min-h-9 px-3.5 text-sm',
        lg: 'min-h-12 px-7 text-base',
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
