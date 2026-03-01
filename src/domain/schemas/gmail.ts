import { z } from 'zod'

export const gmailProfileSchema = z.object({
  emailAddress: z.string().email(),
  messagesTotal: z.number().int().nonnegative(),
  threadsTotal: z.number().int().nonnegative(),
  historyId: z.string(),
})

export type GmailProfile = z.infer<typeof gmailProfileSchema>
