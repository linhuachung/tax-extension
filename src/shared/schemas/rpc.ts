import { z } from 'zod'

import { messageType } from '../../core/constants'
import { appErrorSchema } from './errors'
import { backgroundViewStateSchema } from './state'

export const rpcTypeSchema = z.enum([
  messageType.authLogin,
  messageType.authLogout,
  messageType.gmailGetProfile,
  messageType.appGetState,
])

export type RpcType = z.infer<typeof rpcTypeSchema>

const baseRequestSchema = z.object({
  requestId: z.string().min(1),
})

export const rpcRequestSchema = z.discriminatedUnion('type', [
  baseRequestSchema.extend({
    type: z.literal(messageType.authLogin),
    payload: z
      .object({
        interactive: z.boolean().optional(),
      })
      .strict(),
  }),
  baseRequestSchema.extend({
    type: z.literal(messageType.authLogout),
    payload: z.object({}).strict(),
  }),
  baseRequestSchema.extend({
    type: z.literal(messageType.gmailGetProfile),
    payload: z.object({}).strict(),
  }),
  baseRequestSchema.extend({
    type: z.literal(messageType.appGetState),
    payload: z.object({}).strict(),
  }),
])

export type RpcRequest = z.infer<typeof rpcRequestSchema>

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
  error: appErrorSchema,
})

export const rpcResponseSchema = z.union([rpcOkResponseSchema, rpcErrResponseSchema])
export type RpcResponse = z.infer<typeof rpcResponseSchema>
