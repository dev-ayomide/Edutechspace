import { useQuery } from '@tanstack/react-query'
import { Award, Check } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Photo } from '@/components/photo'
import { Button } from '@/components/ui/button'
import { listStacks, stackKeys } from '@/features/stacks/api'
import {
  categories,
  categoryOf,
  FALLBACK_STACKS,
  type Category,
} from '@/features/stacks/catalogue-data'
import { StackCard } from '@/features/stacks/catalogue'
import { cn } from '@/lib/utils'

const steps = [
  [
    'Apply',
    'Pick a stack and send a short application. The stack lead reviews it and invites you in.',
  ],
  ['Learn', 'Videos, readings and notes from your lead, in order. Each module unlocks the next.'],
  [
    'Practise',
    'Quizzes are marked instantly. Projects are reviewed by your lead, with written feedback.',
  ],
  [
    'Get certified',
    'Pass the final exam to receive a signed certificate with its own verification page.',
  ],
] as const

const faqs = [
  [
    'Who can apply?',
    'Anyone who wants to learn. Your application goes to the lead of the stack you choose, who decides who joins.',
  ],
  [
    'Can I take more than one stack?',
    'One at a time, so you can give it your full attention. When you finish or leave a stack you can apply to another.',
  ],
  [
    'What if I fail a quiz or the exam?',
    'You get more than one attempt. If you run out, your stack lead can give you another.',
  ],
  [
    'How long does a stack take?',
    'It depends on the stack and your pace. Every lesson shows how long it takes, so you can plan.',
  ],
] as const

function Tick() {
  return (
    <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={3} aria-hidden="true" />
  )
}

