import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

/**
 * GET /api/htmldecks/:id/raw — the deck's HTML served as a standalone page.
 * This is the iframe src for the viewer.
 * Guest-owned decks (userId null) stay public; foreign decks look like 404.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const [deck, sessionUser] = await Promise.all([
      db.htmlDeck.findUnique({ where: { id }, select: { html: true, userId: true } }),
      getSessionUser(),
    ])
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    if (deck.userId && deck.userId !== sessionUser?.id) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }
    return new NextResponse(deck.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('GET /api/htmldecks/:id/raw failed', err)
    return NextResponse.json({ error: 'Failed to load deck' }, { status: 500 })
  }
}
