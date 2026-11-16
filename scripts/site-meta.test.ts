import { siteAddress } from './site-meta'

describe('siteAddress', () => {
  it('prefers VITE_SITE_URL, then the Vercel production domain', () => {
    expect(siteAddress({ VITE_SITE_URL: 'https://learn.example.com/' })).toBe(
      'https://learn.example.com',
    )
    expect(siteAddress({ VERCEL_PROJECT_PRODUCTION_URL: 'learn.example.com' })).toBe(
      'https://learn.example.com',
    )
    expect(
      siteAddress({
        VITE_SITE_URL: 'https://a.example.com',
        VERCEL_PROJECT_PRODUCTION_URL: 'b.example.com',
      }),
    ).toBe('https://a.example.com')
  })
  it('returns nothing when no address is known or it is invalid', () => {
    expect(siteAddress({})).toBeNull()
    expect(siteAddress({ VITE_SITE_URL: 'not a url' })).toBeNull()
  })
})
