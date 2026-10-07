import { NextRequest, NextResponse } from 'next/server';
import { extractJson, getZAI, rateLimit, sanitizeText, clientKey } from '@/lib/ai/helpers';
import { LAYOUT_IDS, type DeckOutline, type LayoutId } from '@/lib/deck/types';
import { LAYOUT_BUDGETS } from '@/lib/deck/limits';
import { THEMES, themeCatalogForPrompt } from '@/lib/design/themes';
import {
  CONTENT_BANS,
  FORMULAS_PROMPT_BLOCK,
  PACING_RULES,
  QUALITY_FLOORS,
  STRATEGY_MAP,
  formulaGuidance,
  intentLayout,
  isStrategyId,
  resolveStrategy,
} from '@/lib/ai/strategies';

export const maxDuration = 120;

interface OutlineReq {
  prompt: string;
  audience?: string;
  tone?: string;
  slideCount?: number;
  language?: string;
  themeChoice?: string; // theme id or 'auto'
  dataContext?: string; // compact summary of uploaded data
  /** Narrative strategy id or 'auto' (keyword-detected from the prompt). */
  strategy?: string;
  /** Copy density: 'concise' | 'standard' | 'text-heavy'. */
  verbosity?: string;
}

const layoutList = LAYOUT_IDS.map((l) => `- "${l}": ${LAYOUT_BUDGETS[l].describe}`).join('\n');

export async function POST(req: NextRequest) {
  if (!rateLimit(`outline:${clientKey(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 });
  }
  try {
    const body = (await req.json()) as OutlineReq;
    const prompt = sanitizeText(body.prompt, 1200);
    if (prompt.length < 3) {
      return NextResponse.json({ error: 'Please describe what the presentation should be about.' }, { status: 400 });
    }
    const slideCount = Math.min(Math.max(Number(body.slideCount) || 10, 4), 30);
    const audience = sanitizeText(body.audience, 120);
    const tone = sanitizeText(body.tone, 120);
    const language = sanitizeText(body.language, 60) || 'English';
    const themeChoice = body.themeChoice === 'auto' ? 'auto' : body.themeChoice || 'auto';
    const dataContext = sanitizeText(body.dataContext, 4000);
    const verbosity = sanitizeText(body.verbosity, 20) || 'standard';

    // Resolve the narrative strategy: explicit id wins, else score the brief,
    // else the default arc.
    const explicitStrategy = body.strategy && body.strategy !== 'auto' && isStrategyId(body.strategy) ? body.strategy : undefined;
    const strategyId = resolveStrategy(explicitStrategy, prompt);
    const strategy = STRATEGY_MAP[strategyId];
    const strategyRationale = explicitStrategy
      ? `You picked ${strategy.name}: ${strategy.description}`
      : `Auto-detected ${strategy.name} from your brief: ${strategy.description}`;
    const arcWithLayouts = strategy.sectionArc
      .map((intent) => `${intent} (${intentLayout(intent)})`)
      .join(' → ');
    const [rangeMin, rangeMax] = strategy.slideRange;
    const outOfRange = slideCount < rangeMin || slideCount > rangeMax;

    const zai = await getZAI();
    const system = `You are a world-class presentation strategist. You design tight, engaging decks where every slide fits one of these layouts:\n${layoutList}\n\n${FORMULAS_PROMPT_BLOCK}\n\nRules:\n- Titles are short and punchy (<=60 chars). Never use generic titles like "Introduction".\n- Start with a "title" slide, end with a "closing" slide.\n- Use "section" dividers to group content when the deck is long.\n- Mix layouts deliberately: bullets for points, stats for numbers, chart/diagram when data or flows help, quote for punch, comparison for options, two-column for splits.\n${dataContext ? '- The user uploaded their own data. Where numbers appear, plan "chart" or "stats" slides and reference the data faithfully — never invent figures.\n' : ''}- Respond with STRICT JSON only, no markdown fences.`;

    const strategyBlock = `NARRATIVE STRATEGY — ${strategy.name} (${strategy.id})
${strategy.description}
Story arc, in order: ${arcWithLayouts}
Emotional arc: ${strategy.emotionArc}
Typical length: ${rangeMin}-${rangeMax} slides (the requested count is ${slideCount}; keep the arc's order, stretch or compress steps to fit).`;

    const user = `Create a ${slideCount}-slide outline.
Topic: ${prompt}
Audience: ${audience || 'general business audience'}
Tone: ${tone || 'professional'}
Density: ${verbosity}
Language: ${language}
${dataContext ? `User data available (use faithfully, do not invent numbers):\n${dataContext}` : ''}

${strategyBlock}

${PACING_RULES}

${CONTENT_BANS}

${QUALITY_FLOORS}

${themeChoice === 'auto' ? `Pick the best theme from this catalog and explain in one short sentence:\n${themeCatalogForPrompt()}` : `Theme was manually chosen (${themeChoice}); do not pick one.`}

JSON shape:
{
  "title": string,            // deck title, <=60 chars
  "subtitle": string,         // one-line deck subtitle, <=110 chars
  ${themeChoice === 'auto' ? `"recommendedThemeId": one of [${THEMES.map((t) => t.id).join(', ')}],\n  "themeRationale": string (<=140 chars),` : ''}
  "slides": [                 // exactly ${slideCount} items, following the story arc
    { "layout": one of [${LAYOUT_IDS.join(', ')}], "title": string, "brief": string }
  ]
}
Each "brief" (<=160 chars) tells the writer exactly what content goes on that slide (key points, numbers, names) and which copy formula to apply.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: system },
        { role: 'user', content: user },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson<DeckOutline & { slides: Array<{ layout: string; title: string; brief: string }> }>(raw);

    if (!parsed?.slides?.length) {
      return NextResponse.json({ error: 'The AI returned an empty outline. Try rephrasing your prompt.' }, { status: 502 });
    }

    const validLayout = (l: unknown): LayoutId =>
      LAYOUT_IDS.includes(l as LayoutId) ? (l as LayoutId) : 'bullets';

    const outline: DeckOutline = {
      title: sanitizeText(parsed.title, 80) || prompt.slice(0, 60),
      subtitle: sanitizeText(parsed.subtitle, 130),
      recommendedThemeId:
        themeChoice === 'auto' && parsed.recommendedThemeId && THEMES.some((t) => t.id === parsed.recommendedThemeId)
          ? parsed.recommendedThemeId
          : undefined,
      themeRationale: sanitizeText(parsed.themeRationale, 160) || undefined,
      slides: parsed.slides.slice(0, 30).map((s) => ({
        layout: validLayout(s.layout),
        title: sanitizeText(s.title, 90),
        brief: sanitizeText(s.brief, 200),
      })),
    };

    // Per-item copy guidance (parallel to outline.slides), derived from each
    // slide's layout — the outline UI and slide prompts consume it.
    const slideGuidance = outline.slides.map((s) => formulaGuidance(s.layout));

    return NextResponse.json({
      outline,
      strategyUsed: strategyId,
      strategyRationale,
      slideGuidance,
      meta: {
        slideRange: strategy.slideRange,
        slideCountInRange: !outOfRange,
        ...(outOfRange
          ? {
              slideRangeHint: `${strategy.name} usually lands at ${rangeMin}-${rangeMax} slides; you asked for ${slideCount}.`,
            }
          : {}),
      },
    });
  } catch (err) {
    console.error('outline generation failed', err);
    return NextResponse.json(
      { error: 'Could not generate the outline. Please try again — the AI may be busy.' },
      { status: 500 }
    );
  }
}
