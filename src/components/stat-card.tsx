import { Card } from '@/components/ui/card'
import type { ComponentProps } from 'react'

export function StatCard({
  label,
  value,
  hint,
  tone,
  lift,
}: {
  label: string
  value: number | string
  hint?: string
  tone?: ComponentProps<typeof Card>['tone']
  lift?: ComponentProps<typeof Card>['lift']
}) {
  return (
    <Card tone={tone} lift={lift}>
      <p className="text-sm font-semibold opacity-80">{label}</p>
      <p className="mt-1 font-display text-4xl font-extrabold tracking-tight tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs opacity-80">{hint}</p>}
    </Card>
  )
}
