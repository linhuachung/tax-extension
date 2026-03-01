import type { ScanState } from '../../core/types'

const allowedTransitions: Record<ScanState, ReadonlySet<ScanState>> = {
  idle: new Set(['scanning']),
  scanning: new Set(['completed', 'error']),
  completed: new Set(['idle']),
  error: new Set(['idle']),
}

export const assertValidScanTransition = (from: ScanState, to: ScanState): void => {
  const allowed = allowedTransitions[from]
  if (!allowed.has(to)) {
    throw new Error(`Invalid scan state transition: ${from} -> ${to}`)
  }
}
