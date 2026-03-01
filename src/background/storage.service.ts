import { z } from 'zod'

import { storageLocalGet, storageLocalSet } from '../core/chrome'
import { storageKeys } from '../core/constants'

const scanMetaSchema = z
  .object({
    lastScanAt: z.number().int().optional(),
    lastHistoryId: z.string().optional(),
  })
  .strict()

export type ScanMeta = z.infer<typeof scanMetaSchema>

// Phase 1 placeholders (explicit API; used in Phase 2)
const invoiceSchema = z
  .object({
    id: z.string().min(1),
    sourceMessageId: z.string().optional(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
    data: z.unknown().optional(),
  })
  .strict()

export type Invoice = z.infer<typeof invoiceSchema>

const messageSchema = z
  .object({
    id: z.string().min(1),
    threadId: z.string().optional(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
    data: z.unknown().optional(),
  })
  .strict()

export type StoredMessage = z.infer<typeof messageSchema>

const invoicesSchema = z.array(invoiceSchema)
const messagesSchema = z.array(messageSchema)

export const getScanMeta = async (): Promise<ScanMeta> => {
  const raw = await storageLocalGet<unknown>(storageKeys.scanMeta)
  if (raw === undefined) return {}
  return scanMetaSchema.parse(raw)
}

export const setScanMeta = async (meta: ScanMeta): Promise<void> => {
  await storageLocalSet(storageKeys.scanMeta, scanMetaSchema.parse(meta))
}

export const getInvoices = async (): Promise<Invoice[]> => {
  const raw = await storageLocalGet<unknown>(storageKeys.invoices)
  if (raw === undefined) return []
  return invoicesSchema.parse(raw)
}

export const upsertInvoice = async (invoice: Invoice): Promise<void> => {
  const list = await getInvoices()
  const idx = list.findIndex((x) => x.id === invoice.id)
  const next = [...list]
  if (idx === -1) next.push(invoice)
  else next[idx] = invoice
  await storageLocalSet(storageKeys.invoices, invoicesSchema.parse(next))
}

export const getMessages = async (): Promise<StoredMessage[]> => {
  const raw = await storageLocalGet<unknown>(storageKeys.messages)
  if (raw === undefined) return []
  return messagesSchema.parse(raw)
}

export const upsertMessage = async (message: StoredMessage): Promise<void> => {
  const list = await getMessages()
  const idx = list.findIndex((x) => x.id === message.id)
  const next = [...list]
  if (idx === -1) next.push(message)
  else next[idx] = message
  await storageLocalSet(storageKeys.messages, messagesSchema.parse(next))
}
