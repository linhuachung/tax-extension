/** Facade: re-exports from scan orchestrator, state, and progress. */

export { completeScan, failScan, startScan } from './scan/scan.orchestrator'
export { initialScanProgress, type ScanProgress } from './scan/scan.progress'
export { assertValidScanTransition } from './scan/scan.state'
export { getScanState, type ScanStatus } from './state'
