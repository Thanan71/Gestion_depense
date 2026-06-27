import type { Handler } from '@netlify/functions'

import { getReadOnlyPool, getReadWritePool } from '../../src/server/database.js'
import type { AppSnapshot } from '../../src/types/sync.js'

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
})

const isSnapshot = (value: unknown): value is AppSnapshot => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppSnapshot>
  return typeof candidate.version === 'number' && typeof candidate.stores === 'object'
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const { rows } = await getReadOnlyPool().query<{ data: AppSnapshot }>(
        "select data from app_snapshots where id = 'default'"
      )

      return json(200, { ok: true, snapshot: rows[0]?.data ?? null })
    }

    if (event.httpMethod === 'PUT') {
      const snapshot = JSON.parse(event.body ?? 'null') as unknown
      if (!isSnapshot(snapshot))
        return json(400, { ok: false, message: 'Invalid snapshot payload.' })

      await getReadWritePool().query(
        `
          insert into app_snapshots (id, data, updated_at)
          values ('default', $1::jsonb, now())
          on conflict (id)
          do update set data = excluded.data, updated_at = now()
        `,
        [JSON.stringify(snapshot)]
      )

      return json(200, { ok: true, savedAt: new Date().toISOString() })
    }

    return json(405, { ok: false, message: 'Method not allowed.' })
  } catch {
    return json(500, { ok: false, message: 'Unable to sync application data.' })
  }
}
