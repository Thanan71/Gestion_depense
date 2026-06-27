import { afterEach, describe, expect, it, vi } from 'vitest'

import { remoteSyncService } from '@/services/sync/remoteSyncService'
import type { AppSnapshot } from '@/types/sync'

const snapshot: AppSnapshot = {
  version: 2,
  exportedAt: '2026-06-27T12:00:00.000Z',
  baseRevisionId: 'rev-1',
  stores: {}
}

describe('remoteSyncService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps status and revision id on conflicts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          message: 'Conflit',
          revisionId: 'rev-2'
        }),
        { status: 409, headers: { 'content-type': 'application/json' } }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await remoteSyncService.push(snapshot)

    expect(result).toMatchObject({
      ok: false,
      status: 409,
      message: 'Conflit',
      revisionId: 'rev-2'
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/.netlify/functions/app-data',
      expect.objectContaining({ method: 'PUT', credentials: 'include' })
    )
  })
})
