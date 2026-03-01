import { addRuntimeMessageListener } from '../core/chrome'
import { normalizeError, toAppError } from '../core/errors'
import {
  messageType,
  type RpcRequest,
  rpcRequestSchema,
  type RpcResponse,
} from '../domain/rpc/contracts'
import type { BackgroundViewState } from '../domain/schemas/state'
import { env } from '../domain/utils/env'
import { ensureValidToken, login, logoutBestEffort } from './auth.service'
import { fetchGmailProfile } from './gmail.client'
import { createLogger } from './logger/logger'
import { getViewState, hydrateFromStorage, patchAuth, patchGmail, persistToStorage } from './state'

const logger = createLogger('background.messaging')

const ok = (req: RpcRequest, state: BackgroundViewState): RpcResponse => ({
  requestId: req.requestId,
  type: req.type,
  ok: true,
  data: { state },
})

const err = (req: RpcRequest, code: string, e: unknown): RpcResponse => ({
  requestId: req.requestId,
  type: req.type,
  ok: false,
  error: normalizeError(e, code),
})

const getStringField = (obj: unknown, field: string): string | undefined => {
  if (typeof obj !== 'object' || obj === null) return undefined
  const v = (obj as Record<string, unknown>)[field]
  return typeof v === 'string' ? v : undefined
}

const handleAuthLogin = async (
  req: RpcRequest<typeof messageType.authLogin>,
): Promise<RpcResponse> => {
  const interactive = req.payload.interactive ?? true
  patchAuth({ status: 'signing_in', lastError: undefined })
  await persistToStorage()

  try {
    await login(interactive)
  } catch (e) {
    patchAuth({ status: 'error', lastError: toAppError('auth', e) })
    await persistToStorage()
    return err(req, 'auth', e)
  }

  patchAuth({
    status: 'signed_in',
    lastLoginAt: Date.now(),
    lastError: undefined,
  })

  try {
    const profile = await fetchGmailProfile()
    patchAuth({ email: profile.emailAddress, lastError: undefined })
    patchGmail({ profile, lastProfileFetchedAt: Date.now() })
  } catch (e) {
    patchAuth({ lastError: toAppError('gmail', e) })
  }

  await persistToStorage()
  return ok(req, getViewState())
}

const handleAuthLogout = async (
  req: RpcRequest<typeof messageType.authLogout>,
): Promise<RpcResponse> => {
  patchAuth({ status: 'signing_out', lastError: undefined })
  await persistToStorage()

  await logoutBestEffort()

  patchAuth({
    status: 'signed_out',
    email: undefined,
    lastLogoutAt: Date.now(),
    lastError: undefined,
  })
  patchGmail({ profile: undefined, lastProfileFetchedAt: undefined })

  await persistToStorage()
  return ok(req, getViewState())
}

const handleGmailGetProfile = async (
  req: RpcRequest<typeof messageType.gmailGetProfile>,
): Promise<RpcResponse> => {
  try {
    const profile = await fetchGmailProfile()
    patchAuth({
      status: 'signed_in',
      email: profile.emailAddress,
      lastError: undefined,
    })
    patchGmail({ profile, lastProfileFetchedAt: Date.now() })
    await persistToStorage()
    return ok(req, getViewState())
  } catch (e) {
    patchAuth({ lastError: toAppError('gmail', e) })
    await persistToStorage()
    return err(req, 'gmail', e)
  }
}

export const initBackground = async (): Promise<void> => {
  logger.info('Service worker boot', { mode: env.MODE, phase: env.VITE_APP_PHASE })
  await hydrateFromStorage()

  try {
    await ensureValidToken()
    patchAuth({ status: 'signed_in', lastError: undefined })
  } catch {
    patchAuth({
      status: 'signed_out',
      email: undefined,
      lastError: undefined,
    })
  }

  await persistToStorage()
}

export const registerMessaging = (): void => {
  addRuntimeMessageListener((message: unknown, sender, sendResponse) => {
    const requestId = getStringField(message, 'requestId') ?? 'unknown'

    const handleMessage = async (): Promise<RpcResponse> => {
      try {
        const parsed = rpcRequestSchema.safeParse(message)
        if (!parsed.success) {
          return {
            requestId,
            type: messageType.appGetState,
            ok: false,
            error: normalizeError(parsed.error, 'storage'),
          }
        }

        const req = parsed.data as RpcRequest
        logger.debug('RPC request', { from: sender.id, type: req.type })

        if (req.type === messageType.authLogin)
          return await handleAuthLogin(req as RpcRequest<typeof messageType.authLogin>)
        if (req.type === messageType.authLogout)
          return await handleAuthLogout(req as RpcRequest<typeof messageType.authLogout>)
        if (req.type === messageType.gmailGetProfile)
          return await handleGmailGetProfile(req as RpcRequest<typeof messageType.gmailGetProfile>)
        return ok(req, getViewState())
      } catch (e) {
        return {
          requestId,
          type: messageType.appGetState,
          ok: false,
          error: normalizeError(e, 'storage'),
        }
      }
    }

    void handleMessage().then((response) => {
      sendResponse(response)
    })

    return true
  })
}
