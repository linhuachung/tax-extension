import { runtimeSendMessage } from '../core/chrome'
import {
  type NormalizedAppError,
  type RpcMap,
  type RpcRequest,
  rpcRequestSchema,
  rpcResponseSchema,
  type RpcType,
} from '../domain/rpc/contracts'
import type { BackgroundViewState } from '../domain/schemas/state'
import { newRequestId } from '../domain/utils/ids'

export class RpcError extends Error {
  readonly code: NormalizedAppError['code']
  readonly appError: NormalizedAppError

  constructor(appError: NormalizedAppError) {
    super(appError.message)
    this.name = 'RpcError'
    this.appError = appError
    this.code = appError.code
  }
}

export const callBackground = async <T extends RpcType>(
  type: T,
  payload: RpcMap[T]['request'],
): Promise<RpcMap[T]['response']> => {
  const requestId = newRequestId()
  const request: RpcRequest<T> = { requestId, type, payload }
  rpcRequestSchema.parse(request)

  const rawResponse = await runtimeSendMessage<RpcRequest<T>, unknown>(request)
  const response = rpcResponseSchema.parse(rawResponse)

  if (response.requestId !== requestId) {
    throw new Error(
      `Mismatched response requestId. expected=${requestId} got=${response.requestId}`,
    )
  }

  if (!response.ok) throw new RpcError(response.error)
  return response.data
}

/** Convenience: call and return state (for appGetState, authLogin, etc.). */
export const callBackgroundState = async <T extends RpcType>(
  type: T,
  payload: RpcMap[T]['request'],
): Promise<BackgroundViewState> => {
  const data = await callBackground(type, payload)
  return data.state
}

export type { BackgroundViewState }
