import type { ScanState } from '../core/types'

export type ScanStatus = {
  state: ScanState
  lastError?: unknown
}

// Phase 2 placeholder: scan engine will live here.
export const getInitialScanStatus = (): ScanStatus => ({ state: 'idle' })
