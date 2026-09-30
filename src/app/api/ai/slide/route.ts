import { NextRequest, NextResponse } from 'next/server';
import { extractJson, getZAI, rateLimit, sanitizeLines, sanitizeText, clientKey } from '@/lib/ai/helpers';
import type { Slide } from '@/lib/deck/types';

export const maxDuration = 60;

const ACTIONS = {
  rewrite: 'Rewrite the slide copy to be sharper and more specific. Keep the same layout, same language, and all factual content.',
  shorten: 'Condense the copy: same meaning, noticeably fewer words. Keep the same layout and language.',
  expand: 'Enrich the copy with one concrete detail or example per element (no invented statistics). Keep the same layout and language.',
  regenerate: 'Regenerate the slide copy from scratch with a fresh angle on the same brief. Keep the same layout and language.',
  add_chart: 'Add a small chart: pick the best chart kind for this content and provide 3-6 plausible illustrative data points clearly marked as illustrative. Return "chart" plus a one-line "insight".',
} as const;

type Action = keyof typeof ACTIONS;

export async function POST(req: NextRequest) {
  if (!rateLimit(`slideai:${clientKey(req)}`, 40, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — slow down a little.' }, { status: 429 });
  }
  try {
    const body = (await req.json()) as { action: Action; slide: Slide; context?: string; language?: string };
    const action = body.action;
    if (!action || !(action in ACTIONS)) {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    const slide = body.slide;
    if (!slide || typeof slide !== 'object') {
      return NextResponse.json({ error: 'Slide payload is required' }, { status: 400 });
    }
    const context = sanitizeText(body.context, 600);
    const language = sanitizeText(body.language, 40) || 'English';

    const zai = await getZAI();
    const system = `You are an expert presentation copy editor. ${ACTIONS[action]} Respond with STRICT JSON only, no markdown or HTML anywhere.`;

    const user = `Slide JSON:
${JSON.stringify(slide, null, 1)}

${context ? `Extra context from the user: ${context}` : ''}
Language: ${language}

Return a JSON object with ONLY the fields you changed, using the same field names (title, subtitle, body, bullets, quote, attribution, notes, chart, leftTitle, leftContent, rightTitle, rightContent). Character limits: title<=70, subtitle<=110, body<=160, bullets<=6x90.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: system },
        { role: 'user', content: user },
      ],
      thinking: { type: 'disabled' },
    });
    const raw = completion.choices[0]?.message?.content ?? '';
    const patch = extractJson<Record<string, unknown>>(raw);

    // sanitize patch before applying
    const clean: Record<string, unknown> = {};
    if (typeof patch.title === 'string') clean.title = sanitizeText(patch.title, 70);
    if (typeof patch.subtitle === 'string') clean.subtitle = sanitizeText(patch.subtitle, 110);
    if (typeof patch.body === 'string') clean.body = sanitizeText(patch.body, 160);
    if (Array.isArray(patch.bullets)) clean.bullets = sanitizeLines(patch.bullets, 6, 90);
    if (typeof patch.quote === 'string') clean.quote = sanitizeText(patch.quote, 240);
    if (typeof patch.attribution === 'string') clean.attribution = sanitizeText(patch.attribution, 80);
    if (typeof patch.notes === 'string') clean.notes = sanitizeText(patch.notes, 700);
    if (typeof patch.leftTitle === 'string') clean.leftTitle = sanitizeText(patch.leftTitle, 50);
    if (typeof patch.leftContent === 'string' || Array.isArray(patch.leftContent))
      clean.leftContent = sanitizeLines(patch.leftContent, 4, 90);
    if (typeof patch.rightTitle === 'string') clean.rightTitle = sanitizeText(patch.rightTitle, 50);
    if (typeof patch.rightContent === 'string' || Array.isArray(patch.rightContent))
      clean.rightContent = sanitizeLines(patch.rightContent, 4, 90);

    return NextResponse.json({ patch: clean });
  } catch (err) {
    console.error('ai/slide failed', err);
    return NextResponse.json({ error: 'The AI could not update this slide. Please retry.' }, { status: 500 });
  }
}
