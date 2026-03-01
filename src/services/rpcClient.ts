import { runtimeSendMessage } from '../core/chrome'
import type { AppError } from '../shared/schemas/errors'
import {
  type RpcRequest,
  rpcRequestSchema,
  rpcResponseSchema,
  type RpcType,
} from '../shared/schemas/rpc'
import type { BackgroundViewState } from '../shared/schemas/state'
import { newRequestId } from '../shared/utils/ids'

export class RpcError extends Error {
  readonly domain: AppError['domain']
  readonly recoverable: AppError['recoverable']
  readonly details?: AppError['details']
  readonly appError: AppError

  constructor(appError: AppError) {
    super(appError.message)
    this.name = 'RpcError'
    this.appError = appError
    this.domain = appError.domain
    this.recoverable = appError.recoverable
    this.details = appError.details
  }
}

type RequestByType<T extends RpcType> = Extract<RpcRequest, { type: T }>

export const callBackground = async <T extends RpcType>(
  type: T,
  payload: RequestByType<T>['payload'],
): Promise<BackgroundViewState> => {
  const requestId = newRequestId()
  const request = rpcRequestSchema.parse({ requestId, type, payload })

  const rawResponse = await runtimeSendMessage<typeof request, unknown>(request)
  const response = rpcResponseSchema.parse(rawResponse)

  if (response.requestId !== requestId) {
    throw new Error(
      `Mismatched response requestId. expected=${requestId} got=${response.requestId}`,
    )
  }

  if (!response.ok) throw new RpcError(response.error)
  return response.data.state
}
