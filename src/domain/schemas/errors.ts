import { z } from 'zod'

export const appErrorSchema = z.object({
  domain: z.enum(['auth', 'gmail', 'storage', 'scan']),
  message: z.string(),
  recoverable: z.boolean(),
  details: z.unknown().optional(),
})

export type AppError = z.infer<typeof appErrorSchema>
