import { z } from 'zod'

export const applicationSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Enter your full name')
    .max(120, 'Keep it under 120 characters'),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email').max(254),
  phone: z
    .string()
    .trim()
    .max(30, 'Keep it under 30 characters')
    .refine((v) => v === '' || /^[+()\d\s-]{6,}$/.test(v), 'Enter a valid phone number'),
  stack_id: z.string().min(1, 'Choose a stack'),
  motivation: z.string().trim().max(1000, 'Keep it under 1000 characters'),
  // Honeypot: real people never see or fill this field, bots often do.
  website: z.string().max(0),
})
export type ApplicationInput = z.infer<typeof applicationSchema>
