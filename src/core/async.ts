export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const retry = async <T>(args: {
  attempts: number
  delayMs: number
  fn: () => Promise<T>
  shouldRetry?: (e: unknown) => boolean
}): Promise<T> => {
  const attempt = async (i: number): Promise<T> => {
    try {
      return await args.fn()
    } catch (e) {
      const retryable = args.shouldRetry?.(e) ?? true
      if (!retryable || i >= args.attempts - 1) throw e
      await sleep(args.delayMs)
      return await attempt(i + 1)
    }
  }
  return await attempt(0)
}

export const debounce = <TArgs extends ReadonlyArray<unknown>>(args: {
  waitMs: number
  fn: (...a: TArgs) => void
}): ((...a: TArgs) => void) => {
  let t: number | null = null
  return (...a: TArgs): void => {
    if (t !== null) window.clearTimeout(t)
    t = window.setTimeout(() => {
      t = null
      args.fn(...a)
    }, args.waitMs)
  }
}
