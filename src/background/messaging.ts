import { ZodError } from 'zod'

import { messageType } from '../core/constants'
import { toAppError } from '../core/errors'
import { type RpcRequest, rpcRequestSchema, type RpcResponse } from '../shared/schemas/rpc'
import type { BackgroundViewState } from '../shared/schemas/state'
import { env } from '../shared/utils/env'
import { ensureValidToken, login, logoutBestEffort } from './auth.service'
import { fetchGmailProfile } from './gmail.client'
import { createLogger } from './logger/logger'
import { backgroundStore, getViewState, hydrateFromStorage, persistToStorage } from './state'

const logger = createLogger('background.messaging')

const ok = (req: RpcRequest, state: BackgroundViewState): RpcResponse => ({
  requestId: req.requestId,
  type: req.type,
  ok: true,
  data: { state },
})

const err = (
  req: RpcRequest,
  domain: 'auth' | 'gmail' | 'storage' | 'scan',
  e: unknown,
): RpcResponse => ({
  requestId: req.requestId,
  type: req.type,
  ok: false,
  error: toAppError(domain, e),
})

const getStringField = (obj: unknown, field: string): string | undefined => {
  if (typeof obj !== 'object' || obj === null) return undefined
  const v = (obj as Record<string, unknown>)[field]
  return typeof v === 'string' ? v : undefined
}

const handleAuthLogin = async (
  req: Extract<RpcRequest, { type: typeof messageType.authLogin }>,
): Promise<RpcResponse> => {
  const interactive = req.payload.interactive ?? true
  backgroundStore.getState().setAuth({ status: 'signing_in', lastError: undefined })
  await persistToStorage()

  try {
    await login(interactive)
  } catch (e) {
    backgroundStore.getState().setAuth({ status: 'error', lastError: toAppError('auth', e) })
    await persistToStorage()
    return err(req, 'auth', e)
  }

  backgroundStore.getState().setAuth({
    status: 'signed_in',
    lastLoginAt: Date.now(),
    lastError: undefined,
  })

  try {
    const profile = await fetchGmailProfile()
    backgroundStore.getState().setAuth({ email: profile.emailAddress, lastError: undefined })
    backgroundStore.getState().setGmail({ profile, lastProfileFetchedAt: Date.now() })
  } catch (e) {
    // Login succeeded; profile fetch failure is surfaced as recoverable error in state.
    backgroundStore.getState().setAuth({ lastError: toAppError('gmail', e) })
  }

  await persistToStorage()
  return ok(req, getViewState())
}

const handleAuthLogout = async (
  req: Extract<RpcRequest, { type: typeof messageType.authLogout }>,
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
  backgroundStore.getState().setGmail({ profile: undefined, lastProfileFetchedAt: undefined })

  await persistToStorage()
  return ok(req, getViewState())
}

const handleGmailGetProfile = async (
  req: Extract<RpcRequest, { type: typeof messageType.gmailGetProfile }>,
): Promise<RpcResponse> => {
  try {
    const profile = await fetchGmailProfile()
    backgroundStore.getState().setAuth({
      status: 'signed_in',
      email: profile.emailAddress,
      lastError: undefined,
    })
    backgroundStore.getState().setGmail({ profile, lastProfileFetchedAt: Date.now() })
    await persistToStorage()
    return ok(req, getViewState())
  } catch (e) {
    backgroundStore.getState().setAuth({ lastError: toAppError('gmail', e) })
    await persistToStorage()
    return err(req, 'gmail', e)
  }
}

export const initBackground = async (): Promise<void> => {
  logger.info('Service worker boot', { mode: env.MODE, phase: env.VITE_APP_PHASE })
  await hydrateFromStorage()

  try {
    await ensureValidToken()
    backgroundStore.getState().setAuth({ status: 'signed_in', lastError: undefined })
  } catch {
    backgroundStore.getState().setAuth({
      status: 'signed_out',
      email: undefined,
      lastError: undefined,
    })
  }

  // Intentionally do not auto-fetch profile on boot to avoid unexpected network work.
  await persistToStorage()
}

export const registerMessaging = (): void => {
  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    const requestId = getStringField(message, 'requestId') ?? 'unknown'

    const handleMessage = async (): Promise<RpcResponse> => {
      const parsed = rpcRequestSchema.safeParse(message)
      if (!parsed.success) {
        const e = parsed.error
        const error = e instanceof ZodError ? toAppError('storage', e) : toAppError('storage', e)
        return { requestId, type: messageType.appGetState, ok: false, error }
      }

      const req = parsed.data
      logger.debug('RPC request', { from: sender.id, type: req.type })

      if (req.type === messageType.authLogin) return await handleAuthLogin(req)
      if (req.type === messageType.authLogout) return await handleAuthLogout(req)
      if (req.type === messageType.gmailGetProfile) return await handleGmailGetProfile(req)
      return ok(req, getViewState())
    }

    handleMessage()
      .then((response) => {
        sendResponse(response)
      })
      .catch((e) => {
        sendResponse({
          requestId,
          type: messageType.appGetState,
          ok: false,
          error: toAppError('storage', e),
        })
      })

    return true
  })
}
