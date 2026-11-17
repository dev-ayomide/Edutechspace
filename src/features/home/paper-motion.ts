import { useEffect, type RefObject } from 'react'

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Reveals `.rv` and `[data-reveal]` elements inside `root` the first time they scroll into view (sets `data-in`,
 * an attribute React never rewrites, so re-renders cannot hide revealed content).
 * Also picks up elements added later, e.g. stack cards that arrive with live data.
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const targets = () =>
      el.querySelectorAll<HTMLElement>('.rv:not([data-in]), [data-reveal]:not([data-in])')
    if (reduced() || typeof IntersectionObserver === 'undefined') {
      targets().forEach((t) => t.setAttribute('data-in', ''))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-in', '')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -10% 0px' },
    )
    const watch = () => targets().forEach((t) => io.observe(t))
    watch()
    const mo = new MutationObserver(watch)
    mo.observe(el, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [root])
}

/** Runs `fn(progress)` on scroll, at most once per frame, while the page is mounted. */
export function useScrollProgress(fn: () => void) {
  useEffect(() => {
    let ticking = false
    const run = () => {
      ticking = false
      fn()
    }
    const onScroll = () => {
      if (!ticking) requestAnimationFrame(run)
      ticking = true
    }
    run()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [fn])
}

/** A light, eased response to the pointer for the hero collage layers (mouse only, never with reduced motion). */
export function usePointerParallax(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el || reduced() || !matchMedia('(pointer: fine)').matches) return
    const layers = [...el.querySelectorAll<HTMLElement>('[data-depth]')].map(
      (n) => [n, Number(n.dataset.depth)] as const,
    )
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let raf = 0
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / innerWidth - 0.5) * 2
      ty = (e.clientY / innerHeight - 0.5) * 2
    }
    const loop = () => {
      cx += (tx - cx) * 0.06
      cy += (ty - cy) * 0.06
      for (const [n, k] of layers)
        n.style.transform = `translate3d(${cx * k}px, ${cy * k * 0.6}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [root])
}

/** Seeded torn-paper edge as a clip-path polygon, identical on every load. */
export function tornClip(seed: number) {
  let s = seed
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const n = 28
  const j = () => (rnd() * 2.2).toFixed(2)
  const pts: string[] = []
  for (let i = 0; i <= n; i++) pts.push(`${((i / n) * 100).toFixed(2)}% ${j()}%`)
  for (let i = 0; i <= n; i++) pts.push(`${100 - Number(j())}% ${((i / n) * 100).toFixed(2)}%`)
  for (let i = n; i >= 0; i--) pts.push(`${((i / n) * 100).toFixed(2)}% ${100 - Number(j())}%`)
  for (let i = n; i >= 0; i--) pts.push(`${j()}% ${((i / n) * 100).toFixed(2)}%`)
  return `polygon(${pts.join(',')})`
}
