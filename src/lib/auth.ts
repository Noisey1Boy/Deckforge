import 'server-only';

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

/**
 * Server-only auth helpers for DeckForge AI.
 *
 * Sessions are opaque random tokens stored as the Session row id; the raw
 * token is also kept in an httpOnly cookie (`df_session`). Passwords are
 * hashed with node:crypto scrypt (16-byte random salt, timing-safe compare).
 */

export const SESSION_COOKIE = 'df_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export type SessionUser = {
  id: string
  name: string
  email: string
  createdAt: string // ISO string — never leak passwordHash
}

/** scryptSync hash with a 16-byte random salt → `salt:hexhash`. */
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(pw, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

/** Timing-safe password verification against a stored `salt:hexhash`. */
export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(pw, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}

/** Create a Session row for the user and set the session cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.session.create({ data: { id: token, userId, expiresAt } })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
  })
}

/**
 * Resolve the current session user from the `df_session` cookie.
 * Returns null for guests, missing/expired sessions. Expired session rows
 * are deleted eagerly. Never leaks passwordHash.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { id: token },
    include: { user: true },
  })
  if (!session) return null

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { id: token } }).catch(() => {})
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    createdAt: session.user.createdAt.toISOString(),
  }
}

/** Delete the Session row and clear the session cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    await db.session.delete({ where: { id: token } }).catch(() => {})
  }
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
  })
}

export const ANON_COOKIE = 'df_anon'
const ANON_TTL_S = 60 * 60 * 24 * 365 // 1 year

/**
 * Resolve the current VISITOR as a deck owner.
 * - Signed-in → the real user.
 * - Guest → a per-browser anonymous User row keyed by an httpOnly `df_anon`
 *   cookie, created on first deck-related API call. Every visitor therefore
 *   owns a PRIVATE deck space — replacing the old shared `userId: null` pool
 *   that any guest could list, edit or delete (P0 audit fix).
 *
 * Route handlers only: cookies() must be mutable to mint the anon cookie.
 * The returned id is the ownership key every deck/htmldeck query filters by.
 */
export async function getVisitorUser(): Promise<SessionUser> {
  const sessionUser = await getSessionUser()
  if (sessionUser) return sessionUser

  const store = await cookies()
  const cookieId = store.get(ANON_COOKIE)?.value
  if (cookieId && /^anon_[a-f0-9]{24}$/.test(cookieId)) {
    const existing = await db.user.findUnique({ where: { id: cookieId } })
    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        createdAt: existing.createdAt.toISOString(),
      }
    }
  }

  const id = `anon_${randomBytes(12).toString('hex')}`
  const guest = await db.user.create({
    data: {
      id,
      name: 'Guest',
      email: `${id}@guest.deckforge.local`,
      passwordHash: '',
      isGuest: true,
    },
  })
  store.set(ANON_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ANON_TTL_S,
  })
  return {
    id: guest.id,
    name: guest.name,
    email: guest.email,
    createdAt: guest.createdAt.toISOString(),
  }
}
