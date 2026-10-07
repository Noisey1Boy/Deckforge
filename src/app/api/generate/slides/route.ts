import { NextRequest, NextResponse } from 'next/server';
import { extractJson, getZAI, rateLimit, sanitizeLines, sanitizeText, clientKey } from '@/lib/ai/helpers';
import type { ChartSpec, DeckOutline, OutlineItem, Slide } from '@/lib/deck/types';
import { LAYOUT_IDS } from '@/lib/deck/types';
import { LAYOUT_BUDGETS } from '@/lib/deck/limits';
import { getTheme } from '@/lib/design/themes';
import {
  CONTENT_BANS,
  DEFAULT_STRATEGY,
  STRATEGY_MAP,
  formulaGuidance,
  isStrategyId,
  toneDirective,
  verbosityDirective,
  verbosityWordTarget,
} from '@/lib/ai/strategies';

export const maxDuration = 300;

interface GenReq {
  outline: DeckOutline;
  audience?: string;
  tone?: string;
  language?: string;
  themeId?: string;
  dataContext?: string;
  /** Narrative strategy id ('auto' is resolved to the default here). */
  strategy?: string;
  /** Copy density: 'concise' | 'standard' | 'text-heavy'. */
  verbosity?: string;
  /** Pre-parsed chart data mapped by outline slide index (from user uploads). */
  chartAssignments?: Record<string, ChartSpec>;
}

function slideJsonTemplate(layout: string): string {
  const base = '"title": string';
  const map: Record<string, string> = {
    title: `${base}, "subtitle": string, "body": optional short paragraph`,
    section: `${base}, "subtitle": optional kicker line`,
    bullets: `${base}, "body": optional lead-in (<=160 chars), "bullets": 3-6 strings (<=90 chars)`,
    'two-column': `${base}, "leftTitle": string, "leftContent": 3-4 strings, "rightTitle": string, "rightContent": 3-4 strings`,
    image: `${base}, "subtitle": short kicker, "body": caption (<=140 chars)`,
    quote: '"quote": the quote (<=220 chars), "attribution": who said it',
    stats: `${base}, "body": optional context, "stats": [{"value": "42%", "label": string, "context": optional}] (2-4 items)`,
    chart: `${base}, "chart": {"kind": "bar|column|line|area|pie|donut", "data": [{"label": string, "value": number}], "unit": optional, "insight": one-line takeaway (<=130 chars), "source": optional}`,
    diagram: `${base}, "body": optional, "diagram": {"direction": "lr|tb", "nodes": [{"id": "a", "label": string, "shape": "box|pill|diamond"}], "edges": [{"from": "a", "to": "b", "label": optional}]}`,
    comparison: `${base}, "comparison": {"headers": [string, string], "rows": [{"label": string, "left": string, "right": string}]} (3-5 rows, values <=80 chars)`,
    closing: `${base}, "subtitle": short CTA chip text, "bullets": up to 3 next-step strings (<=60 chars)`,
  };
  return `{ ${map[layout] ?? map.bullets}, "notes": presenter talking points: 2-4 short sentences (not a verbatim script) plus exactly one delivery cue in square brackets like [pause here], [ask the room] or [point at the chart] }`;
}

function buildSlidePrompt(item: OutlineItem, i: number, total: number, req: GenReq, assignedChart?: ChartSpec): string {
  const budget = LAYOUT_BUDGETS[item.layout];
  const chartLine = assignedChart
    ? `\nThe chart DATA below is fixed — use it EXACTLY as given (do not change, add or invent values); write only title + insight:\n${JSON.stringify(assignedChart)}`
    : item.layout === 'chart'
      ? '\nIMPORTANT: the user supplied NO verified data for a chart here. Do NOT invent numbers and do NOT return a "chart" field. Instead return {"title", "bullets": [3-5 qualitative points], "notes"} — qualitative points only, no statistics.'
      : '';
  const words = verbosityWordTarget(req.verbosity);
  return `Write slide ${i + 1} of ${total}.
Deck: "${req.outline.title}" — ${req.outline.subtitle}
Slide plan: [${item.layout}] "${item.title}" — ${item.brief}
Audience: ${req.audience || 'general business'} | Tone: ${toneDirective(req.tone)} | Language: ${req.language || 'English'}
Density: ${verbosityDirective(req.verbosity)} Target roughly ${words} words of visible on-slide text (char limits below are hard).
Copy formula for this slide: ${formulaGuidance(item.layout)}
Layout budget: ${budget.describe}${chartLine}

Return STRICT JSON only: ${slideJsonTemplate(item.layout)}

Rules: respect char limits exactly (text gets clipped otherwise). Plain text only (no markdown, no HTML). Never invent a number that is not in the slide plan or the fixed chart data. If the content will not fit, cut or split it — never crowd the layout. Speaker notes in the same language.`;
}

