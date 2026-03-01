import { ZodError } from 'zod'

import type { AppError, AppErrorCode } from '../shared/schemas/errors'
import { type RpcRequest, rpcRequestSchema, type RpcResponse } from '../shared/schemas/rpc'
import type { BackgroundViewState } from '../shared/schemas/state'
import { env } from '../shared/utils/env'
import { getAccessToken, logoutBestEffort, tryGetAccessToken } from './auth/identity'
import { GmailApiError } from './gmail/api'
import { fetchGmailProfile } from './gmail/profile'
import { createLogger } from './logger/logger'
import {
  backgroundStore,
  getViewState,
  hydrateFromStorage,
  persistToStorage,
} from './storage/appStore'

const logger = createLogger('background')

const makeAppError = (code: AppErrorCode, message: string, details?: unknown): AppError => ({
  code,
  message,
  details,
})

const toAppError = (e: unknown): AppError => {
  if (e instanceof GmailApiError) {
    if (e.status === 401) return makeAppError('unauthorized', 'Gmail API unauthorized', e.details)
    return makeAppError('gmail_api_error', `Gmail API error (${e.status})`, e.details)
  }
  if (e instanceof ZodError) {
    return makeAppError('validation_error', 'Schema validation failed', e.flatten())
  }
  if (e instanceof Error) {
    const msg = e.message.length > 0 ? e.message : 'Unknown error'
    if (msg.toLowerCase().includes('oauth') || msg.toLowerCase().includes('identity')) {
      return makeAppError('auth_failed', msg)
    }
    return makeAppError('internal_error', msg)
  }
  return makeAppError('internal_error', 'Unknown error', { raw: String(e) })
}

const ok = (req: RpcRequest, state: BackgroundViewState): RpcResponse => ({
  requestId: req.requestId,
  type: req.type,
  ok: true,
  data: { state },
})

const err = (req: RpcRequest, error: AppError): RpcResponse => ({
  requestId: req.requestId,
  type: req.type,
  ok: false,
  error,
})

const getStringField = (obj: unknown, field: string): string | undefined => {
  if (typeof obj !== 'object' || obj === null) return undefined
  const v = (obj as Record<string, unknown>)[field]
  return typeof v === 'string' ? v : undefined
}

const handleAuthLogin = async (
  req: Extract<RpcRequest, { type: 'auth.login' }>,
): Promise<RpcResponse> => {
  const interactive = req.payload.interactive ?? true
  backgroundStore.getState().setAuth({ status: 'signing_in', lastError: undefined })
  await persistToStorage()

  try {
    await getAccessToken({ interactive })
  } catch (e) {
    const appErr = toAppError(e)
    backgroundStore.getState().setAuth({ status: 'error', lastError: appErr })
    await persistToStorage()
    return err(req, appErr)
  }

  backgroundStore.getState().setAuth({
    status: 'signed_in',
    lastLoginAt: Date.now(),
    lastError: undefined,
  })

  try {
    const profile = await fetchGmailProfile()
    backgroundStore.getState().setAuth({ email: profile.emailAddress, lastError: undefined })
    backgroundStore.getState().setGmail({
      profile,
      lastProfileFetchedAt: Date.now(),
    })
  } catch (e) {
    // Login succeeded; profile fetch failure is surfaced as a recoverable error in state.
    const appErr = toAppError(e)
    backgroundStore.getState().setAuth({ lastError: appErr })
  }

  await persistToStorage()
  return ok(req, getViewState())
}

const handleAuthLogout = async (
  req: Extract<RpcRequest, { type: 'auth.logout' }>,
): Promise<RpcResponse> => {
  backgroundStore.getState().setAuth({ status: 'signing_out', lastError: undefined })
  await persistToStorage()

  await logoutBestEffort()
  backgroundStore.getState().setAuth({
    status: 'signed_out',
    email: undefined,
    lastLogoutAt: Date.now(),
    lastError: undefined,
  })
  backgroundStore.getState().setGmail({
    profile: undefined,
    lastProfileFetchedAt: undefined,
  })

  await persistToStorage()
  return ok(req, getViewState())
}

const handleGmailGetProfile = async (
  req: Extract<RpcRequest, { type: 'gmail.getProfile' }>,
): Promise<RpcResponse> => {
  try {
    const profile = await fetchGmailProfile()
    backgroundStore.getState().setAuth({
      status: 'signed_in',
      email: profile.emailAddress,
      lastError: undefined,
    })
    backgroundStore.getState().setGmail({
      profile,
      lastProfileFetchedAt: Date.now(),
    })
    await persistToStorage()
    return ok(req, getViewState())
  } catch (e) {
    const appErr = toAppError(e)
    backgroundStore.getState().setAuth({ lastError: appErr })
    await persistToStorage()
    return err(req, appErr)
  }
}

const init = async (): Promise<void> => {
  logger.info('Service worker boot', { mode: env.MODE, phase: env.VITE_APP_PHASE })

  await hydrateFromStorage()

  const token = await tryGetAccessToken()
  if (token !== null) {
    backgroundStore.getState().setAuth({ status: 'signed_in', lastError: undefined })
    // NOTE: We intentionally do not auto-fetch profile on boot to avoid unexpected network work.
    await persistToStorage()
  } else {
    backgroundStore.getState().setAuth({
      status: 'signed_out',
      email: undefined,
      lastError: undefined,
    })
    await persistToStorage()
  }
}

init().catch((e) => {
  logger.error('Service worker init failed', { error: toAppError(e) })
})

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: RpcResponse) => void,
  ) => {
    const requestId = getStringField(message, 'requestId') ?? 'unknown'

    const handleMessage = async (): Promise<RpcResponse> => {
      const parsed = rpcRequestSchema.safeParse(message)
      if (!parsed.success) {
        return {
          requestId,
          type: 'app.getState',
          ok: false,
          error: makeAppError('bad_request', 'Invalid RPC request', parsed.error.flatten()),
        }
      }

      const req = parsed.data
      logger.debug('RPC request', { from: sender.id, type: req.type })

      let response: RpcResponse
      if (req.type === 'auth.login') response = await handleAuthLogin(req)
      else if (req.type === 'auth.logout') response = await handleAuthLogout(req)
      else if (req.type === 'gmail.getProfile') response = await handleGmailGetProfile(req)
      else response = ok(req, getViewState())

      return response
    }

    handleMessage()
      .then((response) => {
        sendResponse(response)
      })
      .catch((e) => {
        sendResponse({
          requestId,
          type: 'app.getState',
          ok: false,
          error: toAppError(e),
        })
      })

    return true
  },
)
