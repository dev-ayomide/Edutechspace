import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroPhoto from '@/assets/photos/hero.jpg'
import { Button } from '@/components/ui/button'
import { listStacks, stackKeys } from '@/features/stacks/api'

/** Shown while the stack list loads, or if it cannot be loaded: the launch catalogue. */
const FALLBACK_STACKS = [
  'Data Analysis',
  'Frontend Development',
  'Backend Development',
  'Cloud Computing / DevOps',
  'Game Development',
  'UI/UX Design',
  'Product Management',
  'Machine Learning',
].map((name) => ({ id: name, slug: '', name }))

const steps = [
  {
    n: '01',
    title: 'Learn',
    text: 'Lessons and videos from your stack lead, in order. Finish a module to unlock the next.',
    tone: 'bg-accent text-accent-foreground',
    body: 'text-accent-foreground',
  },
  {
    n: '02',
    title: 'Grow',
    text: 'Quizzes and real projects for every module, with feedback you can act on.',
    tone: 'bg-card text-card-foreground',
    body: 'text-muted-foreground',
  },
  {
    n: '03',
    title: 'Build',
    text: 'Pass the final exam and earn a signed certificate with its own verification page.',
    tone: 'bg-brand text-brand-foreground',
    body: 'text-brand-foreground/80',
  },
]

