import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { isChunkLoadError } from './chunk-error'

/** Shown for any unexpected error in a route. Never shows technical details to the user. */
export function RouteError() {
  const error = useRouteError()
  const stale = isChunkLoadError(error)
  const notFound = isRouteErrorResponse(error) && error.status === 404

  if (!stale && !notFound) {
    // Swap this for your error reporter (e.g. Sentry) when one is chosen. Nothing sensitive is logged.
    console.error('Unhandled route error', error)
  }

  return (
    <div
      role="alert"
      className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <Logo />
      <AlertTriangle className="size-12 text-warning" aria-hidden="true" />
      <div>
        <h1 className="font-display text-3xl font-extrabold">
          {stale
            ? 'A new version is available'
            : notFound
              ? 'Page not found'
              : 'Something went wrong'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {stale
            ? 'RUNTech Space was updated while this tab was open. Reload to continue.'
            : 'We hit an unexpected problem. Reloading usually fixes it. If it keeps happening, please tell your stack lead.'}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Reload
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
