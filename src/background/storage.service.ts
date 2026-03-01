import { z } from 'zod'

import { storageLocalGet, storageLocalSet } from '../core/chrome'
import { storageKeys } from '../core/constants'

const storageVersion = 1

const scanMetaSchema = z
  .object({
    lastScanAt: z.number().int().optional(),
    lastHistoryId: z.string().optional(),
  })
  .strict()

export type ScanMeta = z.infer<typeof scanMetaSchema>

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

const storageRootSchema = z
  .object({
    version: z.literal(storageVersion),
    scanMeta: scanMetaSchema,
    invoices: z.array(invoiceSchema),
    messages: z.array(messageSchema),
  })
  .strict()

type StorageRoot = z.infer<typeof storageRootSchema>

const defaultRoot = (): StorageRoot => ({
  version: storageVersion,
  scanMeta: {},
  invoices: [],
  messages: [],
})

/** Migration hook: map old or unknown storage shape to current root. No silent wipe. */
const migrateStorage = (oldRoot: unknown): StorageRoot => {
  const parsed = storageRootSchema.safeParse(oldRoot)
  if (parsed.success && parsed.data.version === storageVersion) return parsed.data
  return defaultRoot()
}

const readRoot = async (): Promise<StorageRoot> => {
  const raw = await storageLocalGet<unknown>(storageKeys.storageRoot)
  if (raw === undefined) return defaultRoot()
  return migrateStorage(raw)
}

const writeRoot = async (root: StorageRoot): Promise<void> => {
  await storageLocalSet(storageKeys.storageRoot, storageRootSchema.parse(root))
}

const updateRoot = async (updater: (prev: StorageRoot) => StorageRoot): Promise<void> => {
  const prev = await readRoot()
  const next = updater(prev)
  await writeRoot(next)
}

export const getScanMeta = async (): Promise<ScanMeta> => {
  const root = await readRoot()
  return { ...root.scanMeta }
}

export const setScanMeta = async (meta: ScanMeta): Promise<void> => {
  await updateRoot((root) => ({
    ...root,
    scanMeta: scanMetaSchema.parse(meta),
  }))
}

export const getInvoices = async (): Promise<Invoice[]> => {
  const root = await readRoot()
  return [...root.invoices]
}

export const upsertInvoice = async (invoice: Invoice): Promise<void> => {
  await updateRoot((root) => {
    const list = [...root.invoices]
    const idx = list.findIndex((x) => x.id === invoice.id)
    const nextInvoice = invoiceSchema.parse(invoice)
    if (idx === -1) list.push(nextInvoice)
    else list[idx] = nextInvoice
    return { ...root, invoices: list }
  })
}

export const getMessages = async (): Promise<StoredMessage[]> => {
  const root = await readRoot()
  return [...root.messages]
}

export const upsertMessage = async (message: StoredMessage): Promise<void> => {
  await updateRoot((root) => {
    const list = [...root.messages]
    const idx = list.findIndex((x) => x.id === message.id)
    const nextMessage = messageSchema.parse(message)
    if (idx === -1) list.push(nextMessage)
    else list[idx] = nextMessage
    return { ...root, messages: list }
  })
}
