import type { StateTree } from 'pinia'

export interface AppSnapshot {
  version: number
  exportedAt: string
  stores: Record<string, StateTree>
}

export interface RemoteSyncResult {
  ok: boolean
  message?: string
  snapshot?: AppSnapshot
  savedAt?: string
}
