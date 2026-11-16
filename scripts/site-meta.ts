import type { Plugin } from 'vite'

/**
 * Puts the site's public address into the built page: canonical link, share-preview (Open Graph) tags,
 * robots.txt and sitemap.xml. The address comes from VITE_SITE_URL, or on Vercel from the project's
 * production domain (VERCEL_PROJECT_PRODUCTION_URL, which becomes your custom subdomain once it is
 * connected). So after connecting the subdomain, a redeploy is all that is needed.
 */
const PUBLIC_PATHS = ['/', '/stacks', '/join', '/verify']
const STACK_SLUGS = [
  'frontend',
  'backend',
  'data-analysis',
  'cloud-devops',
  'ui-ux',
  'product-management',
  'machine-learning',
  'game-development',
]

export function siteAddress(env: Record<string, string | undefined>): string | null {
  const raw =
    env.VITE_SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.origin
  } catch {
    return null
  }
}

export function siteMeta(site: string | null): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      if (!site) return html
      const tags = [
        `<link rel="canonical" href="${site}/" />`,
        `<meta property="og:url" content="${site}/" />`,
        `<meta property="og:image" content="${site}/og-image.png" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta property="og:image:alt" content="RUNTech Space: learn a tech skill properly" />`,
      ].join('\n    ')
      return html
        .replace(
          '<meta name="twitter:card" content="summary" />',
          '<meta name="twitter:card" content="summary_large_image" />',
        )
        .replace('</head>', `  ${tags}\n  </head>`)
    },
    generateBundle() {
      const robots = [
        'User-agent: *',
        'Allow: /',
        ...[
          '/dashboard',
          '/lead',
          '/admin',
          '/accept-invite',
          '/reset-password',
          '/_preview',
          '/_design',
        ].map((p) => `Disallow: ${p}`),
        ...(site ? ['', `Sitemap: ${site}/sitemap.xml`] : []),
        '',
      ].join('\n')
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      if (!site) return
      const urls = [...PUBLIC_PATHS, ...STACK_SLUGS.map((s) => `/stacks/${s}`)]
      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map((u) => `  <url><loc>${site}${u}</loc></url>`),
        '</urlset>',
        '',
      ].join('\n')
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    },
  }
}
