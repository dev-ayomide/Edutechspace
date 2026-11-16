import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { titleFor } from '@/routes/titles'

/** Keeps the tab title in step with the screen, so history, tabs and screen readers can tell pages apart. */
export function useDocumentTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = titleFor(pathname)
  }, [pathname])
}
