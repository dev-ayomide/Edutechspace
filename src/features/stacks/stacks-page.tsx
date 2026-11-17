import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { useReveal } from '@/features/home/paper-motion'
import { listStacks, stackKeys } from './api'
import { categories, categoryOf, FALLBACK_STACKS } from './catalogue-data'
import { StackPhotoCard } from './stack-photo-card'

/** Public catalogue of every open stack, grouped by category, as photo cards. */
export function StacksPage() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  const query = useQuery({ queryKey: stackKeys.all, queryFn: listStacks })
  const live = (query.data ?? []).filter((s) => s.is_active)
  const stacks = live.length > 0 ? live : FALLBACK_STACKS
  const groups = [...categories, 'Other' as const]
    .map((c) => ({ name: c, items: stacks.filter((s) => categoryOf(s.slug) === c) }))
    .filter((g) => g.items.length > 0)

  return (
    <div ref={root} className="paper">
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 120 }}>
        <p className="eyebrow rv">The stacks</p>
        <h1
          className="serif"
          data-reveal=""
          style={{ fontSize: 'clamp(2.6rem, 5.4vw, 4.2rem)', margin: '14px 0 0' }}
        >
          <span className="ln">
            <span>All stacks</span>
          </span>
        </h1>
        <p className="sub rv">
          {stacks.length} stacks, each a complete path from the first lesson to a verified
          certificate.
        </p>
        {groups.map((g) => (
          <section
            key={g.name}
            aria-labelledby={`cat-${g.name.replace(/\W+/g, '-')}`}
            style={{ marginTop: 72 }}
          >
            <h2
              id={`cat-${g.name.replace(/\W+/g, '-')}`}
              className="rv"
              style={{
                fontSize: 30,
                margin: 0,
                paddingBottom: 14,
                borderBottom: '1px solid var(--line)',
              }}
            >
              {g.name}
            </h2>
            <div className="stacks2">
              {g.items.map((s, i) => (
                <StackPhotoCard key={s.slug} stack={s} hidden={false} delay={(i % 4) * 0.06} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
