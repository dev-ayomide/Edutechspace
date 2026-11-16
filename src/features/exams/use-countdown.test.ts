import { act, renderHook } from '@testing-library/react'
import { formatClock, useCountdown } from './use-countdown'

describe('formatClock', () => {
  it('formats minutes, seconds and hours', () => {
    expect(formatClock(65_000)).toBe('01:05')
    expect(formatClock(3_725_000)).toBe('1:02:05')
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(-5000)).toBe('00:00')
    expect(formatClock(1)).toBe('00:01')
  })
})

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('has no countdown without a deadline', () => {
    const { result } = renderHook(() => useCountdown(null, vi.fn()))
    expect(result.current).toBeNull()
  })

  it('counts down and fires onExpire exactly once', () => {
    const onExpire = vi.fn()
    const deadline = new Date(Date.now() + 3000).toISOString()
    const { result } = renderHook(() => useCountdown(deadline, onExpire))
    expect(result.current).toBeGreaterThan(2000)
    act(() => vi.advanceTimersByTime(1000))
    expect(onExpire).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(5000))
    expect(result.current).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('expires immediately for a deadline in the past', () => {
    const onExpire = vi.fn()
    renderHook(() => useCountdown(new Date(Date.now() - 1000).toISOString(), onExpire))
    expect(onExpire).toHaveBeenCalledTimes(1)
  })
})
