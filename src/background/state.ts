import { createStore } from 'zustand/vanilla'

import { storageLocalGet, storageLocalSet } from '../core/chrome'
import { storageKeys } from '../core/constants'
import type { AppError } from '../core/errors'
import type { ScanState } from '../core/types'
import type { GmailProfile } from '../domain/schemas/gmail'
import {
  type PersistedBackgroundState,
  persistedBackgroundStateSchema,
} from '../domain/schemas/persistedState'
import type { AuthStatus, BackgroundViewState } from '../domain/schemas/state'
import { assertValidScanTransition } from './scan/scan.state'

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

export type ScanStatus = {
  state: ScanState
  lastError?: AppError
}

type BackgroundState = {
  auth: AuthState
  gmail: GmailState
  scan: ScanStatus
}

const initialScanStatus: ScanStatus = { state: 'idle' }

const initialState: BackgroundState = {
  auth: { status: 'signed_out' },
  gmail: {},
  scan: initialScanStatus,
}

const store = createStore<BackgroundState>()(() => ({ ...initialState }))

export const getState = (): BackgroundState => store.getState()

/** Atomic state update: read, compute next, validate, replace in one sync block. No race across async. */
export const updateState = (updater: (prev: BackgroundState) => BackgroundState): void => {
  const prev = store.getState()
  const next = updater(prev)
  if (next.scan !== prev.scan && next.scan.state !== prev.scan.state) {
    assertValidScanTransition(prev.scan.state, next.scan.state)
  }
  store.setState(next)
}

export const setState = (next: BackgroundState): void => {
  updateState(() => next)
}

export const getViewState = (): BackgroundViewState => {
  const s = store.getState()
  return { auth: s.auth, gmail: s.gmail }
}

export const patchAuth = (patch: Partial<AuthState>): void => {
  updateState((s) => ({ ...s, auth: { ...s.auth, ...patch } }))
}

export const patchGmail = (patch: Partial<GmailState>): void => {
  updateState((s) => ({ ...s, gmail: { ...s.gmail, ...patch } }))
}

export const getScanState = (): ScanStatus => store.getState().scan

export const setScanStateInternal = (patch: Partial<ScanStatus>): void => {
  updateState((s) => {
    const nextScan: ScanStatus = { ...s.scan, ...patch }
    if (patch.state !== undefined) assertValidScanTransition(s.scan.state, patch.state)
    return { ...s, scan: nextScan }
  })
}

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

export const hydrateFromStorage = async (): Promise<void> => {
  const raw = await storageLocalGet<unknown>(storageKeys.persistedBackgroundState)
  if (raw === undefined) return

  const persisted = persistedBackgroundStateSchema.parse(raw)
  const persistedStatus = persisted.auth.status

  let status: AuthStatus = 'signed_out'
  if (persistedStatus === 'signed_in') status = 'signed_in'
  else if (persistedStatus === 'error') status = 'error'

  updateState((prev) => ({
    ...prev,
    auth: {
      ...prev.auth,
      status,
      email: persisted.auth.email,
      lastLoginAt: persisted.auth.lastLoginAt,
      lastLogoutAt: persisted.auth.lastLogoutAt,
      lastError: undefined,
    },
    gmail: {
      ...prev.gmail,
      profile: persisted.gmail.profile,
      lastProfileFetchedAt: persisted.gmail.lastProfileFetchedAt,
    },
  }))
}

export const persistToStorage = async (): Promise<void> => {
  const persisted = toPersistedState(getState())
  await storageLocalSet(storageKeys.persistedBackgroundState, persisted)
}
