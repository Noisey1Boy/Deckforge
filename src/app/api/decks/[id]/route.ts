import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import type { Deck, DeckMeta, Slide } from '@/lib/deck/types';
import { getTheme } from '@/lib/design/themes';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/decks/:id — full deck. Guest-owned decks (userId null) stay public. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const [d, sessionUser] = await Promise.all([
      db.deck.findUnique({ where: { id } }),
      getSessionUser(),
    ]);
    if (!d) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    if (d.userId && d.userId !== sessionUser?.id) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    const deck: Deck = {
      id: d.id,
      title: d.title,
      subtitle: d.subtitle ?? undefined,
      themeId: d.themeId,
      slides: JSON.parse(d.slidesJson || '[]') as Slide[],
      meta: (JSON.parse(d.metaJson || '{}') || {}) as DeckMeta,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
    return NextResponse.json({ deck });
  } catch (err) {
    console.error('GET /api/decks/:id failed', err);
    return NextResponse.json({ error: 'Failed to load deck' }, { status: 500 });
  }
}

/** PUT /api/decks/:id — upsert full deck (autosave). */
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Deck;
    const slides: Slide[] = Array.isArray(body.slides) ? body.slides : [];
    if (!body.title || slides.length > 60) {
      return NextResponse.json({ error: 'Invalid deck payload' }, { status: 400 });
    }
    const [existing, sessionUser] = await Promise.all([
      db.deck.findUnique({ where: { id }, select: { userId: true } }),
      getSessionUser(),
    ]);
    if (existing?.userId && existing.userId !== sessionUser?.id) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    const data = {
      title: body.title.slice(0, 200),
      subtitle: body.subtitle?.slice(0, 300) ?? null,
      themeId: getTheme(body.themeId).id,
      slidesJson: JSON.stringify(slides),
      metaJson: JSON.stringify((body.meta ?? {}) as DeckMeta),
    };
    const saved = await db.deck.upsert({
      where: { id },
      update: data,
      create: { id, ...data, userId: sessionUser?.id ?? null },
    });
    return NextResponse.json({ id: saved.id, updatedAt: saved.updatedAt.toISOString() });
  } catch (err) {
    console.error('PUT /api/decks/:id failed', err);
    return NextResponse.json({ error: 'Failed to save deck' }, { status: 500 });
  }
}

/** DELETE /api/decks/:id */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const [deck, sessionUser] = await Promise.all([
      db.deck.findUnique({ where: { id }, select: { userId: true } }),
      getSessionUser(),
    ]);
    if (!deck) {
      // Preserve the pre-scoping behavior for missing decks (delete threw → 500).
      return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 });
    }
    if (deck.userId && deck.userId !== sessionUser?.id) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    await db.deck.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 });
  }
}
