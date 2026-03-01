import { type AppError, toAppError } from '../../core/errors'
import type { ScanState } from '../../core/types'
import { getScanState, setScanStateInternal } from '../state'
import { assertValidScanTransition } from './scan.state'

export const startScan = (): void => {
  const current = getScanState()
  assertValidScanTransition(current.state, 'scanning')
  setScanStateInternal({ state: 'scanning', lastError: undefined })
}

export const completeScan = (): void => {
  const current = getScanState()
  assertValidScanTransition(current.state, 'completed')
  setScanStateInternal({ state: 'completed', lastError: undefined })
}

export const failScan = (e: unknown): void => {
  const current = getScanState()
  const next: ScanState = 'error'
  assertValidScanTransition(current.state, next)
  const appErr: AppError = toAppError('scan', e)
  setScanStateInternal({ state: next, lastError: appErr })
}
