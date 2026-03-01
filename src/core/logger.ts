const isDev =
  typeof import.meta !== 'undefined' && import.meta.env?.DEV === true
    ? true
    : typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'

export const log = {
  debug: (...args: unknown[]): void => {
    if (isDev) console.warn(...args)
  },
  info: (...args: unknown[]): void => {
    if (isDev) console.warn(...args)
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args)
  },
  error: (...args: unknown[]): void => {
    console.error(...args)
  },
}
