import Lenis from 'lenis'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Weighted, smooth scrolling for the public site (Lenis), plus in-page links (#faq) and route changes that land
 * exactly where they should. Skipped entirely when the visitor asks their device for less motion.
 */
const LenisContext = createContext<Lenis | null>(null)
// eslint-disable-next-line react-refresh/only-export-components -- tiny hook that belongs with its provider
export const useLenis = () => useContext(LenisContext)

const NAV_OFFSET = -76

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const location = useLocation()

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const instance = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) })
    let raf = 0
    const loop = (time: number) => {
      instance.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    // Lenis is created once and shared through context; storing it in state is the point here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance)
    return () => {
      cancelAnimationFrame(raf)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  // New page: start at the top. A hash (e.g. /#faq): glide to that section once it has rendered.
  useEffect(() => {
    if (!location.hash) {
      if (lenis) lenis.scrollTo(0, { immediate: true })
      else window.scrollTo(0, 0)
      return
    }
    const id = decodeURIComponent(location.hash.slice(1))
    let tries = 0
    const timer = window.setInterval(() => {
      const el = document.getElementById(id)
      if (el || ++tries > 40) {
        window.clearInterval(timer)
        if (!el) return
        if (lenis) lenis.scrollTo(el, { offset: NAV_OFFSET })
        else el.scrollIntoView()
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [location.pathname, location.hash, lenis])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
