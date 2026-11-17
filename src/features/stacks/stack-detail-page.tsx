import { useQuery } from '@tanstack/react-query'
import {
  Award,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  FileText,
  MessageSquare,
  PlayCircle,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Photo } from '@/components/photo'
import { StackCover } from '@/components/stack-cover'
import { EmptyState, ErrorState, LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/app/use-document-title'
import { fetchStackOutline, listStacks, outlineKeys, stackKeys, type OutlineRow } from './api'
import { categoryOf, stackPhotoName } from './catalogue-data'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function formatMinutes(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

/** The public "course page" for one stack: what it is, its curriculum, and how to apply. */
export function StackDetailPage() {
  const { slug = '' } = useParams()
  const stacks = useQuery({ queryKey: stackKeys.all, queryFn: listStacks })
  const outline = useQuery({
    queryKey: outlineKeys.bySlug(slug),
    queryFn: () => fetchStackOutline(slug),
  })
  const stack = stacks.data?.find((s) => s.slug === slug && s.is_active)
  usePageTitle(stack?.name)

  if (stacks.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <LoadingState />
      </div>
    )
  }
  if (stacks.error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <ErrorState onRetry={() => void stacks.refetch()} />
      </div>
    )
  }
  if (!stack) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="We couldn't find that stack"
          description="It may have been renamed or closed."
          action={
            <Button asChild variant="outline">
              <Link to="/stacks">See all stacks</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const modules = (outline.data ?? []).filter((r) => r.kind === 'module')
  const exam = outline.data?.find((r) => r.kind === 'exam')
  const lessons = modules.reduce((n, m) => n + (m.lesson_count ?? 0), 0)
  const minutes = modules.reduce((n, m) => n + (m.total_minutes ?? 0), 0)
  const projects = modules.filter((m) => m.has_assignment).length
  const applyTo = `/join?stack=${stack.slug}`

  return (
    <>
      <section className="bg-brand text-brand-foreground">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-9 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="mb-4 flex gap-2 text-sm font-semibold text-[#9fb4ff]"
            >
              <Link to="/stacks" className="hover:underline">
                Stacks
              </Link>
              <span aria-hidden="true">›</span>
              <span>{categoryOf(stack.slug)}</span>
            </nav>
            <h1 className="text-[clamp(1.8rem,3.4vw,2.4rem)] font-extrabold">{stack.name}</h1>
            {stack.description && (
              <p className="mt-3 max-w-2xl text-lg text-white/85">{stack.description}</p>
            )}
            {modules.length > 0 && (
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/85">
                <span>
                  <b className="text-white">{modules.length}</b> modules
                </span>
                <span>
                  <b className="text-white">{lessons}</b> lessons
                </span>
                {minutes > 0 && (
                  <span>
                    About <b className="text-white">{formatMinutes(minutes)}</b> of lessons
                  </span>
                )}
                <span>Led by a RUNTech Space stack lead</span>
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 pt-8">
          <section aria-labelledby="curriculum">
            <h2 id="curriculum" className="text-2xl font-extrabold">
              Curriculum
            </h2>
            {outline.isPending ? (
              <div className="mt-4">
                <LoadingState rows={4} />
              </div>
            ) : modules.length === 0 ? (
              // Also covers a failed outline load: a visitor sees a calm note, never an error box.
              <p className="mt-3 text-muted-foreground">
                The stack lead is still preparing this stack&apos;s lessons. You can apply now and
                start as soon as they are published.
              </p>
            ) : (
              <>
                <p className="mt-2 mb-3 text-sm text-muted-foreground">
                  {plural(modules.length, 'module')} · {plural(lessons, 'lesson')}
                  {minutes > 0 && ` · about ${formatMinutes(minutes)}`}
                </p>
                <div className="overflow-hidden rounded-lg border">
                  {modules.map((m, i) => (
                    <ModuleRow key={m.module_number} row={m} defaultOpen={i === 0} />
                  ))}
                  {exam && (
                    <div className="flex items-center gap-3 border-t bg-surface px-4 py-3.5 font-bold">
                      <Award
                        className="size-[18px] shrink-0 text-gold-soft-foreground"
                        aria-hidden="true"
                      />
                      {exam.title}
                      <span className="ml-auto text-sm font-normal whitespace-nowrap text-muted-foreground">
                        {exam.question_count ? plural(exam.question_count, 'question') : ''}
                        {exam.time_limit_minutes ? ` · ${exam.time_limit_minutes} min` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="how" className="mt-10">
            <h2 id="how" className="text-2xl font-extrabold">
              How this stack works
            </h2>
            <ul className="mt-4 grid gap-3 text-muted-foreground sm:grid-cols-2">
              <li>
                <b className="text-foreground">Apply.</b> The stack lead reads every application and
                invites you in by email.
              </li>
              <li>
                <b className="text-foreground">Learn in order.</b> Finish a module and its
                assignment to unlock the next one.
              </li>
              <li>
                <b className="text-foreground">Get feedback.</b> Quizzes are marked instantly;
                projects are reviewed by your lead.
              </li>
              <li>
                <b className="text-foreground">Get certified.</b> Pass the final exam to earn a
                certificate anyone can verify.
              </li>
            </ul>
          </section>
        </div>

        <aside className="lg:-mt-48">
          <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-float lg:sticky lg:top-24">
            {stackPhotoName(stack.slug) ? (
              <Photo
                name={stackPhotoName(stack.slug)!}
                alt=""
                sizes="340px"
                width={680}
                height={425}
                className="aspect-[16/10] w-full object-cover"
                priority
              />
            ) : (
              <StackCover slug={stack.slug} className="rounded-none" />
            )}
            <div className="p-5">
              <p className="text-2xl font-extrabold">Free</p>
              <p className="text-sm text-muted-foreground">for admitted students</p>
              <Button asChild className="mt-4 w-full">
                <Link to={applyTo}>Apply to this stack</Link>
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                The stack lead reviews every application.
              </p>
              <ul className="mt-5 grid gap-2.5 text-sm text-muted-foreground">
                {minutes > 0 && (
                  <li className="flex gap-2.5">
                    <PlayCircle className="size-4 shrink-0" aria-hidden="true" />
                    {formatMinutes(minutes)} of lessons
                  </li>
                )}
                <li className="flex gap-2.5">
                  <ClipboardCheck className="size-4 shrink-0" aria-hidden="true" />
                  {projects > 0 ? plural(projects, 'quiz or project') : 'Quizzes and projects'}
                </li>
                <li className="flex gap-2.5">
                  <MessageSquare className="size-4 shrink-0" aria-hidden="true" />
                  Written feedback from your lead
                </li>
                <li className="flex gap-2.5">
                  <Award className="size-4 shrink-0" aria-hidden="true" />
                  Verifiable certificate
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

function ModuleRow({ row, defaultOpen }: { row: OutlineRow; defaultOpen: boolean }) {
  const parts = [
    row.video_count ? plural(row.video_count, 'video') : null,
    row.reading_count ? plural(row.reading_count, 'reading') : null,
    row.has_assignment ? 'assignment' : null,
  ].filter(Boolean)
  return (
    <details open={defaultOpen} className="group border-t first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center gap-3 bg-surface px-4 py-3.5 font-bold [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="size-[18px] shrink-0 transition group-open:rotate-180"
          aria-hidden="true"
        />
        {row.module_number}. {row.title}
        <span className="ml-auto text-sm font-normal whitespace-nowrap text-muted-foreground">
          {plural(row.lesson_count ?? 0, 'lesson')}
          {row.total_minutes ? ` · ${formatMinutes(row.total_minutes)}` : ''}
        </span>
      </summary>
      <div className="px-4 py-3 pl-11 text-[15px] text-muted-foreground">
        {row.description && <p className="mb-2">{row.description}</p>}
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {row.video_count ? (
            <span className="flex items-center gap-1.5">
              <PlayCircle className="size-4" aria-hidden="true" />
              {plural(row.video_count, 'video')}
            </span>
          ) : null}
          {row.reading_count ? (
            <span className="flex items-center gap-1.5">
              <FileText className="size-4" aria-hidden="true" />
              {plural(row.reading_count, 'reading')}
            </span>
          ) : null}
          {row.has_assignment && (
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="size-4" aria-hidden="true" />
              Quiz or project
            </span>
          )}
          {parts.length === 0 && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4" aria-hidden="true" />
              Lessons coming soon
            </span>
          )}
        </p>
      </div>
    </details>
  )
}
