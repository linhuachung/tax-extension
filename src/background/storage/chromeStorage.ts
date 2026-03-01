export const storageGet = <T>(key: string): Promise<T | undefined> =>
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

export const storageSet = <T>(key: string, value: T): Promise<void> =>
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

export const storageRemove = (key: string): Promise<void> =>
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
