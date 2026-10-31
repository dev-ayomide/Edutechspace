import type { ReactNode } from 'react'

/**
 * A big, tappable answer choice. The native radio stays in place (keyboard and screen readers work as
 * usual); the tile just reflects the checked and focused state.
 */
export function OptionTile({
  name,
  checked,
  onChange,
  children,
}: {
  name: string
  checked: boolean
  onChange: () => void
  children: ReactNode
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 border-input bg-card px-4 py-3 text-base font-medium transition-colors hover:border-outline has-[:checked]:border-outline has-[:checked]:bg-accent-soft has-[:checked]:text-accent-soft-foreground has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring">
      <input
        type="radio"
        name={name}
        className="size-5 shrink-0 accent-primary"
        checked={checked}
        onChange={onChange}
      />
      <span>{children}</span>
    </label>
  )
}