export function HomePage() {
  const stacksQuery = useQuery({ queryKey: stackKeys.all, queryFn: listStacks })
  const live = (stacksQuery.data ?? []).filter((s) => s.is_active)
  const stacks = live.length > 0 ? live : FALLBACK_STACKS

  return (
    <>
      {/* hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-12 pb-20 lg:grid-cols-[1.05fr_.95fr] lg:pt-16">
        <div>
          <span className="inline-block rounded-full border-2 border-outline bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent-soft-foreground">
            Stack-led tech learning
          </span>
          <h1 className="mt-6 font-display text-[clamp(3.6rem,10vw,7.6rem)] leading-[0.92] font-extrabold tracking-[-0.05em]">
            Learn.
            <br />
            <span className="relative inline-block">
              <span
                aria-hidden="true"
                className="absolute inset-x-[-0.05em] bottom-[0.06em] -z-10 h-[0.42em] -skew-x-6 bg-accent motion-safe:animate-[mark-draw_0.8s_0.4s_both]"
              />
              Grow.
            </span>
            <br />
            Build.
          </h1>
          <p className="mt-7 max-w-lg text-xl text-muted-foreground">
            Join a stack, learn module by module with real feedback from people who do this for a
            living, and finish with a certificate anyone can verify.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/join">
                Join a stack <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how">See how it works</a>
            </Button>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-6 translate-y-6 rounded-[2.25rem] border-2 border-outline bg-accent"
          />
          <div className="relative aspect-[1/1.05] overflow-hidden rounded-[2.25rem] border-2 border-outline bg-muted">
            <img
              src={heroPhoto}
              alt="Three students working together on a laptop"
              width={1000}
              height={667}
              fetchPriority="high"
              className="h-full w-full object-cover object-[60%_40%]"
            />
          </div>
          <p className="absolute top-8 -left-4 -rotate-[5deg] rounded-2xl border-2 border-outline bg-card px-4 py-3 text-sm font-bold shadow-hard sm:-left-8">
            <span className="block font-display text-3xl leading-none font-extrabold">
              {stacks.length}
            </span>
            stacks to choose from
          </p>
          <p className="absolute right-[-0.5rem] bottom-16 rotate-[4deg] rounded-2xl border-2 border-outline bg-gold px-4 py-3 text-sm font-bold text-gold-foreground shadow-hard">
            <span className="block font-display text-3xl leading-none font-extrabold">QR</span>
            verified certificate
          </p>
        </div>
      </section>

      {/* facts */}
      <section className="border-y-2 border-outline bg-brand text-brand-foreground">
        <dl className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-3">
          {[
            [String(stacks.length), 'stacks, each led by practitioners'],
            ['1', 'final exam, graded fairly and on the clock'],
            ['100%', 'of certificates publicly verifiable'],
          ].map(([n, label]) => (
            <div key={label}>
              <dt className="font-display text-6xl leading-none font-extrabold tracking-tighter text-accent sm:text-7xl">
                {n}
              </dt>
              <dd className="mt-2 opacity-85">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* how it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
        <h2 className="max-w-[15ch] font-display text-5xl leading-[0.95] font-extrabold tracking-[-0.045em] sm:text-6xl">
          Three beats. One certificate.
        </h2>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground">
          No guessing what to do next. Each step is clear, and each one is earned.
        </p>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className={`${s.tone} rounded-[1.75rem] border-2 border-outline p-8 transition duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard-lg`}
            >
              <p className="font-display text-7xl leading-[0.9] font-extrabold tracking-[-0.06em]">
                {s.n}
              </p>
              <h3 className="mt-8 font-display text-3xl font-extrabold">{s.title}</h3>
              <p className={`${s.body} mt-2`}>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* stacks */}
      <section className="border-y-2 border-outline bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="font-display text-5xl leading-[0.95] font-extrabold tracking-[-0.045em] sm:text-6xl">
            Pick your stack.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Pick one, apply, and a stack lead reviews your application.
          </p>
          <ul className="mt-12 border-t-2 border-outline">
            {stacks.map((s, i) => (
              <li key={s.id}>
                <Link
                  to={s.slug ? `/join?stack=${s.slug}` : '/join'}
                  className="group grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b-2 border-outline px-2 py-5 transition-all hover:bg-accent hover:px-5 sm:grid-cols-[5.5rem_1fr_auto]"
                >
                  <span className="font-display font-bold text-link group-hover:text-accent-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-2xl leading-none font-extrabold tracking-[-0.04em] sm:text-4xl">
                    {s.name}
                  </span>
                  <span className="grid size-11 place-items-center rounded-full border-2 border-outline bg-background text-foreground">
                    <ArrowRight className="size-5" aria-hidden="true" />
                    <span className="sr-only">Apply to {s.name}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* certificate */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-24 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full border-2 border-outline bg-gold-soft px-4 py-1.5 text-sm font-bold text-gold-soft-foreground">
            The finish line
          </span>
          <h2 className="mt-5 font-display text-5xl leading-[0.95] font-extrabold tracking-[-0.045em] sm:text-6xl">
            A certificate that proves itself.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Signed by the people who stand behind it, with a QR code and a public page where anyone
            can check it is real.
          </p>
          <ul className="mt-7 grid gap-3">
            {[
              'Signed by the President, Technical Lead and Staff Patron',
              'Checkable by employers in seconds',
              'Earned, never handed out',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-lg font-medium">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-outline bg-accent">
                  <Check className="size-4" aria-hidden="true" />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8">
            <Link to="/join">Start your journey</Link>
          </Button>
        </div>
        <figure
          aria-label="Sample certificate"
          className="relative rounded-[1.75rem] border-2 border-outline bg-card p-9 shadow-hard-gold sm:p-11"
        >
          <p className="text-xs font-bold tracking-[0.2em] text-link">CERTIFICATE OF COMPLETION</p>
          <p className="mt-2 font-display text-4xl leading-none font-extrabold tracking-[-0.045em]">
            RUNTech Space
          </p>
          <p className="mt-5 text-muted-foreground">This is to certify that</p>
          <p className="mt-1 inline-block border-b-4 border-accent font-display text-3xl font-extrabold tracking-tight">
            Ṣọlá Adéyẹmí
          </p>
          <p className="mt-3 text-muted-foreground">
            has completed <strong className="text-foreground">Frontend Development</strong>
          </p>
          <p className="mt-8 text-xs tracking-wide text-muted-foreground">
            RTS-2026-A1B2C3D4E5 · SAMPLE
          </p>
          <span
            aria-hidden="true"
            className="absolute right-7 bottom-7 size-16 rounded-lg border-[3px] border-outline [background:conic-gradient(var(--outline)_25%,var(--card)_0_50%,var(--outline)_0_75%,var(--card)_0)_0_0/16px_16px]"
          />
        </figure>
      </section>

      {/* closing CTA */}
      <section className="px-5 pb-24">
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[2.5rem] border-2 border-outline bg-brand p-10 text-brand-foreground sm:p-16">
          <span
            aria-hidden="true"
            className="absolute -top-24 -right-24 size-72 rounded-full bg-accent"
          />
          <h2 className="relative font-display text-5xl leading-[0.95] font-extrabold tracking-[-0.045em] sm:text-6xl">
            Ready to build?
          </h2>
          <Button asChild size="lg" variant="accent" className="relative">
            <Link to="/join">Join a stack</Link>
          </Button>
        </div>
      </section>
    </>
  )
}
