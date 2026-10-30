/** Returns a new id list with the item at `index` moved one step up or down (no change at the ends). */
export function moveItem<T>(items: readonly T[], index: number, direction: 'up' | 'down'): T[] {
  const target = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return [...items]
  const next = [...items]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved as T)
  return next
}
