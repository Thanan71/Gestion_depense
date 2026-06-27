import type { Handler } from '@netlify/functions'

import { getReadOnlyPool } from '../../src/server/database.js'

export const handler: Handler = async () => {
  try {
    const { rows } = await getReadOnlyPool().query<{
      expenses_total: string
      income_total: string
      transaction_count: string
    }>(`
      select
        coalesce(sum(amount) filter (where kind = 'expense' and archived = false), 0)::text as expenses_total,
        coalesce(sum(amount) filter (where kind = 'income' and archived = false), 0)::text as income_total,
        count(*)::text as transaction_count
      from transactions
    `)

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, summary: rows[0] })
    }
  } catch {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Unable to load database summary.' })
    }
  }
}
