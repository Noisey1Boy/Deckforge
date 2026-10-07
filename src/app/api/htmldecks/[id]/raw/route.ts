import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

/**
 * GET /api/htmldecks/:id/raw — the deck's HTML served as a standalone page.
 * This is the iframe src for the viewer.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const deck = await db.htmlDeck.findUnique({ where: { id }, select: { html: true } })
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
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
