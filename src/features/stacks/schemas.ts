import { z } from 'zod'

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const stackSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name').max(80, 'Keep it under 80 characters'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens'),
  description: z.string().trim().max(500, 'Keep it under 500 characters'),
})
export type StackInput = z.infer<typeof stackSchema>
