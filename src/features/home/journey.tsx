import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import certificateTex from '@/assets/screens/tex-certificate.jpg'
import dashboardTex from '@/assets/screens/tex-dashboard.jpg'
import lessonTex from '@/assets/screens/tex-lesson.jpg'
import progressTex from '@/assets/screens/tex-progress.jpg'

/**
 * "Your journey": a pinned section where a 3D laptop opens as you scroll, plays the student journey on its screen
 * and ends with the camera inside the certificate. three.js is loaded only when the section is about to appear,
 * and only where WebGL is available; without it the section still reads as text.
 */
function canRender3D() {
  if (/jsdom/i.test(navigator.userAgent)) return false
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

export function Journey() {
  const ref = useRef<HTMLElement>(null)
  const [enabled] = useState(canRender3D)

  useEffect(() => {
    const sec = ref.current
    if (!sec) return
    let cleanup: (() => void) | undefined
    let cancelled = false
    if (typeof IntersectionObserver === 'undefined') return
    let started = false
    const begin = () => {
      if (started || cancelled) return
      started = true
      start.disconnect()
      window.clearTimeout(idleTimer)
      void import('./laptop-3d').then(async ({ mountLaptop }) => {
        if (cancelled) return
        const stop = await mountLaptop(sec, {
          dashboard: dashboardTex,
          lesson: lessonTex,
          progress: progressTex,
          certificate: certificateTex,
        })
        if (cancelled) stop()
        else cleanup = stop
      })
    }
    // Start when the section comes near...
    const start = new IntersectionObserver(([e]) => e?.isIntersecting && begin(), {
      rootMargin: '1200px 0px',
    })
    start.observe(sec)
    // ...or quietly a moment after the page settles, so the one-time 3D setup never lands mid-scroll.
    // Skipped for visitors who asked their browser to save data.
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData
    const idleTimer = window.setTimeout(() => {
      if (saveData) return
      const ric = (
        window as Window & {
          requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
        }
      ).requestIdleCallback
      if (ric) ric(begin, { timeout: 2500 })
      else begin()
    }, 1500)
    return () => {
      cancelled = true
      start.disconnect()
      window.clearTimeout(idleTimer)
      cleanup?.()
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <section
      ref={ref}
      className="journey"
      id="journey"
      aria-label="A student's journey on RUNTech Space"
    >
      <div className="pin">
        <div className="glow" />
        <div className="grid-floor" />
        <div className="copy">
          <div className="line on">
            <small>Your journey</small>
            <b>
              It starts with
              <br />
              opening a laptop.
            </b>
          </div>
          <div className="line">
            <small>Learn</small>
            <b>
              Lessons from people
              <br />
              who do the work.
            </b>
          </div>
          <div className="line">
            <small>Practise</small>
            <b>
              Every answer marked.
              <br />
              Every project read.
            </b>
          </div>
          <div className="line">
            <small>Finish</small>
            <b>
              And it ends with
              <br />
              proof that you can.
            </b>
          </div>
        </div>
        <canvas className="gl" aria-hidden="true" />
        <Chip
          className="c1"
          style={{ left: '13%', top: '38%' }}
          dot="✓"
          dotStyle={{ background: '#2fae6a' }}
        >
          <b>Lesson complete</b> · Flexbox
        </Chip>
        <Chip
          className="c2"
          style={{ right: '13%', top: '30%' }}
          dot="Q"
          dotStyle={{ background: '#1e3a8a' }}
        >
          <b>Quiz</b> · 100 / 100
        </Chip>
        <Chip
          className="c3"
          style={{ left: '15%', bottom: '20%' }}
          dot="KA"
          dotStyle={{ background: '#0b1a4a' }}
        >
          <b>Your lead:</b> &ldquo;Clean structure.&rdquo; 86/100
        </Chip>
        <Chip
          className="c4"
          style={{ right: '14%', bottom: '26%' }}
          dot="↑"
          dotStyle={{ background: '#08f1ff', color: '#0b1a4a' }}
        >
          <b>Module 3</b> unlocked
        </Chip>
        <div className="finale">
          <p>Your proof is one stack away.</p>
          <Link className="pill light" to="/join">
            Start your stack <span className="arr">→</span>
          </Link>
        </div>
        <div className="progress">
          <i />
        </div>
      </div>
    </section>
  )
}

function Chip({
  className,
  style,
  dot,
  dotStyle,
  children,
}: {
  className: string
  style: React.CSSProperties
  dot: string
  dotStyle: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div className={`chip ${className}`} style={style} aria-hidden="true">
      <span className="dot" style={dotStyle}>
        {dot}
      </span>
      <span>{children}</span>
    </div>
  )
}
