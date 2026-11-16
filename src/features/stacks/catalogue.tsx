import { Link } from 'react-router-dom'
import { StackCover } from '@/components/stack-cover'
import { Badge } from '@/components/ui/badge'
import type { Stack } from '@/types/domain'

/** A course-platform style card: cover, title, one-line description, what you get. */
export function StackCard({
  stack,
  headingLevel = 3,
}: {
  stack: Pick<Stack, 'slug' | 'name' | 'description'>
  headingLevel?: 2 | 3
}) {
  const Heading = `h${headingLevel}` as const
  return (
    <Link
      to={`/stacks/${stack.slug}`}
      className="group flex flex-col gap-2 rounded-md focus-visible:outline-offset-4"
    >
      <StackCover
        slug={stack.slug}
        className="border border-black/5 transition group-hover:brightness-95"
      />
      <Heading className="mt-1 text-[17px] leading-snug font-bold group-hover:text-primary">
        {stack.name}
      </Heading>
      {stack.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{stack.description}</p>
      )}
      <p className="text-[13px] text-muted-foreground">
        Self-paced <span aria-hidden="true">·</span> Reviewed projects{' '}
        <span aria-hidden="true">·</span> Certificate
      </p>
      <Badge variant="success" className="self-start">
        Applications open
      </Badge>
    </Link>
  )
}
