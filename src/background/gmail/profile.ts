import { type GmailProfile, gmailProfileSchema } from '../../shared/schemas/gmail'
import { gmailApiRequest } from './api'

export const fetchGmailProfile = (): Promise<GmailProfile> =>
  gmailApiRequest('/users/me/profile', { method: 'GET' }, gmailProfileSchema)
