import { z } from 'zod'

import { gmailProfileSchema } from './gmail'

export const persistedAuthSchema = z
  .object({
    status: z.enum(['signed_out', 'signed_in', 'error']),
    email: z.string().email().optional(),
    lastLoginAt: z.number().int().optional(),
    lastLogoutAt: z.number().int().optional(),
  })
  .default({ status: 'signed_out' })

export const persistedGmailSchema = z
  .object({
    profile: gmailProfileSchema.optional(),
    lastProfileFetchedAt: z.number().int().optional(),
  })
  .default({})

export const persistedBackgroundStateSchema = z
  .object({
    schemaVersion: z.number().int().optional().default(1),
    auth: persistedAuthSchema,
    gmail: persistedGmailSchema,
  })
  .default({
    schemaVersion: 1,
    auth: { status: 'signed_out' },
    gmail: {},
  })

export type PersistedBackgroundState = z.infer<typeof persistedBackgroundStateSchema>
