import type { AppSnapshot, RemoteSyncResult } from '@/types/sync'

const ENDPOINT = '/.netlify/functions/app-data'

const parseResult = async (response: Response): Promise<RemoteSyncResult> => {
  const payload = (await response.json().catch(() => null)) as RemoteSyncResult | null
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      revisionId: payload?.revisionId ?? null,
      message: payload?.message ?? `Remote sync failed: ${response.status}`
    }
  }

  return payload
    ? { ...payload, status: response.status }
    : { ok: false, status: response.status, message: 'Remote sync returned an empty response.' }
}

export const remoteSyncService = {
  async pull(): Promise<RemoteSyncResult> {
    const response = await fetch(ENDPOINT, {
      method: 'GET',
      headers: { accept: 'application/json' },
      credentials: 'include'
    })

    return parseResult(response)
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

    return parseResult(response)
  }
}