function coerceSlide(raw: Record<string, unknown>, item: OutlineItem, id: string, assignedChart?: ChartSpec): Slide {
  const layout = (LAYOUT_IDS.includes(item.layout as never) ? item.layout : 'bullets') as Slide['layout'];
  const b = LAYOUT_BUDGETS[layout];
  const slide: Slide = {
    id,
    layout,
    title: b.title ? sanitizeText(raw.title, b.title) || item.title : undefined,
    subtitle: b.subtitle ? sanitizeText(raw.subtitle, b.subtitle) : undefined,
    body: b.body ? sanitizeText(raw.body, b.body) : undefined,
    bullets: b.bullets.maxCount ? sanitizeLines(raw.bullets, b.bullets.maxCount, b.bullets.maxChars) : undefined,
    notes: sanitizeText(raw.notes, 700),
  };

  if (layout === 'two-column') {
    slide.leftTitle = sanitizeText(raw.leftTitle, 50);
    slide.leftContent = sanitizeLines(raw.leftContent, 4, 90);
    slide.rightTitle = sanitizeText(raw.rightTitle, 50);
    slide.rightContent = sanitizeLines(raw.rightContent, 4, 90);
  }
  if (layout === 'quote') {
    slide.quote = sanitizeText(raw.quote, 240) || item.title;
    slide.attribution = sanitizeText(raw.attribution, 80);
  }
  if (layout === 'stats' && Array.isArray(raw.stats)) {
    slide.stats = (raw.stats as Array<Record<string, unknown>>).slice(0, 4).map((s) => ({
      value: sanitizeText(s.value, 12) || '—',
      label: sanitizeText(s.label, 48),
      context: sanitizeText(s.context, 84) || undefined,
    }));
  }
  if (layout === 'chart') {
    if (assignedChart) {
      slide.chart = { ...assignedChart, insight: sanitizeText(raw.chart && (raw.chart as Record<string, unknown>).insight, 140) || assignedChart.insight };
    } else {
      // No verified user data behind this chart — fall back to qualitative
      // bullets so numbers can never be invented.
      slide.layout = 'bullets';
      const fb = sanitizeLines(raw.bullets, 5, 90);
      slide.bullets = fb.length ? fb : ['Discuss the key qualitative points for this topic.'];
      slide.subtitle = undefined;
      slide.chart = undefined;
    }
  }
  if (layout === 'diagram' && raw.diagram && typeof raw.diagram === 'object') {
    const d = raw.diagram as Record<string, unknown>;
    const nodes = Array.isArray(d.nodes)
      ? (d.nodes as Array<Record<string, unknown>>).slice(0, 7).map((n, i) => ({
          id: sanitizeText(n.id, 8) || `n${i}`,
          label: sanitizeText(n.label, 34) || `Step ${i + 1}`,
          shape: (['box', 'pill', 'diamond'].includes(String(n.shape)) ? n.shape : 'box') as 'box' | 'pill' | 'diamond',
        }))
      : [];
    const ids = new Set(nodes.map((n) => n.id));
    const edges = Array.isArray(d.edges)
      ? (d.edges as Array<Record<string, unknown>>)
          .slice(0, 10)
          .map((e) => ({
            from: sanitizeText(e.from, 8),
            to: sanitizeText(e.to, 8),
            label: sanitizeText(e.label, 20) || undefined,
          }))
          .filter((e) => ids.has(e.from) && ids.has(e.to))
      : [];
    if (nodes.length >= 2) {
      slide.diagram = {
        direction: d.direction === 'tb' ? 'tb' : 'lr',
        nodes,
        edges,
      };
    }
  }
  if (layout === 'comparison' && raw.comparison && typeof raw.comparison === 'object') {
    const c = raw.comparison as Record<string, unknown>;
    const headers = Array.isArray(c.headers) ? (c.headers as unknown[]).slice(0, 2).map((h) => sanitizeText(h, 34)) : [];
    const rows = Array.isArray(c.rows)
      ? (c.rows as Array<Record<string, unknown>>).slice(0, 5).map((r) => ({
          label: sanitizeText(r.label, 36),
          left: sanitizeText(r.left, 84),
          right: sanitizeText(r.right, 84),
        })).filter((r) => r.label)
      : [];
    if (headers.length === 2 && rows.length >= 2) {
      slide.comparison = { headers: [headers[0], headers[1]], rows };
    }
  }
  return slide;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`slides:${clientKey(req)}`, 6, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 });
  }
  let body: GenReq;
  try {
    body = (await req.json()) as GenReq;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const outline = body.outline;
  if (!outline?.slides?.length) {
    return NextResponse.json({ error: 'Outline with slides is required' }, { status: 400 });
  }

  const theme = getTheme(body.themeId ?? outline.recommendedThemeId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true; // client disconnected — keep generating, drop sends
        }
      };
      let zai: Awaited<ReturnType<typeof getZAI>> | null = null;
      try {
        zai = await getZAI();
      } catch (e) {
        send('error', { error: 'AI service unavailable. Please try again shortly.' });
        controller.close();
        return;
      }

      const total = outline.slides.length;
      send('start', { total });

      const strategyId = body.strategy && body.strategy !== 'auto' && isStrategyId(body.strategy) ? body.strategy : DEFAULT_STRATEGY;
      const system = `You are a senior presentation copywriter for the "${theme.name}" design system (${theme.tone} tone), writing a "${STRATEGY_MAP[strategyId].name}" narrative. You write crisp, specific, presentation-grade copy. Never use markdown, bullets characters, emoji, or HTML in field values. Respond with STRICT JSON only.\n\n${CONTENT_BANS}`;

      const generateOne = async (i: number): Promise<Slide> => {
        const item = outline.slides[i];
        const assigned = body.chartAssignments?.[String(i)];
        try {
          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'assistant', content: system },
              { role: 'user', content: buildSlidePrompt(item, i, total, body, assigned) },
            ],
            thinking: { type: 'disabled' },
          });
          const raw = completion.choices[0]?.message?.content ?? '';
          const parsed = extractJson<Record<string, unknown>>(raw);
          const slide = coerceSlide(parsed, item, `s_${Date.now().toString(36)}_${i}_${Math.random().toString(36).slice(2, 6)}`, assigned);
          if (!slide.title && !slide.quote) slide.title = item.title;
          if (slide.layout === 'bullets' && (!slide.bullets || slide.bullets.length === 0)) {
            slide.bullets = [item.brief.slice(0, 90)];
          }
          return slide;
        } catch (err) {
          console.error(`slide ${i} generation failed`, err);
          // resilient placeholder so the deck still completes
          return {
            id: `s_${Date.now().toString(36)}_${i}_err`,
            layout: item.layout === 'title' || item.layout === 'closing' ? item.layout : 'bullets',
            title: item.title,
            body: item.layout === 'title' ? outline.subtitle : undefined,
            bullets: item.layout !== 'title' && item.layout !== 'closing' ? [item.brief.slice(0, 90)] : undefined,
            notes: '(This slide could not be auto-generated — regenerate it from the editor.)',
          };
        }
      };

      // Generate in pairs (2-way concurrency), emit strictly in outline order.
      const CONCURRENCY = 2;
      let nextToEmit = 0;
      let completedCount = 0;
      const results = new Map<number, Slide>();

      const emitReady = () => {
        while (results.has(nextToEmit)) {
          const slide = results.get(nextToEmit)!;
          results.delete(nextToEmit);
          send('slide', { index: nextToEmit, slide });
          completedCount++;
          send('progress', { done: completedCount, total, currentTitle: slide.title ?? '' });
          nextToEmit++;
        }
      };

      let cursor = 0;
      const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, async () => {
        while (true) {
          const myIndex = cursor++;
          if (myIndex >= total) return;
          const slide = await generateOne(myIndex);
          results.set(myIndex, slide);
          emitReady();
        }
      });
      await Promise.all(workers);

      send('done', { ok: true });
      if (!closed) controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
