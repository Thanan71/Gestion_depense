import type { Handler } from '@netlify/functions'

import {
  authJson,
  createSession,
  hashPassword,
  normalizeAuthEmail,
  sessionCookie
} from '../../src/server/auth.js'
import { getReadWritePool } from '../../src/server/database.js'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return authJson(405, { ok: false, message: 'Method not allowed.' })
  }

  const payload = JSON.parse(event.body ?? '{}') as {
    email?: string
    password?: string
    displayName?: string
  }
  const email = normalizeAuthEmail(payload.email ?? '')
  const password = payload.password ?? ''
  const displayName = payload.displayName?.trim() || email.split('@')[0] || 'Utilisateur'

  if (!email.includes('@') || password.length < 8) {
    return authJson(400, {
      ok: false,
      message: 'Email invalide ou mot de passe trop court.'
    })
  }

  const client = await getReadWritePool().connect()
  try {
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
  } catch {
    await client.query('rollback')
    return authJson(409, { ok: false, message: 'Un compte existe déjà avec cet email.' })
  } finally {
    client.release()
  }
}
