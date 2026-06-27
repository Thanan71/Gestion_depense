import type { Handler } from '@netlify/functions'
import type { PoolClient } from 'pg'

import {
  authJson,
  consumePersistentRateLimit,
  consumeRateLimit,
  createSession,
  hashPassword,
  isStrongPassword,
  isValidAuthEmail,
  normalizeAuthEmail,
  rateLimitKey,
  safeJsonParse,
  sessionCookie
} from '../../src/server/auth.js'
import { getReadWritePool } from '../../src/server/database.js'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return authJson(405, { ok: false, message: 'Method not allowed.' })
  }

  const payload = safeJsonParse<{
    email?: string
    password?: string
    displayName?: string
  }>(event.body)
  if (!payload) {
    return authJson(400, { ok: false, message: 'JSON invalide.' })
  }

  const email = normalizeAuthEmail(payload.email ?? '')
  const password = payload.password ?? ''
  const displayName = payload.displayName?.trim() || email.split('@')[0] || 'Utilisateur'

  if (!isValidAuthEmail(email) || !isStrongPassword(password)) {
    return authJson(400, {
      ok: false,
      message: 'Email invalide ou mot de passe trop faible.'
    })
  }

  if (!consumeRateLimit(rateLimitKey(event, 'register', email), 5)) {
    return authJson(429, { ok: false, message: 'Trop de tentatives. Réessaie plus tard.' })
  }

  let client: PoolClient | undefined
  try {
    client = await getReadWritePool().connect()
    if (!(await consumePersistentRateLimit(client, rateLimitKey(event, 'register', email), 5))) {
      return authJson(429, { ok: false, message: 'Trop de tentatives. Réessaie plus tard.' })
    }

    await client.query('begin')
    const { rows } = await client.query<{
      id: string
      email: string
      display_name: string
    }>(
      `
        insert into app_users (email, password_hash, display_name)
        values ($1, $2, $3)
        returning id, email, display_name
      `,
      [email, hashPassword(password), displayName]
    )
    const session = await createSession(client, rows[0].id)
    await client.query('commit')

    return authJson(
      200,
      {
        ok: true,
        user: {
          id: rows[0].id,
          email: rows[0].email,
          displayName: rows[0].display_name
        }
      },
      sessionCookie(session.token, session.expiresAt)
    )
  } catch (error) {
    await client?.query('rollback').catch(() => undefined)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return authJson(409, { ok: false, message: 'Un compte existe déjà avec cet email.' })
    }
    console.error('Unable to register user', error)
    return authJson(500, { ok: false, message: 'Inscription impossible.' })
  } finally {
    client?.release()
  }
}
