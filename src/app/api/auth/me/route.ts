import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export const runtime = 'nodejs'

/** GET /api/auth/me — {user:null} for guests or {user:{id,name,email,createdAt}}. */
export async function GET() {
  try {
    const user = await getSessionUser()
    return NextResponse.json({ user: user ?? null })
  } catch (err) {
    console.error('GET /api/auth/me failed', err)
    return NextResponse.json({ user: null })
  }
}
