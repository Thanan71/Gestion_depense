import type { Handler } from '@netlify/functions'

import { requireUser } from '../../src/server/auth.js'
import { getReadOnlyPool } from '../../src/server/database.js'

export const handler: Handler = async (event) => {
  try {
    const user = await requireUser(event)
    const { rows } = await getReadOnlyPool().query<{
      expenses_total: string
      income_total: string
      transaction_count: string
    }>(
      `
      select
        coalesce(sum(amount) filter (where kind = 'expense' and archived = false), 0)::text as expenses_total,
        coalesce(sum(amount) filter (where kind = 'income' and archived = false), 0)::text as income_total,
        count(*)::text as transaction_count
      from transactions
      where user_id = $1
    `,
      [user.id]
    )

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, summary: rows[0] })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return {
        statusCode: 401,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Non authentifié.' })
      }
    }
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Unable to load database summary.' })
    }
  }
}
