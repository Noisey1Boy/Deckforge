import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, hashPassword, verifyPassword } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * POST /api/auth/password — REQUIRES a session.
 * body {current, next}: verifies the current password, then rotates the hash.
 */
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as {
      current?: unknown
      next?: unknown
    }
    const current = typeof body.current === 'string' ? body.current : ''
    const next = typeof body.next === 'string' ? body.next : ''

    if (!current || !next) {
      return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 })
    }
    if (next.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: sessionUser.id } })
    if (!user || !verifyPassword(current, user.passwordHash)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(next) },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/auth/password failed', err)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
