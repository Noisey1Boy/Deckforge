import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getVisitorUser } from '@/lib/auth';
import { bodyTooLarge } from '@/lib/ai/helpers';
import type { Deck, DeckMeta, DeckOutline, Slide } from '@/lib/deck/types';
import { getTheme } from '@/lib/design/themes';

/** GET /api/decks — list recent decks (metadata only), scoped to the visitor (session user or per-browser anon owner). */
export async function GET() {
  try {
    const owner = await getVisitorUser();
    const decks = await db.deck.findMany({
      where: { userId: owner.id },
      orderBy: { updatedAt: 'desc' },
      take: 24,
    });
    return NextResponse.json({
      decks: decks.map((d) => {
        const slides: Slide[] = (() => {
          try {
            return JSON.parse(d.slidesJson || '[]');
          } catch {
            return [];
          }
        })();
        return {
          id: d.id,
          title: d.title,
          subtitle: d.subtitle,
          themeId: d.themeId,
          meta: (JSON.parse(d.metaJson || '{}') || {}) as DeckMeta,
          slideCount: slides.length,
          // slide titles power client-side content search in the library
          titles: slides
            .map((s) => String(s?.title ?? '').slice(0, 60))
            .filter(Boolean)
            .slice(0, 60),
          updatedAt: d.updatedAt,
        };
      }),
    });
  } catch (err) {
    console.error('GET /api/decks failed', err);
    return NextResponse.json({ error: 'Failed to list decks' }, { status: 500 });
  }
}

/** POST /api/decks — create a deck. */
export async function POST(req: NextRequest) {
  if (bodyTooLarge(req, 8_000_000)) {
    return NextResponse.json({ error: 'Deck payload too large (max 8 MB).' }, { status: 413 });
  }
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
    const owner = await getVisitorUser();
    const created = await db.deck.create({
      data: {
        title: body.title.slice(0, 200),
        subtitle: body.subtitle?.slice(0, 300) ?? null,
        themeId,
        slidesJson: JSON.stringify(slides),
        metaJson: JSON.stringify((body.meta ?? {}) as DeckMeta),
        userId: owner.id,
      },
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/decks failed', err);
    return NextResponse.json({ error: 'Failed to create deck' }, { status: 500 });
  }
}
