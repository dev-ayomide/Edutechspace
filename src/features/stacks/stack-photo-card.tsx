import type { CSSProperties, PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { Photo } from '@/components/photo'
import { StackCover } from '@/components/stack-cover'
import '@/features/home/home.css'
import { categoryOf, stackPhotoName } from './catalogue-data'

/**
 * The tall photo card for a stack: category tag, serif name, details that slide up on hover, a cursor spotlight.
 * Must sit inside an element with the `paper` class (its styles live in home.css).
 */
export function StackPhotoCard({
  stack,
  hidden,
  delay,
}: {
  stack: { slug: string; name: string; description: string | null }
  hidden: boolean
  delay: number
}) {
  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <Link
      to={`/stacks/${stack.slug}`}
      className={hidden ? 'sc rv hide' : 'sc rv'}
      style={{ '--d': `${delay}s`, viewTransitionName: `sc-${stack.slug}` } as CSSProperties}
      onPointerMove={onMove}
    >
      {stackPhotoName(stack.slug) ? (
        <Photo
          name={stackPhotoName(stack.slug)!}
          alt=""
          sizes="(min-width: 1080px) 300px, (min-width: 560px) 50vw, 100vw"
          width={900}
          height={1125}
          loading="lazy"
        />
      ) : (
        <StackCover
          slug={stack.slug}
          showTag={false}
          className="absolute inset-0 -z-10 h-full rounded-none"
        />
      )}
      <span className="sc-tag">{categoryOf(stack.slug)}</span>
      <span className="sc-go" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M7 17L17 7M9 7h8v8" />
        </svg>
      </span>
      <div className="sc-cap">
        <h3>{stack.name}</h3>
        <div className="sc-more">
          <div>
            {stack.description && <p>{stack.description}</p>}
            <ul>
              <li>Self-paced</li>
              <li>Reviewed projects</li>
              <li>Certificate</li>
            </ul>
          </div>
        </div>
      </div>
    </Link>
  )
}
