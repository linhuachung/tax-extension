import { runtimeUnavailableError } from './constants'

export const requireChromeRuntime = (): typeof chrome.runtime => {
  if (typeof chrome === 'undefined' || chrome.runtime === undefined) {
    throw new Error(runtimeUnavailableError)
  }
  return chrome.runtime
}

export const runtimeSendMessage = <TReq, TRes>(request: TReq): Promise<TRes> =>
  new Promise((resolve, reject) => {
    const runtime = requireChromeRuntime()
    runtime.sendMessage(request, (response: TRes) => {
      const err = runtime.lastError
      if (err !== undefined) {
        reject(new Error(err.message))
        return
      }
      resolve(response)
    })
  })

export const storageLocalGet = <T>(key: string): Promise<T | undefined> =>
  new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (items: Record<string, unknown>) => {
      const err = chrome.runtime.lastError
      if (err !== undefined) {
        reject(new Error(err.message))
        return
      }
      resolve(items[key] as T | undefined)
    })
  })

export const storageLocalSet = (key: string, value: unknown): Promise<void> =>
  new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      const err = chrome.runtime.lastError
      if (err !== undefined) {
        reject(new Error(err.message))
        return
      }
      resolve()
    })
  })

export const storageLocalRemove = (key: string): Promise<void> =>
  new Promise((resolve, reject) => {
    chrome.storage.local.remove([key], () => {
      const err = chrome.runtime.lastError
      if (err !== undefined) {
        reject(new Error(err.message))
        return
      }
      resolve()
    })
  })

export const identityGetAuthToken = (interactive: boolean): Promise<string> =>
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

export const identityRemoveCachedAuthToken = (token: string): Promise<void> =>
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
