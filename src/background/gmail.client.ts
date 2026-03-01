import type { z } from 'zod'

import { retry } from '../core/async'
import { type GmailProfile, gmailProfileSchema } from '../domain/schemas/gmail'
import { env } from '../domain/utils/env'
import { clearTokenCache, ensureValidToken, removeCachedAuthToken } from './auth.service'
import { createLogger } from './logger/logger'

const logger = createLogger('background.gmail.client')

export class GmailApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'GmailApiError'
    this.status = status
    this.details = details
  }
}

const fetchJson = async (url: string, init: RequestInit): Promise<unknown> => {
  const res = await fetch(url, init)
  const contentType = res.headers.get('content-type') ?? ''

  let body: unknown = undefined
  if (contentType.includes('application/json')) {
    body = await res.json()
  } else {
    const text = await res.text()
    body = text.length > 0 ? { text } : undefined
  }

  if (!res.ok) {
    throw new GmailApiError(`Gmail API request failed: ${res.status}`, res.status, body)
  }

  return body
}

export const gmailRequest = async <T>(args: {
  endpoint: string
  init: RequestInit
  schema: z.ZodType<T>
}): Promise<T> => {
  const url = `${env.VITE_GMAIL_API_BASE_URL}${args.endpoint}`

  const exec = async (): Promise<T> => {
    const token = await ensureValidToken()
    const init: RequestInit = {
      ...args.init,
      headers: {
        Accept: 'application/json',
        ...(args.init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    }
    const json = await fetchJson(url, init)
    return args.schema.parse(json)
  }

  // Retry once on 401 by clearing token cache and cached auth token.
  return await retry({
    attempts: 2,
    delayMs: 0,
    fn: async () => {
      try {
        return await exec()
      } catch (e) {
        if (e instanceof GmailApiError && e.status === 401) {
          logger.warn('401 from Gmail API; clearing token cache and retrying once.')
          clearTokenCache()
          // Best effort: remove cached token if we can fetch one.
          try {
            const token = await ensureValidToken()
            await Promise.allSettled([removeCachedAuthToken(token)])
          } catch {
            // ignore
          }
        }
        throw e
      }
    },
    shouldRetry: (e) => e instanceof GmailApiError && e.status === 401,
  })
}

export const fetchGmailProfile = async (): Promise<GmailProfile> =>
  await gmailRequest({
    endpoint: '/users/me/profile',
    init: { method: 'GET' },
    schema: gmailProfileSchema,
  })
