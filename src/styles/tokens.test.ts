import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(process.cwd(), 'src/styles/index.css'), 'utf8')

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf('}', start))
  const vars: Record<string, string> = {}
  for (const m of body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) vars[m[1]!] = m[2]!
  return vars
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

// [foreground token, background token, minimum ratio]. 4.5 = WCAG AA text, 3 = non-text UI.
const pairs: [string, string, number][] = [
  ['foreground', 'background', 4.5],
  ['foreground', 'surface', 4.5],
  ['card-foreground', 'card', 4.5],
  ['muted-foreground', 'background', 4.5],
  ['muted-foreground', 'surface', 4.5],
  ['muted-foreground', 'muted', 4.5],
  ['muted-foreground', 'card', 4.5],
  ['foreground', 'muted', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['primary-foreground', 'primary-hover', 4.5],
  ['brand-foreground', 'brand', 4.5],
  ['accent-foreground', 'accent', 4.5],
  ['accent-soft-foreground', 'accent-soft', 4.5],
  ['gold-foreground', 'gold', 4.5],
  ['gold-soft-foreground', 'gold-soft', 4.5],
  ['link', 'background', 4.5],
  ['link', 'surface', 4.5],
  ['logo-run', 'background', 4.5],
  ['success-foreground', 'success', 4.5],
  ['warning-foreground', 'warning', 4.5],
  ['danger-foreground', 'danger', 4.5],
  ['success-soft-foreground', 'success-soft', 4.5],
  ['warning-soft-foreground', 'warning-soft', 4.5],
  ['danger-soft-foreground', 'danger-soft', 4.5],
  ['danger', 'background', 4.5],
  ['ring', 'background', 3],
  ['outline', 'background', 3],
  ['outline', 'surface', 3],
  ['input', 'background', 3],
  ['input', 'card', 3],
  ['primary', 'background', 3],
]

describe.each([
  ['light', block(':root')],
  ['dark', block('.dark')],
] as const)('%s theme tokens', (_name, tokens) => {
  it.each(pairs)('%s on %s meets %s:1', (fg, bg, min) => {
    expect(tokens[fg], `missing token --${fg}`).toBeDefined()
    expect(tokens[bg], `missing token --${bg}`).toBeDefined()
    expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(min)
  })
})

describe('theme switching', () => {
  it('makes the dark: variant follow the app theme class, not the operating system', () => {
    expect(css).toMatch(/@custom-variant dark \(&:where\(\.dark, \.dark \*\)\)/)
  })
})
