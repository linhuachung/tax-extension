export const storageKeys = {
  persistedBackgroundState: 'taxintel.persist.v1',
  storageRoot: 'taxintel.storage.v1',
  scanMeta: 'taxintel.scan.meta.v1',
  invoices: 'taxintel.invoices.v1',
  messages: 'taxintel.messages.v1',
} as const

export const runtimeUnavailableError = 'runtime_unavailable'
