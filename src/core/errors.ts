import { ZodError } from 'zod'

import { runtimeUnavailableError } from './constants'

export type AppErrorDomain = 'auth' | 'gmail' | 'storage' | 'scan'

export type AppError = {
  domain: AppErrorDomain
  message: string
  recoverable: boolean
  details?: unknown
}

/** Normalized error for RPC boundary: never leak raw Error or stack. */
export const normalizeError = (
  e: unknown,
  code = 'UNKNOWN_ERROR',
): { code: string; message: string } => {
  if (e instanceof Error) {
    const message = e.message.length > 0 ? e.message : 'Unexpected error'
    return { code, message }
  }
  return { code: 'UNKNOWN_ERROR', message: 'Unexpected error' }
}

export const toAppError = (domain: AppErrorDomain, e: unknown): AppError => {
  if (e instanceof ZodError) {
    return {
      domain,
      message: 'Schema validation failed',
      recoverable: false,
      details: e.flatten(),
    }
  }

  if (e instanceof Error) {
    if (e.message === runtimeUnavailableError) {
      return { domain: 'storage', message: runtimeUnavailableError, recoverable: true }
    }

    const msg = e.message.length > 0 ? e.message : 'Unknown error'
    const lower = msg.toLowerCase()
    const recoverable =
      lower.includes('network') ||
      lower.includes('timeout') ||
      lower.includes('rate') ||
      lower.includes('temporar')

    return { domain, message: msg, recoverable, details: undefined }
  }

  return { domain, message: 'Unknown error', recoverable: false, details: { raw: String(e) } }
}

export const handleAsync = async <T>(args: {
  domain: AppErrorDomain
  fn: () => Promise<T>
}): Promise<{ ok: true; data: T } | { ok: false; error: AppError }> => {
  try {
    return { ok: true, data: await args.fn() }
  } catch (e) {
    return { ok: false, error: toAppError(args.domain, e) }
  }
}
