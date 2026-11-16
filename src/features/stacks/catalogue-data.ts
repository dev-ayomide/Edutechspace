import type { Stack } from '@/types/domain'

/** How the public catalogue groups stacks. Stacks an admin adds later fall under "Other". */
export const categories = ['Engineering', 'Data & AI', 'Design & Product'] as const
export type Category = (typeof categories)[number] | 'Other'

const categoryBySlug: Record<string, Category> = {
  frontend: 'Engineering',
  backend: 'Engineering',
  'cloud-devops': 'Engineering',
  'game-development': 'Engineering',
  'data-analysis': 'Data & AI',
  'machine-learning': 'Data & AI',
  'ui-ux': 'Design & Product',
  'product-management': 'Design & Product',
}

export const categoryOf = (slug: string): Category => categoryBySlug[slug] ?? 'Other'

/** Shown while the stack list loads, or if it cannot be loaded: the launch catalogue. */
export const FALLBACK_STACKS: Pick<Stack, 'id' | 'slug' | 'name' | 'description'>[] = [
  ['frontend', 'Frontend Development', 'Build fast, accessible and interactive web interfaces.'],
  [
    'backend',
    'Backend Development',
    'Design APIs, databases and the server-side logic behind products.',
  ],
  [
    'data-analysis',
    'Data Analysis',
    'Collect, clean, analyse and visualise data to drive decisions.',
  ],
  [
    'cloud-devops',
    'Cloud Computing / DevOps',
    'Deploy, scale and operate software on the cloud with modern DevOps practice.',
  ],
  ['ui-ux', 'UI/UX Design', 'Research, design and prototype products people love to use.'],
  [
    'product-management',
    'Product Management',
    'Discover problems, define products and lead them to market.',
  ],
  ['machine-learning', 'Machine Learning', 'Build and evaluate models that learn from data.'],
  ['game-development', 'Game Development', 'Design and build games from mechanics to polish.'],
].map(([slug, name, description]) => ({
  id: slug!,
  slug: slug!,
  name: name!,
  description: description!,
}))
