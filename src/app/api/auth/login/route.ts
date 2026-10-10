import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, verifyPassword } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * POST /api/auth/login — body {email, password}.
 * On success starts a session (cookie) and returns {user}.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: unknown
      password?: unknown
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
    }

    await createSession(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (err) {
    console.error('POST /api/auth/login failed', err)
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 })
  }
}
