import { sleep } from '../core/async'
import { identityGetAuthToken, identityRemoveCachedAuthToken } from '../core/chrome'
import { runtimeUnavailableError } from '../core/constants'
import { createLogger } from './logger/logger'

const logger = createLogger('background.auth')

let inMemoryToken: string | null = null
let inflight: Promise<string> | null = null

const getAccessToken = async (options: { interactive: boolean }): Promise<string> => {
  if (inMemoryToken !== null) return inMemoryToken
  if (inflight !== null) return inflight

  const tokenPromise = (async (): Promise<string> => {
    const token = await identityGetAuthToken(options.interactive)
    inMemoryToken = token
    return token
  })().finally(() => void (inflight = null))

  inflight = tokenPromise
  return tokenPromise
}

export const ensureValidToken = async (): Promise<string> =>
  await getAccessToken({ interactive: false })

export const login = async (interactive: boolean): Promise<void> => {
  await getAccessToken({ interactive })
}

export const clearTokenCache = (): void => {
  inMemoryToken = null
}

export const removeCachedAuthToken = async (token: string): Promise<void> => {
  await identityRemoveCachedAuthToken(token)
}

export const revokeTokenBestEffort = async (token: string): Promise<void> => {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  } catch (e) {
    logger.warn('Token revoke failed (best-effort).', {
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

export const logoutBestEffort = async (): Promise<void> => {
  let token: string | null = null
  try {
    token = await ensureValidToken()
  } catch (e) {
    // If runtime is unavailable, this is recoverable by reload; just clear local cache.
    if (e instanceof Error && e.message === runtimeUnavailableError) {
      clearTokenCache()
      return
    }
    token = null
  }

  clearTokenCache()
  if (token === null) return

  await Promise.allSettled([removeCachedAuthToken(token), revokeTokenBestEffort(token)])

  // Give chrome.identity some time to settle to reduce flakiness in immediate re-login.
  await sleep(50)
}
