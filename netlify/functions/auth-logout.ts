import type { Handler } from '@netlify/functions'

import {
  authJson,
  clearSessionCookie,
  hashSessionToken,
  readSessionToken
} from '../../src/server/auth.js'
import { getReadWritePool } from '../../src/server/database.js'

export const handler: Handler = async (event) => {
  const token = readSessionToken(event)
  if (token) {
    await getReadWritePool().query('delete from user_sessions where token_hash = $1', [
      hashSessionToken(token)
    ])
  }

  return authJson(200, { ok: true }, clearSessionCookie())
}
