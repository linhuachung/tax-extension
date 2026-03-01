import { z } from 'zod'

import { backgroundViewStateSchema } from '../schemas/state'

/** Normalized error at RPC boundary: no raw Error or stack. */
export const normalizedAppErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
})
export type NormalizedAppError = z.infer<typeof normalizedAppErrorSchema>

const authLoginPayloadSchema = z
  .object({
    interactive: z.boolean().optional(),
  })
  .strict()
const emptyPayloadSchema = z.object({}).strict()

export const messageType = {
  authLogin: 'auth.login',
  authLogout: 'auth.logout',
  gmailGetProfile: 'gmail.getProfile',
  appGetState: 'app.getState',
} as const

type AuthLoginPayload = z.infer<typeof authLoginPayloadSchema>
type EmptyPayload = z.infer<typeof emptyPayloadSchema>
type RpcOkData = { state: z.infer<typeof backgroundViewStateSchema> }

/** Strict RPC map: request/response per type. No string literals at call sites. */
export type RpcMap = {
  [messageType.authLogin]: {
    request: AuthLoginPayload
    response: RpcOkData
  }
  [messageType.authLogout]: {
    request: EmptyPayload
    response: RpcOkData
  }
  [messageType.gmailGetProfile]: {
    request: EmptyPayload
    response: RpcOkData
  }
  [messageType.appGetState]: {
    request: EmptyPayload
    response: RpcOkData
  }
}

export type RpcType = keyof RpcMap

export type RpcRequest<T extends RpcType = RpcType> = {
  requestId: string
  type: T
  payload: RpcMap[T]['request']
}

export type RpcOkResponse<T extends RpcType = RpcType> = {
  requestId: string
  type: T
  ok: true
  data: RpcMap[T]['response']
}

export type RpcErrResponse<T extends RpcType = RpcType> = {
  requestId: string
  type: T
  ok: false
  error: NormalizedAppError
}

export type RpcResponse<T extends RpcType = RpcType> = RpcOkResponse<T> | RpcErrResponse<T>

const rpcTypeSchema = z.enum([
  messageType.authLogin,
  messageType.authLogout,
  messageType.gmailGetProfile,
  messageType.appGetState,
])

const baseRequestSchema = z.object({
  requestId: z.string().min(1),
})

export const rpcRequestSchema = z.discriminatedUnion('type', [
  baseRequestSchema.extend({
    type: z.literal(messageType.authLogin),
    payload: authLoginPayloadSchema,
  }),
  baseRequestSchema.extend({
    type: z.literal(messageType.authLogout),
    payload: emptyPayloadSchema,
  }),
  baseRequestSchema.extend({
    type: z.literal(messageType.gmailGetProfile),
    payload: emptyPayloadSchema,
  }),
  baseRequestSchema.extend({
    type: z.literal(messageType.appGetState),
    payload: emptyPayloadSchema,
  }),
])

export const rpcOkResponseSchema = z.object({
  requestId: z.string().min(1),
  type: rpcTypeSchema,
  ok: z.literal(true),
  data: z.object({
    state: backgroundViewStateSchema,
  }),
})

export const rpcErrResponseSchema = z.object({
  requestId: z.string().min(1),
  type: rpcTypeSchema,
  ok: z.literal(false),
  error: normalizedAppErrorSchema,
})

export const rpcResponseSchema = z.union([rpcOkResponseSchema, rpcErrResponseSchema])
