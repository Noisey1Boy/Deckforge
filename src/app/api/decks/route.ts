import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Deck, DeckMeta, DeckOutline, Slide } from '@/lib/deck/types';
import { getTheme } from '@/lib/design/themes';

/** GET /api/decks — list recent decks (metadata only). */
export async function GET() {
  try {
    const decks = await db.deck.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 24,
    });
    return NextResponse.json({
      decks: decks.map((d) => ({
        id: d.id,
        title: d.title,
        subtitle: d.subtitle,
        themeId: d.themeId,
        slideCount: JSON.parse(d.slidesJson || '[]').length,
        updatedAt: d.updatedAt,
      })),
    });
  } catch (err) {
    console.error('GET /api/decks failed', err);
    return NextResponse.json({ error: 'Failed to list decks' }, { status: 500 });
  }
}

/** POST /api/decks — create a deck. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Deck>;
    const slides: Slide[] = Array.isArray(body.slides) ? body.slides : [];
    if (!body.title || typeof body.title !== 'string' || body.title.length > 200) {
      return NextResponse.json({ error: 'A deck title (<=200 chars) is required' }, { status: 400 });
    }
    if (slides.length > 60) {
      return NextResponse.json({ error: 'Decks are limited to 60 slides' }, { status: 400 });
    }
    const themeId = getTheme(body.themeId).id;
    const created = await db.deck.create({
      data: {
        title: body.title.slice(0, 200),
        subtitle: body.subtitle?.slice(0, 300) ?? null,
        themeId,
        slidesJson: JSON.stringify(slides),
        metaJson: JSON.stringify((body.meta ?? {}) as DeckMeta),
      },
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/decks failed', err);
    return NextResponse.json({ error: 'Failed to create deck' }, { status: 500 });
  }
}
