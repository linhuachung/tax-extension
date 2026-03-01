import { z } from 'zod'

export const appErrorCodeSchema = z.enum([
  'bad_request',
  'unauthorized',
  'auth_failed',
  'gmail_api_error',
  'network_error',
  'validation_error',
  'internal_error',
])

export type AppErrorCode = z.infer<typeof appErrorCodeSchema>

export const appErrorSchema = z.object({
  code: appErrorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
})

export type AppError = z.infer<typeof appErrorSchema>
