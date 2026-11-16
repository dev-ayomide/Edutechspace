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
    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-input bg-card px-4 py-3 text-base font-medium transition-colors hover:bg-surface has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-[inset_0_0_0_1px_var(--primary)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring">
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
