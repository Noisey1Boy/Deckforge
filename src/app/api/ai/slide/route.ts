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
  speaker_notes: 'Write presenter speaker notes for this slide: 60-110 words, natural spoken tone, first person. Open with a hook or transition, cover every visual element on the slide in order, add one concrete example or number already present on the slide, and close with a segue to the next topic. Never invent statistics that are not on the slide. Return only a "notes" field.',
} as const;

type Action = keyof typeof ACTIONS;

const COMPOSE_LAYOUTS = ['bullets', 'two-column', 'quote', 'stats', 'section'] as const;

export async function POST(req: NextRequest) {
  if (!rateLimit(`slideai:${clientKey(req)}`, 40, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — slow down a little.' }, { status: 429 });
  }
  try {
    const body = (await req.json()) as {
      action: Action | 'compose_slide';
      slide?: Slide;
      topic?: string;
      context?: string;
      language?: string;
    };
    const action = body.action;
    const context = sanitizeText(body.context, 600);
    const language = sanitizeText(body.language, 40) || 'English';

    // ---------------------------------------------------------- compose_slide
    // Create a brand-new slide from a one-line topic. Layout is picked by the
    // AI from a safe subset (no chart/diagram/image: those need real data or
    // media). Everything is sanitized server-side before it reaches the deck.
    if (action === 'compose_slide') {
      const topic = sanitizeText(body.topic, 140);
      if (!topic) {
        return NextResponse.json({ error: 'Give the slide a topic first.' }, { status: 400 });
      }
      const zai = await getZAI();
      const system = `You are an expert presentation writer. Compose ONE presentation slide from a topic. Respond with STRICT JSON only, no markdown or HTML anywhere.`;
      const user = `Topic: "${topic}"
${context ? `Deck context: ${context}` : ''}
Language: ${language}

Return a JSON object:
{
  "layout": one of ${JSON.stringify(COMPOSE_LAYOUTS)},
  "title": string (<=70 chars, specific and concrete),
  "body": string (<=160 chars, one supporting sentence),
  "bullets": array of 3-5 strings (<=90 chars each) — for layout "bullets" or "two-column" (then also leftTitle/rightTitle + leftContent/rightContent instead of bullets),
  "quote": string (<=240 chars) and "attribution": string (<=80 chars) — only for layout "quote",
  "stats": array of {"value": string (<=12 chars), "label": string (<=48 chars)} (2-4 items) — only for layout "stats" (never invent precise statistics; use round illustrative figures like "3x" or "40%"),
  "notes": string (60-110 words of natural first-person speaker notes)
}
Choose the layout that best serves the topic. Omit fields that do not apply.`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: system },
          { role: 'user', content: user },
        ],
        thinking: { type: 'disabled' },
      });
      const raw = completion.choices[0]?.message?.content ?? '';
      const out = extractJson<Record<string, unknown>>(raw);

      const rawLayout = typeof out.layout === 'string' ? out.layout : 'bullets';
      const layout = (COMPOSE_LAYOUTS as readonly string[]).includes(rawLayout)
        ? rawLayout
        : 'bullets';
      const slide: Record<string, unknown> = {
        layout,
        title: sanitizeText(out.title, 70) || topic.slice(0, 70),
        notes: sanitizeText(out.notes, 700) || undefined,
      };
      if (typeof out.body === 'string' && out.body.trim()) slide.body = sanitizeText(out.body, 160);
      if (Array.isArray(out.bullets) && out.bullets.length) slide.bullets = sanitizeLines(out.bullets, 6, 90);
      if (layout === 'two-column') {
        if (typeof out.leftTitle === 'string') slide.leftTitle = sanitizeText(out.leftTitle, 50);
        if (typeof out.rightTitle === 'string') slide.rightTitle = sanitizeText(out.rightTitle, 50);
        const lc = Array.isArray(out.leftContent) ? sanitizeLines(out.leftContent, 4, 90) : (Array.isArray(out.bullets) ? sanitizeLines(out.bullets, 4, 90) : []);
        const rc = Array.isArray(out.rightContent) ? sanitizeLines(out.rightContent, 4, 90) : [];
        if (lc.length) slide.leftContent = lc;
        if (rc.length) slide.rightContent = rc;
        // two-column needs both sides — fall back to bullets if the AI skipped one
        if (!lc.length || !rc.length) {
          slide.layout = 'bullets';
          if (!slide.bullets && (lc.length || rc.length)) slide.bullets = [...lc, ...rc];
        }
      }
      if (layout === 'quote') {
        const q = sanitizeText(out.quote, 240);
        if (q) {
          slide.quote = q;
          slide.attribution = sanitizeText(out.attribution, 80) || 'Unknown';
          delete slide.body;
          delete slide.bullets;
        } else {
          slide.layout = 'bullets';
        }
      }
      if (slide.layout === 'stats') {
        const stats = Array.isArray(out.stats)
          ? (out.stats as Array<Record<string, unknown>>)
              .slice(0, 4)
              .map((st) => ({
                value: sanitizeText(st?.value, 12),
                label: sanitizeText(st?.label, 48),
              }))
              .filter((st) => st.value && st.label)
          : [];
        if (stats.length >= 2) slide.stats = stats;
        else {
          slide.layout = 'bullets';
          if (!slide.bullets) slide.bullets = stats.map((st) => `${st.value} ${st.label}`);
        }
      }
      if (slide.layout === 'section') {
        slide.body = sanitizeText(out.body, 160) || undefined;
        delete slide.bullets;
      }
      // every layout needs at least a title + one content element
      if (slide.layout === 'bullets' && !Array.isArray(slide.bullets)) {
        slide.bullets = [sanitizeText(out.body, 90) || 'Add your first point'];
      }
      return NextResponse.json({ slide });
    }

    if (!action || !(action in ACTIONS)) {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    const slide = body.slide;
    if (!slide || typeof slide !== 'object') {
      return NextResponse.json({ error: 'Slide payload is required' }, { status: 400 });
    }

    const zai = await getZAI();
    const system = `You are an expert presentation copy editor. ${ACTIONS[action]} Respond with STRICT JSON only, no markdown or HTML anywhere.`;

    const user = `Slide JSON:
${JSON.stringify(slide, null, 1)}

${context ? `Extra context from the user: ${context}` : ''}
Language: ${language}

Return a JSON object with ONLY the fields you changed, using the same field names (title, subtitle, body, bullets, quote, attribution, notes, chart, leftTitle, leftContent, rightTitle, rightContent). Character limits: title<=70, subtitle<=110, body<=160, bullets<=6x90, notes<=700. For the speaker_notes action return only {"notes": "..."}.`;

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
