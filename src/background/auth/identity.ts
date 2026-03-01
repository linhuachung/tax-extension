import { createLogger } from '../logger/logger'

const logger = createLogger('background.auth')

let inMemoryToken: string | null = null
let inflight: Promise<string> | null = null

const getAuthToken = (interactive: boolean): Promise<string> =>
  new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (result: chrome.identity.GetAuthTokenResult) => {
      const err = chrome.runtime.lastError
      if (err !== undefined) {
        reject(new Error(err.message))
        return
      }
      const token = result.token
      if (token === undefined || token.length === 0) {
        reject(new Error('No OAuth token returned by chrome.identity'))
        return
      }
      resolve(token)
    })
  })

export const getAccessToken = async (options: { interactive: boolean }): Promise<string> => {
  if (inMemoryToken !== null) return inMemoryToken
  if (inflight !== null) return inflight

  const tokenPromise = (async (): Promise<string> => {
    const token = await getAuthToken(options.interactive)
    inMemoryToken = token
    return token
  })().finally((): void => {
    inflight = null
  })

  inflight = tokenPromise
  return tokenPromise
}

export const tryGetAccessToken = async (): Promise<string | null> => {
  try {
    return await getAccessToken({ interactive: false })
  } catch {
    return null
  }
}

export const removeCachedAuthToken = (token: string): Promise<void> =>
  new Promise((resolve, reject) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      const err = chrome.runtime.lastError
      if (err !== undefined) {
        reject(new Error(err.message))
        return
      }
      resolve()
    })
  })

export const revokeTokenBestEffort = async (token: string): Promise<void> => {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (e) {
    logger.warn('Token revoke failed (best-effort).', {
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

export const clearInMemoryToken = (): void => {
  inMemoryToken = null
}

export const logoutBestEffort = async (): Promise<void> => {
  const token = await tryGetAccessToken()
  if (token === null) {
    clearInMemoryToken()
    return
  }

  clearInMemoryToken()

  await Promise.allSettled([removeCachedAuthToken(token), revokeTokenBestEffort(token)])
}
