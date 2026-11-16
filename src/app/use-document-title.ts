import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { titleFor } from '@/routes/titles'

/** Keeps the tab title in step with the screen, so history, tabs and screen readers can tell pages apart. */
export function useDocumentTitle() {
  const { pathname } = useLocation()
  // Layout effect: runs before any page's usePageTitle (a passive effect), so a page can refine it.
  useLayoutEffect(() => {
    document.title = titleFor(pathname)
  }, [pathname])
}

/** A page whose title depends on data (e.g. a stack's name) refines the route's title once it knows it. */
export function usePageTitle(label: string | undefined) {
  useEffect(() => {
    if (label) document.title = `${label} · RUNTech Space`
  }, [label])
}
