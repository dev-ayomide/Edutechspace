import { useQuery } from '@tanstack/react-query'
import { listStacks, stackKeys } from './api'
import { categories, categoryOf, FALLBACK_STACKS } from './catalogue-data'
import { StackCard } from './catalogue'

/** Public catalogue of every open stack, grouped by category. */
export function StacksPage() {
  const query = useQuery({ queryKey: stackKeys.all, queryFn: listStacks })
  const live = (query.data ?? []).filter((s) => s.is_active)
  const stacks = live.length > 0 ? live : FALLBACK_STACKS
  const groups = [...categories, 'Other' as const]
    .map((c) => ({ name: c, items: stacks.filter((s) => categoryOf(s.slug) === c) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold">All stacks</h1>
      <p className="mt-1 text-muted-foreground">
        {stacks.length} stacks, each a complete path from the first lesson to a verified
        certificate.
      </p>
      {groups.map((g) => (
        <section
          key={g.name}
          aria-labelledby={`cat-${g.name.replace(/\W+/g, '-')}`}
          className="mt-10"
        >
          <h2
            id={`cat-${g.name.replace(/\W+/g, '-')}`}
            className="mb-4 border-b pb-2 text-xl font-bold"
          >
            {g.name}
          </h2>
          <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {g.items.map((s) => (
              <li key={s.id}>
                <StackCard stack={s} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
