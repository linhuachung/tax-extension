import { useEffect, useState } from 'react'

import { runtimeUnavailableError } from '../../core/constants'
import { messageType } from '../../domain/rpc/contracts'
import type { BackgroundViewState } from '../../domain/schemas/state'
import { callBackgroundState, RpcError } from '../../services/rpcClient'

export type UiError = {
  title: string
  details: string | null
} | null

const toUiError = (e: unknown): UiError => {
  if (e instanceof RpcError) {
    const title =
      e.appError.message === runtimeUnavailableError
        ? runtimeUnavailableError
        : `${e.code}: ${e.appError.message}`
    return { title, details: null }
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
      promise: callBackgroundState(messageType.appGetState, {}),
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
        promise: callBackgroundState(messageType.authLogin, { interactive: true }),
      }),
    logout: () =>
      runRpc({
        setBusy,
        setState,
        setUiError,
        promise: callBackgroundState(messageType.authLogout, {}),
      }),
    refreshProfile: () =>
      runRpc({
        setBusy,
        setState,
        setUiError,
        promise: callBackgroundState(messageType.gmailGetProfile, {}),
      }),
  }
}
