import type { Handler } from '@netlify/functions'
import type { PoolClient } from 'pg'

import {
  authJson,
  consumeRateLimit,
  createSession,
  isValidAuthEmail,
  normalizeAuthEmail,
  rateLimitKey,
  safeJsonParse,
  sessionCookie,
  verifyPassword
} from '../../src/server/auth.js'
import { getReadWritePool } from '../../src/server/database.js'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return authJson(405, { ok: false, message: 'Method not allowed.' })
  }

  const payload = safeJsonParse<{ email?: string; password?: string }>(event.body)
  if (!payload) {
    return authJson(400, { ok: false, message: 'JSON invalide.' })
  }

  const email = normalizeAuthEmail(payload.email ?? '')
  const password = payload.password ?? ''

  if (!isValidAuthEmail(email) || !password) {
    return authJson(400, { ok: false, message: 'Email ou mot de passe invalide.' })
  }

  if (!consumeRateLimit(rateLimitKey(event, 'login', email), 8)) {
    return authJson(429, { ok: false, message: 'Trop de tentatives. Réessaie plus tard.' })
  }

  let client: PoolClient | undefined

  try {
    client = await getReadWritePool().connect()
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
  } catch (error) {
    console.error('Unable to login user', error)
    return authJson(500, { ok: false, message: 'Connexion impossible.' })
  } finally {
    client?.release()
  }
}
