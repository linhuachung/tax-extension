export const storageKeys = {
  persistedBackgroundState: 'taxintel.persist.v1',
  scanMeta: 'taxintel.scan.meta.v1',
  invoices: 'taxintel.invoices.v1',
  messages: 'taxintel.messages.v1',
} as const

export const messageType = {
  authLogin: 'auth.login',
  authLogout: 'auth.logout',
  gmailGetProfile: 'gmail.getProfile',
  appGetState: 'app.getState',
} as const

export const runtimeUnavailableError = 'runtime_unavailable'
