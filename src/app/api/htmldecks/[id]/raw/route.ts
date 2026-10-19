import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVisitorUser } from '@/lib/auth'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

/**
 * GET /api/htmldecks/:id/raw — the deck's HTML served as a standalone page.
 * This is the iframe src for the viewer.
 * Strictly owner-scoped; foreign decks look like 404.
 *
 * Sandboxed via CSP (P0 audit): `sandbox allow-scripts` WITHOUT allow-same-origin
 * makes the document run from an opaque origin — AI-written deck HTML cannot
 * touch this app's cookies, localStorage or DOM even though it is same-site.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const [deck, owner] = await Promise.all([
      db.htmlDeck.findUnique({ where: { id }, select: { html: true, userId: true } }),
      getVisitorUser(),
    ])
    if (!deck || deck.userId !== owner.id) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }
    return new NextResponse(deck.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy':
          "sandbox allow-scripts allow-popups allow-modals allow-forms allow-downloads; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('GET /api/htmldecks/:id/raw failed', err)
    return NextResponse.json({ error: 'Failed to load deck' }, { status: 500 })
  }
}
