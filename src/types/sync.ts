import type { StateTree } from 'pinia'

export interface AppSnapshot {
  version: number
  exportedAt: string
  revisionId?: string | null
  baseRevisionId?: string | null
  allowDestructiveSync?: boolean
  stores: Record<string, StateTree>
}

export interface RemoteSyncResult {
  ok: boolean
  status?: number
  message?: string
  snapshot?: AppSnapshot
  savedAt?: string
  revisionId?: string | null
}
