import axe from 'axe-core'

/**
 * Runs the axe accessibility engine on rendered output and fails with a readable list of problems.
 * Colour contrast is checked separately by the design-token tests (jsdom has no layout), and the
 * page-landmark rule is off because components are rendered without their shell.
 */
export async function expectAccessible(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  const problems = results.violations.map(
    (v) =>
      `${v.id}: ${v.help} [${v.nodes
        .slice(0, 2)
        .map((n) => n.target.join(' '))
        .join(' | ')}]`,
  )
  expect(problems).toEqual([])
}
