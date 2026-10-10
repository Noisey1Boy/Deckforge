import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

export const runtime = 'nodejs'

/** POST /api/auth/logout — destroys the session row + cookie. */
export async function POST() {
  try {
    await destroySession()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/auth/logout failed', err)
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 })
  }
}
