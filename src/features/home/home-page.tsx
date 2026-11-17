import { useQuery } from '@tanstack/react-query'
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router-dom'
import certificateImg from '@/assets/screens/certificate.webp'
import lessonImg from '@/assets/screens/lesson.webp'
import phoneDashboardImg from '@/assets/screens/phone-dashboard.webp'
import phoneLessonImg from '@/assets/screens/phone-lesson.webp'
import { Photo } from '@/components/photo'
import { listStacks, stackKeys } from '@/features/stacks/api'
import {
  categories,
  categoryOf,
  FALLBACK_STACKS,
  type Category,
} from '@/features/stacks/catalogue-data'
import { StackPhotoCard as StackCard } from '@/features/stacks/stack-photo-card'
import { Journey } from './journey'
import { tornClip, usePointerParallax, useReveal, useScrollProgress } from './paper-motion'
import './home.css'

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
  [
    'How do employers check my certificate?',
    'Every certificate has a number and a QR code that open a public page confirming it is real.',
  ],
] as const

function Torn({
  seed,
  className,
  style,
}: {
  seed: number
  className: string
  style?: CSSProperties
}) {
  return (
    <div
      aria-hidden="true"
      className={`torn ${className}`}
      style={{ clipPath: tornClip(seed), ...style }}
    />
  )
}

/** A headline whose lines slide up into place (each line is its own mask). */
function Lines({
  as: Tag = 'h2',
  lines,
  className,
}: {
  as?: 'h1' | 'h2'
  lines: string[]
  className?: string
}) {
  return (
    <Tag className={className} data-reveal="">
      {lines.map((l, i) => (
        <Fragment key={l}>
          {i > 0 && ' '}
          <span className="ln">
            <span>{l}</span>
          </span>
        </Fragment>
      ))}
    </Tag>
  )
}

function Avatar({ initials, soft = false }: { initials: string; soft?: boolean }) {
  return (
    <span
      className="av"
      style={soft ? { background: 'var(--peri)', color: 'var(--deep)' } : undefined}
    >
      {initials}
    </span>
  )
}

function Tick({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="4"
      aria-hidden="true"
    >
      <path d="M5 12l4 4 10-10" />
    </svg>
  )
}

export function HomePage() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)

  return (
    <div ref={root} className="paper">
      <Hero />
      <Marquee />
      <Statement />
      <Journey />
      <Stacks />
      <Platform />
      <Leads />
      <OnYourPhone />
      <CertificateSection />
      <Steps />
      <Questions />
      <Closing />
    </div>
  )
}

/* ---------------- hero ---------------- */

function Hero() {
  const collage = useRef<HTMLDivElement>(null)
  usePointerParallax(collage)
  return (
    <div className="hero">
      <div className="wrap">
        <span className="eyebrow rv">
          <i>Open</i> Applications are open for every stack
        </span>
        <Lines as="h1" className="serif" lines={['Learn tech with the', 'people who do it.']} />
        <p className="lede rv" style={{ '--d': '0.25s' } as CSSProperties}>
          Eight stacks at Redeemer&rsquo;s University, each led by a practitioner who reviews your
          work and walks you all the way to a certificate anyone can check.
        </p>
        <div className="ctas rv" style={{ '--d': '0.35s' } as CSSProperties}>
          <Link className="pill" to="/join">
            Apply to join <span className="arr">→</span>
          </Link>
          <Link className="ghost" to="#stacks">
            Explore the stacks
          </Link>
        </div>
        <div className="facts rv" style={{ '--d': '0.45s' } as CSSProperties}>
          <span>Free for admitted students</span>
          <span>Reviewed projects</span>
          <span>Verifiable certificate</span>
        </div>
      </div>

      <div ref={collage} className="collage rv" style={{ '--d': '0.5s' } as CSSProperties}>
        <Torn seed={11} className="c-ice px-up" />
        <Torn seed={23} className="c-peri px-down" />
        <div className="dots c-dots px-up" aria-hidden="true" />
        <figure className="pcard px-down" data-depth="10">
          <Photo
            name="student-laptop"
            alt="A student working on her laptop"
            sizes="(min-width: 1024px) 240px, 0px"
            width={600}
            height={750}
            priority
          />
        </figure>
        <div className="frame">
          <div className="bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>learn.runtechspace.com.ng</span>
          </div>
          <img
            src={lessonImg}
            alt="The RUNTech Space lesson player"
            width={1600}
            height={1000}
            fetchPriority="high"
          />
        </div>
        <div className="phone px-up" data-depth="-16">
          <img src={phoneDashboardImg} alt="" width={600} height={1298} />
        </div>
        <div className="note px-down" data-depth="14">
          <div className="who">
            <Avatar initials="KA" />
            <span>
              <b>Your stack lead</b>Project feedback
            </span>
            <span className="score">86 / 100</span>
          </div>
          <p>&ldquo;Clean, semantic structure. Next time add a skip link at the top.&rdquo;</p>
        </div>
      </div>
    </div>
  )
}

