import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVisitorUser } from '@/lib/auth'
import { HTML_CAP, serializeHtmlDeck } from '@/lib/htmlgen/decks'
import { bodyTooLarge } from '@/lib/ai/helpers'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

/**
 * GET /api/htmldecks/:id — full deck (incl. html).
 * Strictly owner-scoped; foreign decks look like 404.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const [deck, owner] = await Promise.all([
      db.htmlDeck.findUnique({ where: { id } }),
      getVisitorUser(),
    ])
    if (!deck || deck.userId !== owner.id) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }
    return NextResponse.json(serializeHtmlDeck(deck))
  } catch (err) {
    console.error('GET /api/htmldecks/:id failed', err)
    return NextResponse.json({ error: 'Failed to load deck' }, { status: 500 })
  }
}

/** PUT /api/htmldecks/:id — partial update (title?, subtitle?, html?). */
export async function PUT(req: NextRequest, ctx: Ctx) {
  if (bodyTooLarge(req, 4_500_000)) {
    return NextResponse.json({ error: 'Deck payload too large (html cap 1.5 MB + outline).' }, { status: 413 })
  }
  try {
    const { id } = await ctx.params
    const body = (await req.json()) as {
      title?: unknown
      subtitle?: unknown
      html?: unknown
    }

    const data: { title?: string; subtitle?: string; html?: string } = {}
    if (body.title !== undefined) {
      const title = typeof body.title === 'string' ? body.title.trim() : ''
      if (!title || title.length > 200) {
        return NextResponse.json({ error: 'A deck title (<=200 chars) is required' }, { status: 400 })
      }
      data.title = title.slice(0, 200)
    }
    if (body.subtitle !== undefined) {
      if (typeof body.subtitle !== 'string') {
        return NextResponse.json({ error: 'subtitle must be a string' }, { status: 400 })
      }
      data.subtitle = body.subtitle.slice(0, 300)
    }
    if (body.html !== undefined) {
      if (typeof body.html !== 'string' || !body.html) {
        return NextResponse.json({ error: 'html must be a non-empty string' }, { status: 400 })
      }
      if (body.html.length > HTML_CAP) {
        return NextResponse.json({ error: 'Deck html exceeds the 1.5MB cap' }, { status: 413 })
      }
      data.html = body.html
    }

    const [existing, owner] = await Promise.all([
      db.htmlDeck.findUnique({ where: { id }, select: { userId: true } }),
      getVisitorUser(),
    ])
    if (!existing) {
      // Preserve the pre-scoping behavior for missing decks (update threw → 500).
      return NextResponse.json({ error: 'Failed to update deck' }, { status: 500 })
    }
    if (existing.userId !== owner.id) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }

    const updated = await db.htmlDeck.update({ where: { id }, data })
    return NextResponse.json(serializeHtmlDeck(updated))
  } catch (err) {
    console.error('PUT /api/htmldecks/:id failed', err)
    return NextResponse.json({ error: 'Failed to update deck' }, { status: 500 })
  }
}

/** DELETE /api/htmldecks/:id */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const [deck, owner] = await Promise.all([
      db.htmlDeck.findUnique({ where: { id }, select: { userId: true } }),
      getVisitorUser(),
    ])
    if (!deck) {
      // Preserve the pre-scoping behavior for missing decks (delete threw → 500).
      return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 })
    }
    if (deck.userId !== owner.id) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }
    await db.htmlDeck.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 })
  }
}
