import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/auth/signup — body {name, email, password}.
 * Creates the user, starts a session (cookie), returns {user}.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: unknown
      email?: unknown
      password?: unknown
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!name || name.length > 60) {
      return NextResponse.json({ error: 'Name must be 1-60 characters' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      )
    }

    const user = await db.user.create({
      data: { name: name.slice(0, 60), email, passwordHash: hashPassword(password) },
    })

    await createSession(user.id)

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        },
      },
      { status: 200 },
    )
  } catch (err) {
    console.error('POST /api/auth/signup failed', err)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
