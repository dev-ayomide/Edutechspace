import { slugify, stackSchema } from './schemas'

describe('slugify', () => {
  it('makes url-safe slugs', () => {
    expect(slugify('Cloud Computing / DevOps')).toBe('cloud-computing-devops')
    expect(slugify('  UI/UX Design ')).toBe('ui-ux-design')
    expect(slugify('Data & Analytics')).toBe('data-and-analytics')
  })
})

describe('stackSchema', () => {
  it('accepts a valid stack', () => {
    expect(
      stackSchema.safeParse({ name: 'Frontend', slug: 'frontend', description: '' }).success,
    ).toBe(true)
  })
  it('rejects bad slugs', () => {
    for (const slug of ['Front End', 'front--end', '-front', '']) {
      expect(stackSchema.safeParse({ name: 'Frontend', slug, description: '' }).success).toBe(false)
    }
  })
})
