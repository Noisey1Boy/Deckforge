import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVisitorUser } from '@/lib/auth'
import { HTML_CAP, serializeHtmlDeck } from '@/lib/htmlgen/decks'
import { bodyTooLarge } from '@/lib/ai/helpers'

export const runtime = 'nodejs'

/** GET /api/htmldecks — list HTML decks (metadata only, NO html field), scoped to the visitor (session user or per-browser anon owner). */
export async function GET() {
  try {
    const owner = await getVisitorUser()
    const decks = await db.htmlDeck.findMany({
      where: { userId: owner.id },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        subtitle: true,
        templateId: true,
        engine: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return NextResponse.json({
      decks: decks.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('GET /api/htmldecks failed', err)
    return NextResponse.json({ error: 'Failed to list HTML decks' }, { status: 500 })
  }
}

/** POST /api/htmldecks — create an HTML deck. Returns the full deck JSON. */
export async function POST(req: NextRequest) {
  if (bodyTooLarge(req, 4_500_000)) {
    return NextResponse.json({ error: 'Deck payload too large (html cap 1.5 MB + outline).' }, { status: 413 })
  }
  try {
    const body = (await req.json()) as {
      title?: unknown
      subtitle?: unknown
      templateId?: unknown
      engine?: unknown
      html?: unknown
      outlineJson?: unknown
    }

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title || title.length > 200) {
      return NextResponse.json({ error: 'A deck title (<=200 chars) is required' }, { status: 400 })
    }
    const html = typeof body.html === 'string' ? body.html : ''
    if (!html) {
      return NextResponse.json({ error: 'Deck html is required' }, { status: 400 })
    }
    if (html.length > HTML_CAP) {
      return NextResponse.json({ error: 'Deck html exceeds the 1.5MB cap' }, { status: 413 })
    }

    let outlineJson = ''
    if (typeof body.outlineJson === 'string') {
      outlineJson = body.outlineJson.slice(0, 1_000_000)
    } else if (body.outlineJson != null && typeof body.outlineJson === 'object') {
      outlineJson = JSON.stringify(body.outlineJson)
    }

    const templateId =
      typeof body.templateId === 'string' && /^[a-z0-9-]{0,64}$/.test(body.templateId) ? body.templateId : ''
    const engine = typeof body.engine === 'string' && body.engine ? body.engine.slice(0, 32) : 'opendesign'

    const owner = await getVisitorUser()
    const created = await db.htmlDeck.create({
      data: {
        title: title.slice(0, 200),
        subtitle: typeof body.subtitle === 'string' ? body.subtitle.slice(0, 300) : '',
        templateId,
        engine,
        html,
        outlineJson,
        userId: owner.id,
      },
    })
    return NextResponse.json(serializeHtmlDeck(created), { status: 201 })
  } catch (err) {
    console.error('POST /api/htmldecks failed', err)
    return NextResponse.json({ error: 'Failed to create HTML deck' }, { status: 500 })
  }
}
