import { type RuntimeEnv, runtimeEnvSchema } from '../schemas/env'

let cachedEnv: RuntimeEnv | null = null

export const getEnv = (): RuntimeEnv => {
  if (cachedEnv !== null) return cachedEnv
  cachedEnv = runtimeEnvSchema.parse(import.meta.env)
  return cachedEnv
}

export const env = getEnv()
