import type { AppSnapshot, RemoteSyncResult } from '@/types/sync'

const ENDPOINT = '/.netlify/functions/app-data'

export const remoteSyncService = {
  async pull(): Promise<RemoteSyncResult> {
    const response = await fetch(ENDPOINT, {
      method: 'GET',
      headers: { accept: 'application/json' },
      credentials: 'include'
    })

    if (!response.ok) return { ok: false, message: `Remote pull failed: ${response.status}` }

    return (await response.json()) as RemoteSyncResult
  },

  async push(snapshot: AppSnapshot): Promise<RemoteSyncResult> {
    const response = await fetch(ENDPOINT, {
      method: 'PUT',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(snapshot)
    })

    if (!response.ok) return { ok: false, message: `Remote push failed: ${response.status}` }

    return (await response.json()) as RemoteSyncResult
  }
}
