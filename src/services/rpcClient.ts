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
  readonly code: AppError['code']
  readonly details?: AppError['details']
  readonly appError: AppError

  constructor(appError: AppError) {
    super(appError.message)
    this.name = 'RpcError'
    this.appError = appError
    this.code = appError.code
    this.details = appError.details
  }
}

type RequestByType<T extends RpcType> = Extract<RpcRequest, { type: T }>

const sendMessage = <TReq, TRes>(request: TReq): Promise<TRes> =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(request, (response: TRes) => {
      const err = chrome.runtime.lastError
      if (err !== undefined) {
        reject(new Error(err.message))
        return
      }
      resolve(response)
    })
  })

export const callBackground = async <T extends RpcType>(
  type: T,
  payload: RequestByType<T>['payload'],
): Promise<BackgroundViewState> => {
  const requestId = newRequestId()
  const request = rpcRequestSchema.parse({ requestId, type, payload })

  const rawResponse = await sendMessage<typeof request, unknown>(request)
  const response = rpcResponseSchema.parse(rawResponse)

  if (response.requestId !== requestId) {
    throw new Error(
      `Mismatched response requestId. expected=${requestId} got=${response.requestId}`,
    )
  }

  if (!response.ok) throw new RpcError(response.error)
  return response.data.state
}
