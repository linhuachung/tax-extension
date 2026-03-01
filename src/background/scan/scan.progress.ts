export type ScanProgress = {
  processed: number
  total?: number
}

export const initialScanProgress = (): ScanProgress => ({ processed: 0 })
