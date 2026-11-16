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
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}
