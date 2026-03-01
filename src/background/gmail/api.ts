import type { z } from 'zod'

import { env } from '../../shared/utils/env'
import { clearInMemoryToken, getAccessToken, removeCachedAuthToken } from '../auth/identity'
import { createLogger } from '../logger/logger'

const logger = createLogger('background.gmail.api')

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

export const gmailApiRequest = async <T>(
  path: string,
  init: RequestInit,
  schema: z.ZodType<T>,
): Promise<T> => {
  const url = `${env.VITE_GMAIL_API_BASE_URL}${path}`

  const makeInit = (token: string): RequestInit => ({
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })

  const token = await getAccessToken({ interactive: false })

  try {
    const json = await fetchJson(url, makeInit(token))
    return schema.parse(json)
  } catch (e) {
    if (e instanceof GmailApiError && e.status === 401) {
      logger.warn('401 from Gmail API; clearing token cache and retrying once.')
      clearInMemoryToken()
      await Promise.allSettled([removeCachedAuthToken(token)])
      const refreshed = await getAccessToken({ interactive: false })
      const json = await fetchJson(url, makeInit(refreshed))
      return schema.parse(json)
    }
    throw e
  }
}
