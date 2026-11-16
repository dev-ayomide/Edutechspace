import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Generated cover art for a stack: one simple motif per stack, in white on the stack's colour with a single
 * cyan accent. Gives every stack a recognisable "thumbnail" (the way course platforms do) without stock art.
 * Unknown slugs get a neutral motif, so stacks an admin adds later still look right.
 */
const W = 'rgba(255,255,255,.85)'
const F = 'rgba(255,255,255,.12)'
const C = '#08f1ff'

const colours: Record<string, string> = {
  frontend: '#1e3a8a',
  backend: '#0b1a4a',
  'data-analysis': '#0d4f5c',
  'cloud-devops': '#26334d',
  'game-development': '#16213f',
  'ui-ux': '#3b2a6b',
  'product-management': '#0f4a3a',
  'machine-learning': '#16181d',
}

const short: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  'data-analysis': 'Data',
  'cloud-devops': 'Cloud',
  'game-development': 'Games',
  'ui-ux': 'Design',
  'product-management': 'Product',
  'machine-learning': 'AI',
}

const line = (x: number, y: number, w: number, fill = W, opacity = 0.5) => (
  <rect
    key={`${x}-${y}-${w}`}
    x={x}
    y={y}
    width={w}
    height="6"
    rx="3"
    fill={fill}
    opacity={opacity}
  />
)

