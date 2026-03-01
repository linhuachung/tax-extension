import { z } from 'zod'

import { appErrorSchema } from './errors'
import { gmailProfileSchema } from './gmail'

export const authStatusSchema = z.enum([
  'signed_out',
  'signing_in',
  'signed_in',
  'signing_out',
  'error',
])

export type AuthStatus = z.infer<typeof authStatusSchema>

export const authViewSchema = z.object({
  status: authStatusSchema,
  email: z.string().email().optional(),
  lastLoginAt: z.number().int().optional(),
  lastLogoutAt: z.number().int().optional(),
  lastError: appErrorSchema.optional(),
})

export type AuthView = z.infer<typeof authViewSchema>

export const gmailViewSchema = z.object({
  profile: gmailProfileSchema.optional(),
  lastProfileFetchedAt: z.number().int().optional(),
})

export type GmailView = z.infer<typeof gmailViewSchema>

export const backgroundViewStateSchema = z.object({
  auth: authViewSchema,
  gmail: gmailViewSchema,
})

export type BackgroundViewState = z.infer<typeof backgroundViewStateSchema>
