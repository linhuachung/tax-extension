import { useEffect, useState } from 'react'

import { messageType, runtimeUnavailableError } from '../../core/constants'
import { callBackground, RpcError } from '../../services/rpcClient'
import type { BackgroundViewState } from '../../shared/schemas/state'

export type UiError = {
  title: string
  details: string | null
} | null

const toUiError = (e: unknown): UiError => {
  if (e instanceof RpcError) {
    const details = e.details !== undefined ? JSON.stringify(e.details, null, 2) : null
    const title =
      e.message === runtimeUnavailableError ? runtimeUnavailableError : `${e.domain}: ${e.message}`
    return { title, details }
  }
  if (e instanceof Error) return { title: e.message, details: null }
  return { title: String(e), details: null }
}

const errorFromState = (state: BackgroundViewState | null): UiError => {
  const lastError = state?.auth.lastError
  if (lastError === undefined) return null
  const details =
    lastError.details !== undefined ? JSON.stringify(lastError.details, null, 2) : null
  const title =
    lastError.message === runtimeUnavailableError
      ? runtimeUnavailableError
      : `${lastError.domain}: ${lastError.message}`
  return { title, details }
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

export const usePopupController = (): {
  state: BackgroundViewState | null
  busy: boolean
  error: UiError
  login: () => void
  logout: () => void
  refreshProfile: () => void
  runtimeUnavailableError: string
} => {
  const [state, setState] = useState<BackgroundViewState | null>(null)
  const [busy, setBusy] = useState(false)
  const [uiError, setUiError] = useState<UiError>(null)

  useEffect(() => {
    runRpc({
      setBusy,
      setState,
      setUiError,
      promise: callBackground(messageType.appGetState, {}),
    })
  }, [setBusy, setState, setUiError])

  return {
    state,
    busy,
    runtimeUnavailableError,
    error: uiError ?? errorFromState(state),
    login: () =>
      runRpc({
        setBusy,
        setState,
        setUiError,
        promise: callBackground(messageType.authLogin, { interactive: true }),
      }),
    logout: () =>
      runRpc({
        setBusy,
        setState,
        setUiError,
        promise: callBackground(messageType.authLogout, {}),
      }),
    refreshProfile: () =>
      runRpc({
        setBusy,
        setState,
        setUiError,
        promise: callBackground(messageType.gmailGetProfile, {}),
      }),
  }
}
