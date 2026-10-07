import { NextRequest, NextResponse } from 'next/server';
import { extractJson, getZAI, rateLimit, sanitizeText, clientKey } from '@/lib/ai/helpers';
import { LAYOUT_IDS, type LayoutId } from '@/lib/deck/types';
import { LAYOUT_BUDGETS } from '@/lib/deck/limits';

export const maxDuration = 60;

/**
 * Regenerate ONE outline item (per-slide regenerate in OutlineView).
 * Mirrors /api/generate/outline's layout vocabulary + char limits, scoped to a
 * single slide so the user can re-roll one row without regenerating the deck.
 */

const ACTIONS = {
  regenerate:
    'Regenerate this single outline item from scratch with a fresh angle on its brief. Keep the same layout and its role in the deck flow.',
} as const;

type Action = keyof typeof ACTIONS;

interface OutlineItemReq {
  action: Action;
  outlineItem?: { layout?: string; title?: string; brief?: string };
  deckBrief?: string;
  audience?: string;
  tone?: string;
  themeName?: string;
  language?: string;
  /** 1-based slide position + deck length, so role intent (cover/closing) survives. */
  position?: number;
  total?: number;
}

const layoutList = LAYOUT_IDS.map((l) => `- "${l}": ${LAYOUT_BUDGETS[l].describe}`).join('\n');

const validLayout = (l: unknown): LayoutId =>
  LAYOUT_IDS.includes(l as LayoutId) ? (l as LayoutId) : 'bullets';

export async function POST(req: NextRequest) {
  if (!rateLimit(`outlineitem:${clientKey(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 });
  }
  try {
    const body = (await req.json()) as OutlineItemReq;
    if (!body.action || !(body.action in ACTIONS)) {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    const rawItem = body.outlineItem;
    if (!rawItem || typeof rawItem !== 'object') {
      return NextResponse.json({ error: 'outlineItem is required.' }, { status: 400 });
    }
    const item = {
      layout: validLayout(rawItem.layout),
      title: sanitizeText(rawItem.title, 90),
      brief: sanitizeText(rawItem.brief, 200),
    };
    if (!item.title && !item.brief) {
      return NextResponse.json({ error: 'The outline item has no content to regenerate from.' }, { status: 400 });
    }

    const deckBrief = sanitizeText(body.deckBrief, 1200);
    if (deckBrief.length < 3) {
      return NextResponse.json({ error: 'deckBrief is required.' }, { status: 400 });
    }
    const audience = sanitizeText(body.audience, 120);
    const tone = sanitizeText(body.tone, 120);
    const themeName = sanitizeText(body.themeName, 80);
    const language = sanitizeText(body.language, 60) || 'English';
    const position = Math.max(1, Math.min(Number(body.position) || 1, 60));
    const total = Math.max(position, Math.min(Number(body.total) || position, 60));

    const zai = await getZAI();
    const system = `You are a world-class presentation strategist. You rewrite exactly ONE slide outline item for a deck. Every slide fits one of these layouts:\n${layoutList}\n\nRules:\n- Keep the item's layout and its position role (the first slide stays a cover, the last stays a closing call-to-action, mid-deck slides keep their narrative job).\n- Titles are short and punchy (<=60 chars). Never generic titles like "Introduction" or "Overview".\n- The brief (<=200 chars) tells the writer exactly what content goes on that slide (key points, numbers, names). Concrete beats vague.\n- Respond with STRICT JSON only, no markdown fences.`;

    const user = `Deck: ${deckBrief}
Audience: ${audience || 'general business audience'}
Tone: ${tone || 'professional'}
Language: ${language}${themeName ? `\nDesign system: "${themeName}" (match its personality in word choice)` : ''}

Regenerate this ONE outline item (slide ${position} of ${total}):
${JSON.stringify(item, null, 1)}

Return STRICT JSON:
{ "layout": "${item.layout}", "title": string (<=90 chars), "brief": string (<=200 chars), "rationale": string (one line, <=140 chars, why this angle fits the deck) }`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: system },
        { role: 'user', content: user },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson<{ layout?: string; title?: string; brief?: string; rationale?: string }>(raw);

    const title = sanitizeText(parsed.title, 90);
    const brief = sanitizeText(parsed.brief, 200);
    if (!title || !brief) {
      return NextResponse.json({ error: 'The AI returned an empty slide. Try again.' }, { status: 502 });
    }

    return NextResponse.json({
      item: {
        // layout is fixed server-side: regeneration re-rolls content, the user
        // changes layout via the per-row select if they want a different shape.
        layout: item.layout,
        title,
        brief,
      },
      rationale: sanitizeText(parsed.rationale, 140) || 'Fresh angle on the same brief.',
    });
  } catch (err) {
    console.error('outline-item regeneration failed', err);
    return NextResponse.json(
      { error: 'Could not regenerate this slide. Please try again — the AI may be busy.' },
      { status: 500 }
    );
  }
}