const motifs: Record<string, ReactNode> = {
  frontend: (
    <>
      <rect x="150" y="34" width="150" height="112" rx="6" fill={F} stroke={W} strokeWidth="1.5" />
      <line x1="150" y1="52" x2="300" y2="52" stroke={W} strokeWidth="1.5" />
      <circle cx="161" cy="43" r="3" fill={W} />
      <circle cx="171" cy="43" r="3" fill={W} />
      <circle cx="181" cy="43" r="3" fill={C} />
      {line(164, 66, 44, C, 1)}
      {line(214, 66, 60)}
      {line(176, 80, 70)}
      {line(176, 94, 40)}
      {line(222, 94, 50, C, 0.7)}
      {line(164, 108, 30)}
      {line(164, 122, 90, W, 0.3)}
    </>
  ),
  backend: (
    <>
      <g fill={F} stroke={W} strokeWidth="1.5">
        <ellipse cx="236" cy="50" rx="46" ry="12" />
        <path d="M190 50v26c0 7 21 12 46 12s46-5 46-12V50" />
        <path d="M190 76v26c0 7 21 12 46 12s46-5 46-12V76" />
        <path d="M190 102v26c0 7 21 12 46 12s46-5 46-12v-26" />
      </g>
      <circle cx="206" cy="86" r="3" fill={C} />
      <circle cx="206" cy="112" r="3" fill={C} />
      <circle cx="206" cy="138" r="3" fill={W} />
      <path
        d="M150 70h30M150 96h30M150 122h30"
        stroke={W}
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
    </>
  ),
  'data-analysis': (
    <>
      <g fill={F} stroke={W} strokeWidth="1.5">
        <rect x="160" y="110" width="22" height="40" />
        <rect x="192" y="86" width="22" height="64" />
        <rect x="224" y="96" width="22" height="54" />
        <rect x="256" y="58" width="22" height="92" />
      </g>
      <path
        d="M150 104 L171 84 L203 66 L235 74 L267 36 L298 30"
        fill="none"
        stroke={C}
        strokeWidth="2.5"
      />
      <circle cx="267" cy="36" r="4" fill={C} />
      <line x1="150" y1="150" x2="300" y2="150" stroke={W} strokeWidth="1.5" />
    </>
  ),
  'cloud-devops': (
    <>
      <path
        d="M196 96h80a22 22 0 0 0 0-44 30 30 0 0 0-56-10 24 24 0 0 0-24 54z"
        fill={F}
        stroke={W}
        strokeWidth="1.5"
      />
      <g stroke={W} strokeWidth="1.5" fill={F}>
        <circle cx="176" cy="134" r="10" />
        <circle cx="226" cy="134" r="10" />
        <circle cx="276" cy="134" r="10" />
      </g>
      <path d="M186 134h30M236 134h30" stroke={W} strokeWidth="1.5" />
      <circle cx="276" cy="134" r="4" fill={C} />
      <path d="M236 96v26" stroke={C} strokeWidth="2" strokeDasharray="3 4" />
    </>
  ),
  'game-development': (
    <>
      <g fill={W} opacity=".18">
        {Array.from({ length: 30 }, (_, i) => (
          <rect
            key={i}
            x={158 + (i % 6) * 24}
            y={30 + Math.floor(i / 6) * 24}
            width="20"
            height="20"
            rx="2"
          />
        ))}
      </g>
      <rect x="182" y="78" width="20" height="20" rx="2" fill={C} />
      <rect x="206" y="78" width="20" height="20" rx="2" fill={W} />
      <rect x="230" y="54" width="20" height="20" rx="2" fill={W} />
      <rect x="254" y="102" width="20" height="20" rx="2" fill={W} opacity=".7" />
    </>
  ),
  'ui-ux': (
    <>
      <rect x="150" y="30" width="78" height="120" rx="8" fill={F} stroke={W} strokeWidth="1.5" />
      <rect x="240" y="30" width="62" height="56" rx="6" fill={F} stroke={W} strokeWidth="1.5" />
      <rect x="240" y="96" width="62" height="54" rx="6" fill={F} stroke={W} strokeWidth="1.5" />
      <rect x="160" y="42" width="58" height="34" rx="4" fill={C} opacity=".85" />
      {line(160, 86, 40, W, 0.6)}
      {line(160, 98, 52, W, 0.4)}
      <rect x="160" y="126" width="58" height="14" rx="7" fill={W} />
      <path d="M262 112l0 26 7-7 6 12 5-2-6-12 10 0z" fill={W} />
    </>
  ),
  'product-management': (
    <>
      <g stroke={W} strokeWidth="1.5" fill={F}>
        <rect x="150" y="30" width="46" height="120" rx="5" />
        <rect x="204" y="30" width="46" height="120" rx="5" />
        <rect x="258" y="30" width="46" height="120" rx="5" />
      </g>
      <g fill={W} opacity=".75">
        <rect x="156" y="40" width="34" height="22" rx="3" />
        <rect x="156" y="68" width="34" height="22" rx="3" />
        <rect x="210" y="40" width="34" height="22" rx="3" />
        <rect x="264" y="40" width="34" height="22" rx="3" />
        <rect x="264" y="68" width="34" height="22" rx="3" />
        <rect x="264" y="96" width="34" height="22" rx="3" />
      </g>
      <rect x="210" y="68" width="34" height="22" rx="3" fill={C} />
    </>
  ),
  'machine-learning': (
    <>
      <g stroke={W} strokeWidth="1" opacity=".55">
        {[50, 90, 130].flatMap((a) =>
          [40, 72, 104, 136].map((b) => <line key={`${a}-${b}`} x1="170" y1={a} x2="230" y2={b} />),
        )}
        {[40, 72, 104, 136].map((a) => (
          <line key={a} x1="230" y1={a} x2="290" y2="90" />
        ))}
      </g>
      <g fill={F} stroke={W} strokeWidth="1.5">
        {[50, 90, 130].map((y) => (
          <circle key={y} cx="170" cy={y} r="8" />
        ))}
        {[40, 72, 104, 136].map((y) => (
          <circle key={y} cx="230" cy={y} r="8" />
        ))}
      </g>
      <circle cx="230" cy="72" r="8" fill={C} />
      <circle cx="290" cy="90" r="10" fill={C} />
    </>
  ),
}

const fallback = (
  <>
    <rect x="170" y="40" width="110" height="100" rx="8" fill={F} stroke={W} strokeWidth="1.5" />
    {line(186, 62, 60, C, 1)}
    {line(186, 78, 78)}
    {line(186, 94, 50)}
    {line(186, 110, 70)}
  </>
)

export function StackCover({
  slug,
  className,
  showTag = true,
}: {
  slug: string
  className?: string
  showTag?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative aspect-video overflow-hidden rounded-md text-white', className)}
      style={{ backgroundColor: colours[slug] ?? '#1e3a8a' }}
    >
      <svg
        viewBox="0 0 320 180"
        preserveAspectRatio="xMaxYMid slice"
        className="absolute inset-0 size-full"
      >
        {motifs[slug] ?? fallback}
      </svg>
      {showTag && short[slug] && (
        <span className="absolute bottom-2.5 left-3 text-xs font-bold tracking-wider uppercase opacity-90">
          {short[slug]}
        </span>
      )}
    </div>
  )
}