function Marquee() {
  const names = [
    'Frontend Development',
    'Backend Development',
    'Data Analysis',
    'Cloud & DevOps',
    'UI/UX Design',
    'Product Management',
    'Machine Learning',
    'Game Development',
  ]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="track">
        {[...names, ...names].map((n, i) => (
          <span key={i}>{n}</span>
        ))}
      </div>
    </div>
  )
}

/* ---------------- statement: darkens word by word as you read ---------------- */

const STATEMENT =
  'Most online courses leave you alone with a video. Here, every stack has a lead who reads your work, answers in writing, and walks you all the way to a certificate.'
const HIGHLIGHT = new Set(['lead', 'reads', 'your', 'work,', 'certificate.'])

function Statement() {
  const ref = useRef<HTMLParagraphElement>(null)
  const words = STATEMENT.split(' ')
  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const r = el.getBoundingClientRect()
    const p = reduce
      ? 1
      : Math.min(1, Math.max(0, (innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.35)))
    const n = Math.round(p * words.length)
    el.querySelectorAll('.w').forEach((w, i) => w.classList.toggle('on', i < n))
  }, [words.length])
  useScrollProgress(update)
  return (
    <section className="statement">
      <div className="wrap">
        <p ref={ref}>
          <span className="sr-only">{STATEMENT}</span>
          {words.map((w, i) => (
            <span key={i} aria-hidden="true" className={`w${HIGHLIGHT.has(w) ? 'hl' : ''}`}>
              {w}{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

/* ---------------- stacks: photo cards with animated filters ---------------- */

type Filter = 'All' | Category

function Stacks() {
  const query = useQuery({ queryKey: stackKeys.all, queryFn: listStacks })
  const live = (query.data ?? []).filter((s) => s.is_active)
  const stacks = live.length > 0 ? live : FALLBACK_STACKS
  const [filter, setFilter] = useState<Filter>('All')
  const tabs: Filter[] = [
    'All',
    ...categories.filter((c) => stacks.some((s) => categoryOf(s.slug) === c)),
  ]
  const tabRefs = useRef(new Map<Filter, HTMLButtonElement>())
  const [pill, setPill] = useState({ left: 0, width: 0 })

  const placePill = useCallback(() => {
    const b = tabRefs.current.get(filter)
    if (b) setPill({ left: b.offsetLeft, width: b.offsetWidth })
  }, [filter])
  useLayoutEffect(placePill, [placePill, tabs.length])
  useEffect(() => {
    void document.fonts?.ready.then(placePill)
  }, [placePill])

  const choose = (f: Filter) => {
    const apply = () => flushSync(() => setFilter(f))
    const vt = (document as Document & { startViewTransition?: (cb: () => void) => void })
      .startViewTransition
    if (vt && !matchMedia('(prefers-reduced-motion: reduce)').matches) vt.call(document, apply)
    else setFilter(f)
  }

  return (
    <section id="stacks" style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="head-row">
          <div>
            <p className="eyebrow rv">The stacks</p>
            <Lines className="h2 serif" lines={['Eight paths. Pick the', 'one that fits you.']} />
          </div>
          <Link className="link rv" to="/stacks">
            See every stack →
          </Link>
        </div>
        <div className="filters rv" role="tablist" aria-label="Filter stacks">
          <span
            className="fpill"
            aria-hidden="true"
            style={{ left: pill.left, width: pill.width }}
          />
          {tabs.map((t) => (
            <button
              key={t}
              ref={(el) => {
                if (el) tabRefs.current.set(t, el)
              }}
              type="button"
              role="tab"
              aria-selected={filter === t}
              onClick={() => choose(t)}
            >
              {t === 'All' ? 'All stacks' : t}
            </button>
          ))}
        </div>
        <div className="stacks2">
          {stacks.map((s, i) => (
            <StackCard
              key={s.slug}
              stack={s}
              hidden={filter !== 'All' && categoryOf(s.slug) !== filter}
              delay={(i % 4) * 0.06}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- the platform: pinned chapters, the picture follows ---------------- */

const chapters = [
  [
    '01',
    'Lessons in the right order',
    'Videos, readings and notes from your lead. Finish a module and the next one opens.',
  ],
  [
    '02',
    'Quizzes that mark themselves',
    'Answer, submit, and see where you stand straight away. Then move on with confidence.',
  ],
  [
    '03',
    'Feedback from a real person',
    'Your lead reviews every project and writes back. Scores come with reasons.',
  ],
  [
    '04',
    'Progress you can see',
    'Lessons, assignments and the final exam, counted for you. Always know what is left.',
  ],
] as const
const TINTS = ['var(--surface)', 'var(--accent-soft)', 'var(--paper-sky)', 'var(--muted)']

function Platform() {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.slide))
        }),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    refs.current.forEach((r) => r && io.observe(r))
    return () => io.disconnect()
  }, [])

  return (
    <div className="inside" id="platform">
      <div className="wrap">
        <div className="center">
          <p className="eyebrow rv">The platform</p>
          <Lines
            className="h2 serif"
            lines={['Everything in one place,', 'from day one to done.']}
          />
        </div>
        <div className="inside-grid">
          <div className="chapters">
            {chapters.map(([num, title, text], i) => (
              <div
                key={num}
                ref={(el) => {
                  refs.current[i] = el
                }}
                data-slide={i}
                className={`ch${active === i ? 'active' : ''}`}
              >
                <span className="num">{num}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className="inline" aria-hidden="true">
                  <PlatformSlide i={i} active />
                </div>
              </div>
            ))}
          </div>
          <div className="stage" aria-hidden="true">
            <div className="bg" style={{ background: TINTS[active] }} />
            {chapters.map((_, i) => (
              <div key={i} className={`slide${active === i ? 'active' : ''}`}>
                <PlatformSlide i={i} active={active === i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlatformSlide({ i, active }: { i: number; active: boolean }) {
  if (i === 0)
    return (
      <div className="frame">
        <div className="bar">
          <i />
          <i />
          <i />
          <span>Lesson</span>
        </div>
        <img src={lessonImg} alt="" width={1600} height={1000} loading="lazy" />
      </div>
    )
  if (i === 1)
    return (
      <div className="ui" style={{ maxWidth: 460, margin: '0 auto', padding: 28 }}>
        <p className="muted" style={{ margin: '0 0 6px' }}>
          Quiz · How the web works · Question 2 of 2
        </p>
        <h4 style={{ fontSize: 20 }}>Which part of a URL names the website?</h4>
        <div className="opt">The path</div>
        <div className="opt right">
          The host
          <span className="tick">
            <Tick />
          </span>
        </div>
        <div className="opt">The query</div>
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span className="muted">Marked instantly</span>
          <span className="score" style={{ fontSize: 15, padding: '4px 12px' }}>
            100 / 100
          </span>
        </div>
      </div>
    )
  if (i === 2)
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="ui">
          <div className="who">
            <Avatar initials="AO" soft />
            <span>
              <b>Ada Obi</b>Submitted a project
            </span>
          </div>
          <p style={{ margin: '12px 0 0' }}>
            Here is my about-me page. I used header, main and footer, and every image has alt text.
          </p>
          <div className="attach">
            <i>↗</i>ada-obi.example.com
          </div>
        </div>
        <div className="ui" style={{ margin: '16px 0 0 12%' }}>
          <div className="who">
            <Avatar initials="KA" />
            <span>
              <b>Stack lead</b>Reviewed
            </span>
            <span className="score">86 / 100</span>
          </div>
          <p style={{ margin: '12px 0 0', color: 'var(--graphite)' }}>
            Clean, semantic structure. Next time add a skip link at the top.
          </p>
        </div>
      </div>
    )
  return <ProgressCard active={active} />
}

function ProgressCard({ active }: { active: boolean }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!active) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const k = reduce ? 1 : Math.min(1, (t - start) / 1100)
      setV(Math.round(72 * (1 - Math.pow(1 - k, 4))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
  return (
    <div
      className="ui"
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: 28,
        display: 'flex',
        gap: 28,
        alignItems: 'center',
      }}
    >
      <div className="ring" style={{ '--p': v } as CSSProperties}>
        <b>{v}%</b>
      </div>
      <div className="bars">
        {(
          [
            ['Lessons', '9 / 16', 56],
            ['Assignments', '2 / 5', 40],
            ['Final exam', 'Locked', 0],
          ] as const
        ).map(([label, value, pct]) => (
          <div key={label} className="row">
            <div>
              <span>{label}</span>
              <b style={pct === 0 ? { color: 'var(--stone)' } : undefined}>{value}</b>
            </div>
            <div className="track-bar">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- leads ---------------- */

function Leads() {
  const points = [
    ['✎', 'Every project is read', 'Your lead scores your work and tells you why.'],
    ['↻', 'Room to improve', 'Asked to resubmit? Fix it and send it back.'],
    ['✓', 'Admission by a person', 'The lead reviews every application to their stack.'],
  ] as const
  return (
    <section>
      <div className="wrap split">
        <div>
          <p className="eyebrow rv">Stack leads</p>
          <Lines className="h2 serif" lines={['A lead in your', 'corner, not just', 'a video.']} />
          <ul className="points">
            {points.map(([icon, title, text], i) => (
              <li key={title} className="rv" style={{ '--d': `${i * 0.08}s` } as CSSProperties}>
                <span className="ico" aria-hidden="true">
                  {icon}
                </span>
                <div>
                  <b>{title}</b>
                  <span>{text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="thread rv">
          <Torn seed={37} className="" />
          <Photo
            name="lead-and-student"
            alt="A stack lead helping a student at a computer"
            sizes="(min-width: 900px) 560px, 100vw"
            width={1100}
            height={900}
            className="tphoto"
            loading="lazy"
          />
          <div className="ui first-ui">
            <div className="who">
              <Avatar initials="AO" soft />
              <span>
                <b>Ada Obi</b>Project: an about-me page
              </span>
            </div>
            <p style={{ margin: '12px 0 0' }}>
              Here is my about-me page. I used header, main and footer, and every image has alt
              text.
            </p>
            <div className="attach">
              <i>↗</i>ada-obi.example.com
            </div>
          </div>
          <div className="ui sub-ui">
            <div className="who">
              <Avatar initials="KA" />
              <span>
                <b>Stack lead</b>Reviewed today
              </span>
              <span className="score">86 / 100</span>
            </div>
            <p style={{ margin: '12px 0 0', color: 'var(--graphite)' }}>
              Clean, semantic structure. Next time add a skip link at the top.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function OnYourPhone() {
  return (
    <section style={{ background: 'var(--canvas-2)' }}>
      <div className="wrap split">
        <div className="phones" aria-hidden="true">
          <Torn seed={53} className="" />
          <div className="ph p1 px-up">
            <img src={phoneDashboardImg} alt="" width={600} height={1298} loading="lazy" />
          </div>
          <div className="ph p2 px-down">
            <img src={phoneLessonImg} alt="" width={600} height={1298} loading="lazy" />
          </div>
        </div>
        <div>
          <p className="eyebrow rv">On your phone</p>
          <Lines className="h2 serif" lines={['Learn on the device', 'you already have.']} />
          <p className="sub rv">
            Every lesson, quiz and project works on a phone. Pick up where you stopped, whether you
            are in class, on the bus or at home.
          </p>
        </div>
      </div>
    </section>
  )
}

function CertificateSection() {
  return (
    <section id="certificate">
      <div className="wrap center">
        <p className="eyebrow rv">Certificates</p>
        <Lines className="h2 serif" lines={['A certificate that', 'speaks for itself.']} />
        <p className="sub rv">
          Signed, numbered and backed by a public page. Employers can check it in seconds.
        </p>
        <div className="certwrap rv">
          <Torn seed={71} className="" />
          <img
            src={certificateImg}
            alt="A sample RUNTech Space certificate"
            width={1600}
            height={1131}
            loading="lazy"
          />
          <div className="ui verify px-down" aria-hidden="true">
            <div className="ok">
              <span className="tick">
                <Tick size={16} />
              </span>
              <h4>This certificate is valid</h4>
            </div>
            <dl>
              <div>
                <dt>Awarded to</dt>
                <dd className="name">Ada Obi</dd>
              </div>
              <div>
                <dt>Stack</dt>
                <dd>Frontend Development</dd>
              </div>
              <div>
                <dt>Issued</dt>
                <dd>16 Nov 2026</dd>
              </div>
              <div>
                <dt>Number</dt>
                <dd>RTS-2026-…</dd>
              </div>
            </dl>
          </div>
        </div>
        <p className="rv" style={{ marginTop: 60 }}>
          <Link className="ghost" to="/verify">
            Verify a certificate
          </Link>
        </p>
      </div>
    </section>
  )
}

/* ---------------- steps: the line draws as you scroll ---------------- */

function Steps() {
  const ref = useRef<HTMLDivElement>(null)
  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const r = el.getBoundingClientRect()
    const p = reduce
      ? 1
      : Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (innerHeight * 0.5)))
    el.style.setProperty('--prog', String(p))
  }, [])
  useScrollProgress(update)
  const steps: [string, string, string, ReactNode][] = [
    [
      'var(--gold-soft)',
      'Apply',
      'Send a short application. The lead invites you in.',
      <path key="a" d="M4 4h12l4 4v12H4zM8 12h8M8 16h5" />,
    ],
    [
      'var(--sky)',
      'Learn',
      'Lessons in order. Each module unlocks the next.',
      <g key="l">
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M10 9l4 2-4 2zM8 21h8" />
      </g>,
    ],
    [
      'var(--ice)',
      'Practise',
      'Instant quiz marks and written project feedback.',
      <path key="p" d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3" />,
    ],
    [
      'var(--card)',
      'Get certified',
      'Pass the exam. Your certificate gets a public page.',
      <g key="c">
        <circle cx="12" cy="9" r="5" />
        <path d="M9 13.5L8 21l4-2 4 2-1-7.5" />
      </g>,
    ],
  ]
  return (
    <section id="how" style={{ paddingTop: 40 }}>
      <div className="wrap center">
        <p className="eyebrow rv">How it works</p>
        <Lines className="h2 serif" lines={['Four steps. One clear path.']} />
        <div ref={ref} className="steps">
          <span className="line" aria-hidden="true" />
          {steps.map(([bg, title, text, icon], i) => (
            <div key={title} className="step rv" style={{ '--d': `${i * 0.08}s` } as CSSProperties}>
              <div className="ico" style={{ background: bg }} aria-hidden="true">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {icon}
                </svg>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Questions() {
  return (
    <section id="faq" style={{ paddingTop: 40 }}>
      <div className="wrap faq">
        <div>
          <p className="eyebrow rv">Questions</p>
          <Lines className="h2 serif" lines={['Good to know', 'before you apply.']} />
        </div>
        <div className="rv">
          {faqs.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>
                {q}
                <span className="pm" aria-hidden="true" />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function Closing() {
  return (
    <div className="closing" id="apply">
      {(
        [
          ['f1 px-up', 'frontend'],
          ['f2 px-down', 'data-analysis'],
          ['f3 px-down', 'ui-ux'],
          ['f4 px-up', 'machine-learning'],
        ] as const
      ).map(([cls, slug]) => (
        <div key={slug} className={`fl ${cls}`} aria-hidden="true">
          <Photo
            name={`stack-${slug}`}
            alt=""
            sizes="240px"
            width={480}
            height={300}
            loading="lazy"
          />
        </div>
      ))}
      <div className="wrap">
        <Lines className="h2 serif" lines={['Your stack is waiting.']} />
        <p className="rv">The lead reviews every application, usually within a few days.</p>
        <div className="rv" style={{ position: 'relative' }}>
          <Link className="pill light" to="/join">
            Apply to join <span className="arr">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
