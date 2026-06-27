import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { HandlerEvent } from '@netlify/functions'
import type { Pool, PoolClient } from 'pg'

import type { AuthUser } from '../types/auth.js'
import { getReadOnlyPool } from './database.js'

const COOKIE_NAME = 'gd_session'
const SESSION_DAYS = 30
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>()

const normalizeEmail = (email: string) => email.trim().toLowerCase()
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export const verifyPassword = (password: string, storedHash: string) => {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

export const createSession = async (client: PoolClient, userId: string) => {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await client.query(
    'insert into user_sessions (user_id, token_hash, expires_at) values ($1, $2, $3)',
    [userId, tokenHash(token), expiresAt]
  )

  return { token, expiresAt }
}

const secureCookie = () => process.env.NETLIFY === 'true' || process.env.URL?.startsWith('https://')

export const sessionCookie = (token: string, expiresAt: Date) =>
  `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secureCookie() ? '; Secure' : ''}`

export const clearSessionCookie = () =>
  `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureCookie() ? '; Secure' : ''}`

export const readSessionToken = (event: HandlerEvent) => {
  const cookieHeader = event.headers.cookie ?? event.headers.Cookie ?? ''
  return cookieHeader
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1)
}

export const getUserFromEvent = async (event: HandlerEvent, pool: Pool = getReadOnlyPool()) => {
  const token = readSessionToken(event)
  if (!token) return null

  const { rows } = await pool.query<{
    id: string
    email: string
    display_name: string
  }>(
    `
      select app_users.id, app_users.email, app_users.display_name
      from user_sessions
      join app_users on app_users.id = user_sessions.user_id
      where user_sessions.token_hash = $1
        and user_sessions.expires_at > now()
      limit 1
    `,
    [tokenHash(token)]
  )

  const user = rows[0]
  if (!user) return null

  return {
    id: user.id,
    email: normalizeEmail(user.email),
    displayName: user.display_name
  } satisfies AuthUser
}

export const requireUser = async (event: HandlerEvent) => {
  const user = await getUserFromEvent(event)
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export const safeJsonParse = <T = Record<string, unknown>>(body?: string | null): T | null => {
  try {
    const value = JSON.parse(body ?? '{}') as unknown
    return value && typeof value === 'object' ? (value as T) : null
  } catch {
    return null
  }
}

export const isValidAuthEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isStrongPassword = (password: string) =>
  password.length >= 8 && /[a-z]/i.test(password) && /\d/.test(password)

const clientIp = (event: HandlerEvent) =>
  event.headers['x-nf-client-connection-ip'] ??
  event.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
  event.headers['client-ip'] ??
  'unknown'

export const rateLimitKey = (event: HandlerEvent, scope: string, identifier = '') =>
  `${scope}:${clientIp(event)}:${identifier}`

export const consumeRateLimit = (key: string, maxAttempts = 8, windowMs = 15 * 60 * 1000) => {
  const now = Date.now()
  const bucket = rateLimitBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= maxAttempts) return false

  bucket.count += 1
  return true
}

export const authJson = (statusCode: number, body: unknown, cookie?: string) => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
    ...(cookie ? { 'set-cookie': cookie } : {})
  },
  body: JSON.stringify(body)
})

export const normalizeAuthEmail = normalizeEmail
export const hashSessionToken = tokenHash
