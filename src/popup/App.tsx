import { type ReactElement, useEffect, useState } from 'react'

import { callBackground, RpcError } from '../services/rpcClient'
import type { BackgroundViewState } from '../shared/schemas/state'

type UiError = {
  title: string
  details: string | null
} | null

const formatTs = (ms: number | undefined): string => {
  if (ms === undefined) return '—'
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return String(ms)
  }
}

const statusLabel = (status: BackgroundViewState['auth']['status']): string => {
  if (status === 'signed_in') return 'Signed in'
  if (status === 'signed_out') return 'Signed out'
  if (status === 'signing_in') return 'Signing in…'
  if (status === 'signing_out') return 'Signing out…'
  return 'Error'
}

const badgeClassFor = (status: BackgroundViewState['auth']['status'] | undefined): string => {
  if (status === 'signed_in') return 'badge ok'
  if (status === 'error') return 'badge danger'
  return 'badge'
}

const toUiError = (e: unknown): UiError => {
  if (e instanceof RpcError) {
    const details = e.details !== undefined ? JSON.stringify(e.details, null, 2) : null
    return { title: `${e.code}: ${e.message}`, details }
  }
  if (e instanceof Error) return { title: e.message, details: null }
  return { title: String(e), details: null }
}

const errorFromState = (state: BackgroundViewState | null): UiError => {
  const lastError = state?.auth.lastError
  if (lastError === undefined) return null
  const details =
    lastError.details !== undefined ? JSON.stringify(lastError.details, null, 2) : null
  return { title: `${lastError.code}: ${lastError.message}`, details }
}

const runRpc = (args: {
  promise: Promise<BackgroundViewState>
  setBusy: (busy: boolean) => void
  setState: (state: BackgroundViewState) => void
  setUiError: (error: UiError) => void
}): void => {
  args.setBusy(true)
  args.setUiError(null)
  args.promise
    .then((next) => {
      args.setState(next)
    })
    .catch((e: unknown) => {
      args.setUiError(toUiError(e))
    })
    .finally(() => {
      args.setBusy(false)
    })
}

const header = (args: {
  badgeClass: string
  authStatus: BackgroundViewState['auth']['status'] | undefined
}): ReactElement => (
  <div className="header">
    <div className="title">
      <h1>VAT Invoice Intelligence</h1>
      <div className="subtitle">Phase 1 — Auth + Gmail Profile</div>
    </div>
    <div className={args.badgeClass}>
      {args.authStatus === undefined ? 'Loading…' : statusLabel(args.authStatus)}
    </div>
  </div>
)

const errorBox = (error: UiError): ReactElement | null => {
  if (error === null) return null
  return (
    <div className="errorBox">
      <div>{error.title}</div>
      {error.details === null ? null : <div className="muted">{error.details}</div>}
    </div>
  )
}

const accountPanel = (auth: BackgroundViewState['auth'] | undefined): ReactElement => (
  <div className="panel">
    <div className="row">
      <div className="label">Account</div>
      <div className="value">{auth?.email ?? '—'}</div>
    </div>
    <div className="row">
      <div className="label">Last login</div>
      <div className="value">{formatTs(auth?.lastLoginAt)}</div>
    </div>
    <div className="row">
      <div className="label">Last logout</div>
      <div className="value">{formatTs(auth?.lastLogoutAt)}</div>
    </div>
  </div>
)

const actions = (args: {
  busy: boolean
  onLogin: () => void
  onLogout: () => void
  onRefreshProfile: () => void
}): ReactElement => (
  <div className="actions">
    <button className="primary" disabled={args.busy} onClick={args.onLogin}>
      Login
    </button>
    <button className="danger" disabled={args.busy} onClick={args.onLogout}>
      Logout
    </button>
    <button disabled={args.busy} onClick={args.onRefreshProfile}>
      Refresh Profile
    </button>
  </div>
)

const gmailPanel = (gmail: BackgroundViewState['gmail'] | undefined): ReactElement => (
  <div className="panel">
    <div className="row">
      <div className="label">Messages</div>
      <div className="value">{gmail?.profile?.messagesTotal ?? '—'}</div>
    </div>
    <div className="row">
      <div className="label">Threads</div>
      <div className="value">{gmail?.profile?.threadsTotal ?? '—'}</div>
    </div>
    <div className="row">
      <div className="label">historyId</div>
      <div className="value">{gmail?.profile?.historyId ?? '—'}</div>
    </div>
    <div className="row">
      <div className="label">Last fetched</div>
      <div className="value">{formatTs(gmail?.lastProfileFetchedAt)}</div>
    </div>
  </div>
)

const footerNote = (): ReactElement => (
  <div className="footerNote">
    Popup is a thin UI client. All OAuth + Gmail API calls run in the MV3 background service worker.
  </div>
)

const usePopupController = (): {
  state: BackgroundViewState | null
  busy: boolean
  badgeClass: string
  error: UiError
  login: () => void
  logout: () => void
  refreshProfile: () => void
} => {
  const [state, setState] = useState<BackgroundViewState | null>(null)
  const [busy, setBusy] = useState(false)
  const [uiError, setUiError] = useState<UiError>(null)

  useEffect(() => {
    runRpc({
      setBusy,
      setState,
      setUiError,
      promise: callBackground('app.getState', {}),
    })
  }, [setBusy, setState, setUiError])

  return {
    state,
    busy,
    badgeClass: badgeClassFor(state?.auth.status),
    error: uiError ?? errorFromState(state),
    login: () =>
      runRpc({
        setBusy,
        setState,
        setUiError,
        promise: callBackground('auth.login', { interactive: true }),
      }),
    logout: () =>
      runRpc({
        setBusy,
        setState,
        setUiError,
        promise: callBackground('auth.logout', {}),
      }),
    refreshProfile: () =>
      runRpc({
        setBusy,
        setState,
        setUiError,
        promise: callBackground('gmail.getProfile', {}),
      }),
  }
}

const layout = (args: {
  badgeClass: string
  busy: boolean
  error: UiError
  gmail: BackgroundViewState['gmail'] | undefined
  login: () => void
  logout: () => void
  refreshProfile: () => void
  auth: BackgroundViewState['auth'] | undefined
}): ReactElement => (
  <div className="container">
    {header({ badgeClass: args.badgeClass, authStatus: args.auth?.status })}
    {errorBox(args.error)}
    {accountPanel(args.auth)}
    {actions({
      busy: args.busy,
      onLogin: args.login,
      onLogout: args.logout,
      onRefreshProfile: args.refreshProfile,
    })}
    {gmailPanel(args.gmail)}
    {footerNote()}
  </div>
)

const useApp = (): ReactElement => {
  const controller = usePopupController()

  return layout({
    badgeClass: controller.badgeClass,
    busy: controller.busy,
    error: controller.error,
    gmail: controller.state?.gmail,
    login: controller.login,
    logout: controller.logout,
    refreshProfile: controller.refreshProfile,
    auth: controller.state?.auth,
  })
}

export default useApp
