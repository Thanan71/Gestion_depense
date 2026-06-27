import type { Handler } from '@netlify/functions'

import { getReadOnlyPool } from '../../src/server/database.js'

export const handler: Handler = async () => {
  try {
    const { rows } = await getReadOnlyPool().query<{ checked_at: string }>(
      'select now() as checked_at'
    )

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, checkedAt: rows[0]?.checked_at })
    }
  } catch {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Database healthcheck failed.' })
    }
  }
}
