import type { Handler } from '@netlify/functions'

import { authJson, getUserFromEvent } from '../../src/server/auth.js'

export const handler: Handler = async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) return authJson(401, { ok: false, message: 'Non authentifié.' })
  return authJson(200, { ok: true, user })
}