export function HomePage() {
  const stacksQuery = useQuery({ queryKey: stackKeys.all, queryFn: listStacks })
  const live = (stacksQuery.data ?? []).filter((s) => s.is_active)
  const stacks = live.length > 0 ? live : FALLBACK_STACKS
  const [tab, setTab] = useState<'All' | Category>('All')
  const shown = tab === 'All' ? stacks : stacks.filter((s) => categoryOf(s.slug) === tab)
  const tabs = [
    'All',
    ...categories.filter((c) => stacks.some((s) => categoryOf(s.slug) === c)),
  ] as const

  return (
    <>
      {/* hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-12 pb-12 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pt-16">
        <div>
          <p className="mb-3 text-sm font-bold text-link">
            Redeemer&apos;s University · RUNTech Space
          </p>
          <h1 className="text-[clamp(2.1rem,4.2vw,3.1rem)] leading-[1.08] font-extrabold">
            Learn a tech skill properly,{' '}
            <span className="shadow-[inset_0_-0.22em_0_var(--accent)]">with a lead</span> who does
            it for a living.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Pick one of {stacks.length} stacks. Work through it module by module, get real feedback
            on your assignments, and finish with a certificate anyone can verify.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#stacks">Explore the stacks</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how">How it works</a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-2 text-sm text-muted-foreground">
            {['Free for admitted students', 'Learn at your own pace', 'Verifiable certificate'].map(
              (t) => (
                <li key={t} className="flex gap-2">
                  <Tick />
                  {t}
                </li>
              ),
            )}
          </ul>
        </div>
        <figure className="relative">
          <Photo
            name="hero"
            alt="Three students working together on a laptop"
            sizes="(min-width: 1024px) 50vw, 92vw"
            width={1000}
            height={667}
            priority
            className="aspect-[4/3] w-full rounded-lg object-cover"
          />
          <figcaption className="absolute bottom-5 left-3 flex max-w-72 items-center gap-3 rounded-lg bg-card p-3.5 text-sm shadow-card sm:-left-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-soft-foreground">
              <Award className="size-5" aria-hidden="true" />
            </span>
            <span>
              <b className="block">Certificate earned</b>
              <span className="text-muted-foreground">
                Every certificate has its own public check page.
              </span>
            </span>
          </figcaption>
        </figure>
      </section>

      {/* catalogue */}
      <section id="stacks" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-6 pb-16 sm:px-6">
        <h2 className="text-3xl font-extrabold">Choose your stack</h2>
        <p className="mt-1 text-muted-foreground">
          Each stack is a complete path, from the first lesson to the final exam.
        </p>
        <div
          role="tablist"
          aria-label="Stack categories"
          className="mt-5 mb-6 flex gap-1 overflow-x-auto border-b"
        >
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                '-mb-px border-b-2 px-3.5 py-3 text-[15px] font-bold whitespace-nowrap',
                tab === t
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'All' ? 'All stacks' : t}
            </button>
          ))}
        </div>
        <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((s) => (
            <li key={s.id}>
              <StackCard stack={s} />
            </li>
          ))}
        </ul>
      </section>

      {/* how it works */}
      <section id="how" className="scroll-mt-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-extrabold">How a stack works</h2>
          <p className="mt-1 text-muted-foreground">The same clear path in every stack.</p>
          <ol className="mt-8 grid border-l md:grid-cols-4 md:border-t md:border-l-0">
            {steps.map(([title, text], i) => (
              <li key={title} className="relative pb-7 pl-6 md:pt-6 md:pr-6 md:pb-0 md:pl-0">
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 -left-[5px] size-2.5 rounded-full bg-primary md:-top-[5px] md:left-0"
                />
                <p className="text-xs font-bold tracking-wider text-link uppercase">Step {i + 1}</p>
                <h3 className="mt-1.5 text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-[15px] text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* certificate */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="text-3xl font-extrabold">A certificate employers can check in seconds</h2>
          <ul className="mt-5 grid gap-3 text-muted-foreground">
            {[
              'Issued only when you pass the final exam, never handed out.',
              'Signed by the people who stand behind RUNTech Space.',
              'A QR code and number link to a public page that confirms it is real.',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Tick />
                {t}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="mt-7">
            <Link to="/verify">Verify a certificate</Link>
          </Button>
        </div>
        <figure
          aria-label="Sample certificate"
          className="relative flex aspect-[1.414] flex-col rounded-lg border bg-card p-7 shadow-card after:pointer-events-none after:absolute after:inset-2.5 after:rounded after:border after:border-gold/40 sm:p-9"
        >
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Certificate of completion
          </p>
          <p className="mt-3 text-[clamp(1.4rem,3vw,1.9rem)] font-extrabold">Your name here</p>
          <p className="text-muted-foreground">has completed the</p>
          <p className="font-bold text-link">Frontend Development stack</p>
          <div className="mt-auto flex items-end justify-between text-xs text-muted-foreground">
            <span className="min-w-24 border-t border-muted-foreground pt-1">Signatory</span>
            <span className="min-w-24 border-t border-muted-foreground pt-1">RUNTech Space</span>
            <span
              aria-hidden="true"
              className="size-14 rounded-sm [background:conic-gradient(from_90deg_at_30%_30%,var(--foreground)_25%,transparent_0)_0_0/14px_14px,var(--muted)]"
            />
          </div>
        </figure>
      </section>

      {/* questions */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-extrabold">Questions</h2>
          <div className="mt-4 max-w-3xl">
            {faqs.map(([q, a], i) => (
              <details key={q} open={i === 0} className="group border-b">
                <summary className="flex cursor-pointer list-none justify-between gap-4 py-4 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden="true"
                    className="text-xl font-normal text-muted-foreground group-open:hidden"
                  >
                    +
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden text-xl font-normal text-muted-foreground group-open:inline"
                  >
                    –
                  </span>
                </summary>
                <p className="max-w-2xl pb-4 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* closing CTA */}
      <section className="bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-12 sm:px-6">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to start?</h2>
            <p className="mt-1 opacity-80">
              Applications are reviewed by the stack lead, usually within a few days.
            </p>
          </div>
          <Button asChild size="lg" className="bg-white text-[#16181d] hover:bg-white/90">
            <Link to="/join">Apply to join</Link>
          </Button>
        </div>
      </section>
    </>
  )
}
