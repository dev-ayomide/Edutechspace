import { useEffect, useRef, useState } from 'react'

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/**
 * Counts down to a server-provided deadline. `onExpire` fires once when time runs out.
 * Returns null when there is no deadline (an untimed exam).
 */
export function useCountdown(deadline: string | null, onExpire: () => void): number | null {
  const target = deadline ? new Date(deadline).getTime() : null
  const [now, setNow] = useState(() => Date.now())
  const expired = useRef(false)
  const callback = useRef(onExpire)

  useEffect(() => {
    callback.current = onExpire
  })

  useEffect(() => {
    if (target === null) return
    expired.current = false
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])

  const remaining = target === null ? null : Math.max(0, target - now)
  useEffect(() => {
    if (remaining === 0 && !expired.current) {
      expired.current = true
      callback.current()
    }
  }, [remaining])
  return remaining
}
