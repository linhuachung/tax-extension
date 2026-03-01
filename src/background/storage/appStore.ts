import { createStore } from 'zustand/vanilla'

import type { AppError } from '../../shared/schemas/errors'
import type { GmailProfile } from '../../shared/schemas/gmail'
import {
  type PersistedBackgroundState,
  persistedBackgroundStateSchema,
} from '../../shared/schemas/persistedState'
import type { AuthStatus, BackgroundViewState } from '../../shared/schemas/state'
import { storageGet, storageRemove, storageSet } from './chromeStorage'

const persistKey = 'taxintel.persist.v1'

type AuthState = {
  status: AuthStatus
  email?: string
  lastLoginAt?: number
  lastLogoutAt?: number
  lastError?: AppError
}

type GmailState = {
  profile?: GmailProfile
  lastProfileFetchedAt?: number
}

type BackgroundState = {
  auth: AuthState
  gmail: GmailState
}

type BackgroundActions = {
  setAuth: (patch: Partial<AuthState>) => void
  setGmail: (patch: Partial<GmailState>) => void
  reset: () => void
}

const initialState: BackgroundState = {
  auth: { status: 'signed_out' },
  gmail: {},
}

export const backgroundStore = createStore<BackgroundState & BackgroundActions>()((set) => ({
  ...initialState,
  setAuth: (patch: Partial<AuthState>): void =>
    set((s) => ({
      auth: {
        ...s.auth,
        ...patch,
      },
    })),
  setGmail: (patch: Partial<GmailState>): void =>
    set((s) => ({
      gmail: {
        ...s.gmail,
        ...patch,
      },
    })),
  reset: (): void => set(() => ({ ...initialState })),
}))

const toPersistedState = (state: BackgroundState): PersistedBackgroundState => {
  let stableAuthStatus: 'signed_out' | 'signed_in' | 'error' = 'signed_out'
  if (state.auth.status === 'signed_in') stableAuthStatus = 'signed_in'
  else if (state.auth.status === 'error') stableAuthStatus = 'error'

  return persistedBackgroundStateSchema.parse({
    schemaVersion: 1,
    auth: {
      status: stableAuthStatus,
      email: state.auth.email,
      lastLoginAt: state.auth.lastLoginAt,
      lastLogoutAt: state.auth.lastLogoutAt,
    },
    gmail: {
      profile: state.gmail.profile,
      lastProfileFetchedAt: state.gmail.lastProfileFetchedAt,
    },
  })
}

export const getViewState = (): BackgroundViewState => {
  const state = backgroundStore.getState()
  return {
    auth: state.auth,
    gmail: state.gmail,
  }
}

export const hydrateFromStorage = async (): Promise<void> => {
  const raw = await storageGet<unknown>(persistKey)
  const persisted = persistedBackgroundStateSchema.parse(raw)

  const persistedStatus = persisted.auth.status
  let status: AuthStatus = 'signed_out'
  if (persistedStatus === 'signed_in') status = 'signed_in'
  else if (persistedStatus === 'error') status = 'error'

  backgroundStore.setState((s) => ({
    ...s,
    auth: {
      ...s.auth,
      status,
      email: persisted.auth.email,
      lastLoginAt: persisted.auth.lastLoginAt,
      lastLogoutAt: persisted.auth.lastLogoutAt,
      lastError: undefined,
    },
    gmail: {
      ...s.gmail,
      profile: persisted.gmail.profile,
      lastProfileFetchedAt: persisted.gmail.lastProfileFetchedAt,
    },
  }))
}

export const persistToStorage = async (): Promise<void> => {
  const persisted = toPersistedState(backgroundStore.getState())
  await storageSet(persistKey, persisted)
}

export const clearPersistedState = async (): Promise<void> => {
  await storageRemove(persistKey)
}
