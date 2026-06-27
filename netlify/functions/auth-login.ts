import type { Handler } from '@netlify/functions'

import {
  authJson,
  createSession,
  normalizeAuthEmail,
  sessionCookie,
  verifyPassword
} from '../../src/server/auth.js'
import { getReadWritePool } from '../../src/server/database.js'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return authJson(405, { ok: false, message: 'Method not allowed.' })
  }

  const payload = JSON.parse(event.body ?? '{}') as { email?: string; password?: string }
  const email = normalizeAuthEmail(payload.email ?? '')
  const password = payload.password ?? ''
  const client = await getReadWritePool().connect()

  try {
    const { rows } = await client.query<{
      id: string
      email: string
      display_name: string
      password_hash: string
    }>('select id, email, display_name, password_hash from app_users where lower(email) = $1', [
      email
    ])

    const user = rows[0]
    if (!user?.password_hash || !verifyPassword(password, user.password_hash)) {
      return authJson(401, { ok: false, message: 'Identifiants incorrects.' })
    }

    const session = await createSession(client, user.id)
    return authJson(
      200,
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name
        }
      },
      sessionCookie(session.token, session.expiresAt)
    )
  } finally {
    client.release()
  }
}
