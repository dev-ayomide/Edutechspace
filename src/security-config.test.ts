import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface Header {
  key: string
  value: string
}
const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as {
  headers: { source: string; headers: Header[] }[]
}
const global = new Map(
  config.headers.find((h) => h.source === '/(.*)')!.headers.map((h) => [h.key, h.value]),
)
const csp = new Map(
  (global.get('Content-Security-Policy') ?? '').split(';').map((d) => {
    const [name, ...values] = d.trim().split(/\s+/)
    return [name!, values] as const
  }),
)

describe('deployment security headers (vercel.json)', () => {
  it('only runs scripts from our own origin, with no eval or inline script', () => {
    expect(csp.get('script-src')).toEqual(["'self'"])
    expect(JSON.stringify([...csp])).not.toMatch(/unsafe-eval|unsafe-inline.*script/)
  })
  it('cannot be framed, and blocks plugins and base-tag tricks', () => {
    expect(csp.get('frame-ancestors')).toEqual(["'none'"])
    expect(csp.get('object-src')).toEqual(["'none'"])
    expect(csp.get('base-uri')).toEqual(["'self'"])
    expect(csp.get('form-action')).toEqual(["'self'"])
    expect(global.get('X-Frame-Options')).toBe('DENY')
  })
  it('limits API calls and embedded video to the services the app uses', () => {
    expect(csp.get('connect-src')).toEqual(["'self'", 'https://*.supabase.co'])
    expect(csp.get('frame-src')).toEqual(
      expect.arrayContaining(['https://www.youtube-nocookie.com', 'https://player.vimeo.com']),
    )
    expect(csp.get('frame-src')).not.toContain('*')
    expect(csp.get('frame-src')).not.toContain('https:')
  })
  it('sets the standard hardening headers', () => {
    expect(global.get('X-Content-Type-Options')).toBe('nosniff')
    expect(global.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(global.get('Strict-Transport-Security')).toMatch(/max-age=\d{7,}/)
    expect(global.get('Permissions-Policy')).toContain('camera=()')
  })
  it('keeps long-lived caching for hashed assets only', () => {
    const assets = config.headers.find((h) => h.source === '/assets/(.*)')!.headers[0]!
    expect(assets.value).toContain('immutable')
    expect(global.get('Cache-Control')).toContain('must-revalidate')
  })
})
