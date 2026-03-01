import { z } from 'zod'

export const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error', 'silent'])
export type LogLevel = z.infer<typeof logLevelSchema>

export const runtimeEnvSchema = z
  .object({
    MODE: z.string(),
    DEV: z.boolean(),
    PROD: z.boolean(),
    BASE_URL: z.string(),

    VITE_LOG_LEVEL: logLevelSchema.optional(),
    VITE_APP_PHASE: z.string().optional(),
    VITE_GMAIL_API_BASE_URL: z.string().url().optional(),
  })
  .transform((raw) => ({
    ...raw,
    VITE_LOG_LEVEL: raw.VITE_LOG_LEVEL ?? 'info',
    VITE_APP_PHASE: raw.VITE_APP_PHASE ?? 'phase1',
    VITE_GMAIL_API_BASE_URL: raw.VITE_GMAIL_API_BASE_URL ?? 'https://www.googleapis.com/gmail/v1',
  }))

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>
