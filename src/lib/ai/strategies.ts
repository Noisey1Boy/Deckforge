/**
 * Narrative intelligence for the DeckForge pipeline.
 *
 * Ported from decksmith's presentation prompt assets (10 deck strategies, 5
 * copywriting formulas, content bans, quality floors, pacing rules, tone and
 * verbosity dials) and adapted to DeckForge's structured outline + slide
 * pipeline instead of HTML codegen.
 *
 * This module is pure data + pure functions: it is imported by both client
 * components (select options) and server routes (prompt building).
 */

import type { LayoutId } from '@/lib/deck/types';

// ---------------------------------------------------------------------------
// Deck strategies
// ---------------------------------------------------------------------------

export const STRATEGY_IDS = [
  'yc-seed',
  'kawasaki-10',
  'series-a',
  'sales-pitch',
  'duarte-sparkline',
  'qbr',
  'report-weekly',
  'educational',
  'manifesto',
  'demo-day',
] as const;

export type StrategyId = (typeof STRATEGY_IDS)[number];

export interface Strategy {
  id: StrategyId;
  /** Short display name for UI selects. */
  name: string;
  description: string;
  /** Typical deck length the arc is designed for. */
  slideRange: [number, number];
  /** Ordered slide intents of the narrative arc. */
  sectionArc: string[];
  /** Human-readable emotional journey. */
  emotionArc: string;
  /** Keywords used by auto-detection. */
  bestFor: string[];
}

export const STRATEGIES: readonly Strategy[] = [
  {
    id: 'yc-seed',
    name: 'YC Seed Pitch',
    description:
      'Classic seed-round arc: cover, problem, solution, traction, market, product, team, model, ask.',
    slideRange: [10, 12],
    sectionArc: ['cover', 'problem', 'solution', 'traction', 'market', 'product', 'team', 'model', 'ask', 'thanks'],
    emotionArc: 'curiosity → frustration → hope → confidence → trust → urgency',
    bestFor: ['seed pitch', 'investor', 'fundraising', 'pre-seed', 'venture capital'],
  },
  {
    id: 'kawasaki-10',
    name: 'Kawasaki 10/20/30',
    description:
      'Guy Kawasaki\'s 10/20/30 rule: 10 slides, 20 minutes, no font soup. The reliable default.',
    slideRange: [10, 10],
    sectionArc: ['cover', 'problem', 'solution', 'model', 'magic', 'go-to-market', 'competition', 'team', 'milestones', 'ask'],
    emotionArc: 'steady, informed optimism from first to last slide',
    bestFor: ['general pitch', 'business overview', 'startup story', 'default deck'],
  },
  {
    id: 'series-a',
    name: 'Series A Round',
    description:
      'Adds detailed traction, unit economics, competitive moat, go-to-market and financials on top of the seed arc.',
    slideRange: [12, 15],
    sectionArc: ['cover', 'problem', 'solution', 'traction', 'market', 'competition', 'product', 'model', 'metrics', 'go-to-market', 'team', 'ask'],
    emotionArc: 'credibility → momentum → command of the numbers → conviction',
    bestFor: ['series a', 'series b', 'growth round', 'board deck', 'unit economics'],
  },
  {
    id: 'sales-pitch',
    name: 'Sales Pitch',
    description:
      'PAS structure with case studies, pricing and a clear call to action, built to close a deal.',
    slideRange: [8, 10],
    sectionArc: ['cover', 'problem', 'agitate', 'solution', 'case-study', 'case-study', 'pricing', 'proof', 'cta'],
    emotionArc: 'empathy → tension → relief → desire → urgency',
    bestFor: ['sales', 'client proposal', 'prospects', 'deal', 'rfp'],
  },
  {
    id: 'duarte-sparkline',
    name: 'Duarte Sparkline',
    description:
      'Nancy Duarte\'s pattern break: alternate "what is" (pain) with "what could be" (hope), ending on the blissful future.',
    slideRange: [8, 14],
    sectionArc: ['cover', 'pain', 'hope', 'pain', 'hope', 'solution', 'proof', 'cta'],
    emotionArc: 'oscillation between what is and what could be, resolving on bliss',
    bestFor: ['keynote', 'vision talk', 'storytelling', 'inspiration', 'conference talk'],
  },
  {
    id: 'qbr',
    name: 'Quarterly Review',
    description:
      'Quarterly business review: KPIs, wins and misses, blockers, and the next-quarter plan.',
    slideRange: [8, 10],
    sectionArc: ['cover', 'kpi', 'wins', 'misses', 'blockers', 'plan', 'thanks'],
    emotionArc: 'accountability → honesty → focus → resolve',
    bestFor: ['quarterly review', 'qbr', 'business review', 'board update', 'quarter'],
  },
  {
    id: 'report-weekly',
    name: 'Weekly Report',
    description:
      'Tight weekly rhythm: KPI snapshot, what shipped, blockers, and next week\'s plan.',
    slideRange: [6, 8],
    sectionArc: ['cover', 'kpi', 'ship-list', 'blockers', 'plan', 'thanks'],
    emotionArc: 'clarity → momentum → focus',
    bestFor: ['weekly report', 'standup', 'weekly update', 'sprint review', 'team sync'],
  },
  {
    id: 'educational',
    name: 'Teach & Workshop',
    description:
      'Learning arc: hook, objectives, concepts, worked examples, practice, summary and resources.',
    slideRange: [8, 12],
    sectionArc: ['cover', 'hook', 'objectives', 'concept', 'example', 'exercise', 'summary', 'thanks'],
    emotionArc: 'curiosity → clarity → practice → mastery',
    bestFor: ['teaching', 'course', 'workshop', 'tutorial', 'training', 'lecture', 'class'],
  },
  {
    id: 'manifesto',
    name: 'Manifesto',
    description:
      'Bold editorial statement: thesis, three pillars, one call to action. Few slides, loud voice.',
    slideRange: [5, 8],
    sectionArc: ['cover', 'thesis', 'pillar', 'pillar', 'pillar', 'cta'],
    emotionArc: 'provocation → conviction → belonging → resolve',
    bestFor: ['manifesto', 'mission', 'values', 'culture', 'brand story'],
  },
  {
    id: 'demo-day',
    name: 'Demo Day',
    description:
      'Ultra-tight 5-minute arc: cover, problem, solution, traction, team, ask. No filler.',
    slideRange: [5, 7],
    sectionArc: ['cover', 'problem', 'solution', 'traction', 'team', 'ask'],
    emotionArc: 'hook → tension → delight → trust → urgency',
    bestFor: ['demo day', 'accelerator', 'launch event', 'five minute pitch'],
  },
] as const;

export const STRATEGY_MAP: Record<StrategyId, Strategy> = Object.fromEntries(
  STRATEGIES.map((s) => [s.id, s])
) as Record<StrategyId, Strategy>;

/** Strategy used when nothing matches and the user left the dial on Auto. */
export const DEFAULT_STRATEGY: StrategyId = 'kawasaki-10';

/** Short names for UI selects, in presentation order (Auto first is the UI's job). */
export const STRATEGY_OPTIONS = STRATEGIES.map((s) => ({ id: s.id, name: s.name }));

export function isStrategyId(v: unknown): v is StrategyId {
  return typeof v === 'string' && (STRATEGY_IDS as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Auto-detection: keyword scoring over the brief
// ---------------------------------------------------------------------------

/**
 * Rules in tie-break priority order (most specific first). Bare substrings,
 * matched against the lowercased brief; count of hits is the score.
 */
const DETECT_RULES: Array<{ id: StrategyId; keywords: string[] }> = [
  { id: 'demo-day', keywords: ['demo day', 'demo-day', 'accelerator', 'launch event', 'five minute pitch', '5 minute pitch'] },
  { id: 'series-a', keywords: ['series a', 'series b', 'series-a', 'series-b', 'funding round', 'next round', 'round of funding', 'unit economics', 'runway', 'burn rate'] },
  { id: 'manifesto', keywords: ['manifesto', 'mission', 'our values', 'company values', 'philosophy', 'why we exist', 'what we believe', 'culture'] },
  { id: 'qbr', keywords: ['qbr', 'quarterly business review', 'quarterly review', 'quarterly', 'board meeting', 'q1 ', 'q2 ', 'q3 ', 'q4 ', 'quarter'] },
  { id: 'report-weekly', keywords: ['weekly', 'standup', 'week in review', 'status report', 'status update', 'sprint review', 'this week', 'weekly sync', 'weekly report'] },
  { id: 'educational', keywords: ['teach', 'teaching', 'course', 'workshop', 'tutorial', 'lesson', 'training', 'lecture', 'students', 'class', 'learning objectives', 'bootcamp', 'how to', 'beginner', '101', 'educate', 'school'] },
  { id: 'sales-pitch', keywords: ['sales', 'client', 'proposal', 'prospect', 'rfp', 'close the deal', 'pricing', 'sell', 'buyer', 'purchase', 'customers'] },
  { id: 'yc-seed', keywords: ['invest', 'investor', 'fundrais', 'seed', 'venture', ' vc ', 'vc-backed', 'angel', 'capital', 'pitch deck', 'pitch'] },
  { id: 'duarte-sparkline', keywords: ['keynote', 'vision', 'story', 'storytelling', 'inspire', 'inspiring', 'journey', 'the future', 'big idea', 'motivational', 'talk'] },
];

/**
 * Detect a narrative strategy from the brief. Returns 'auto' when no keyword
 * matches (the caller should then apply DEFAULT_STRATEGY).
 */
export function detectStrategy(brief: string): StrategyId | 'auto' {
  const text = ` ${brief.toLowerCase()} `;
  let bestId: StrategyId | null = null;
  let bestScore = 0;
  for (const rule of DETECT_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = rule.id;
    }
  }
  return bestId ?? 'auto';
}

/**
 * Resolve to a concrete strategy: an explicit valid id wins; otherwise score
 * the brief; otherwise fall back to the default.
 */
export function resolveStrategy(explicit: string | undefined, brief: string): StrategyId {
  if (explicit && isStrategyId(explicit)) return explicit;
  const detected = detectStrategy(brief);
  return detected === 'auto' ? DEFAULT_STRATEGY : detected;
}

/** Suggested DeckForge layout for an arc intent (outline-stage hint only). */
const INTENT_LAYOUT: Record<string, LayoutId> = {
  cover: 'title',
  hook: 'quote',
  problem: 'bullets',
  pain: 'bullets',
  agitate: 'bullets',
  solution: 'two-column',
  product: 'two-column',
  demo: 'image',
  traction: 'stats',
  market: 'stats',
  metrics: 'stats',
  kpi: 'stats',
  model: 'two-column',
  pricing: 'two-column',
  magic: 'diagram',
  'go-to-market': 'bullets',
  competition: 'comparison',
  'case-study': 'two-column',
  proof: 'quote',
  team: 'two-column',
  milestones: 'bullets',
  ask: 'stats',
  thanks: 'closing',
  cta: 'closing',
  wins: 'bullets',
  misses: 'bullets',
  blockers: 'bullets',
  plan: 'bullets',
  'ship-list': 'bullets',
  objectives: 'bullets',
  concept: 'bullets',
  example: 'two-column',
  exercise: 'bullets',
  summary: 'bullets',
  resources: 'bullets',
  thesis: 'quote',
  pillar: 'bullets',
  hope: 'quote',
};

export function intentLayout(intent: string): LayoutId {
  return INTENT_LAYOUT[intent] ?? 'bullets';
}

// ---------------------------------------------------------------------------
// Copywriting formulas
// ---------------------------------------------------------------------------

export type CopyFormulaId = 'PAS' | 'AIDA' | 'FAB' | 'BAB' | 'COI';

const FORMULA_LINES: Record<CopyFormulaId, string> = {
  PAS: 'Problem-Agitate-Solve: name the pain plainly, make its cost vivid, then land the answer.',
  AIDA: 'Attention-Interest-Desire-Action: grab attention, build interest, spark desire, end with one clear action.',
  FAB: 'Features-Advantages-Benefits: for each point say what it is, why it beats the alternative, what the audience gains.',
  BAB: 'Before-After-Bridge: paint today\'s pain, the better after-state, then the bridge that gets there.',
  COI: 'Cost of Inaction: quantify or dramatize what doing nothing costs, then make acting now feel urgent.',
};

/** Layout (or arc intent) → formula. Problem-style keys use PAS, and so on. */
export const COPY_FORMULAS: Record<string, CopyFormulaId> = {
  // by DeckForge layout
  title: 'AIDA',
  section: 'AIDA',
  closing: 'AIDA',
  quote: 'AIDA',
  bullets: 'PAS',
  image: 'PAS',
  stats: 'FAB',
  chart: 'FAB',
  diagram: 'FAB',
  'two-column': 'BAB',
  comparison: 'BAB',
  // by arc intent
  problem: 'PAS',
  pain: 'PAS',
  agitate: 'PAS',
  traction: 'FAB',
  market: 'FAB',
  metrics: 'FAB',
  kpi: 'FAB',
  model: 'FAB',
  pricing: 'FAB',
  product: 'FAB',
  'go-to-market': 'BAB',
  'case-study': 'BAB',
  competition: 'BAB',
  milestones: 'BAB',
  ask: 'COI',
  risk: 'COI',
  urgency: 'COI',
  blockers: 'COI',
  cta: 'COI',
};

export function formulaFor(key: string): CopyFormulaId {
  return COPY_FORMULAS[key] ?? 'FAB';
}

/** One-line copy instruction for the slide prompt, keyed by layout or intent. */
export function formulaGuidance(layout: string): string {
  return `${formulaFor(layout)} — ${FORMULA_LINES[formulaFor(layout)]}`;
}

/** Compact prompt block listing all five formulas (outline-stage guidance). */
export const FORMULAS_PROMPT_BLOCK = `COPYWRITING FORMULAS (write each slide's copy through the formula that fits its role — problem slides use PAS, title/closing use AIDA, feature and number slides use FAB, before/after slides use BAB, risk/urgency slides use COI):
${(Object.keys(FORMULA_LINES) as CopyFormulaId[]).map((f) => `- ${f}: ${FORMULA_LINES[f]}`).join('\n')}`.trim();

// ---------------------------------------------------------------------------
// Content bans, quality floors, pacing (prompt blocks)
// ---------------------------------------------------------------------------

export const CONTENT_BANS = `CONTENT BANS (absolute — if a line you wrote matches one, rewrite it):
- No bullet repeated across slides: every slide's points must be new information, never a reshuffle of the previous slide.
- No eyebrow/kicker label on every slide — use them sparingly, only where hierarchy genuinely needs it.
- No "01", "02" section numbering stamped on every slide.
- Never invent numbers, percentages or statistics: if the brief supplies no figure, write qualitative language instead.
- No filler ("In this presentation we will...", "Lorem ipsum", "Thank you for your attention" mid-deck).
- No emoji, no markdown, no HTML anywhere in slide fields.`.trim();

export const QUALITY_FLOORS = `QUALITY FLOORS (minimum bar for every slide):
- Titles are punchy and specific, at most 60 characters, and never generic ("Introduction", "Overview", "About us").
- One idea per bullet, roughly 40-90 characters; a bullet that needs two sentences becomes two bullets.
- Split, don't crowd: when content will not fit the layout, split it across two slides instead of shrinking type.
- Every slide must earn its place — merge or rewrite any slide that repeats what a neighbor already said.
- Prefer concrete nouns and strong verbs over adjectives; name names, cite specifics from the brief.`.trim();

export const PACING_RULES = `PACING RULES:
- Slide 1 is always the title/cover; slide 2 opens the story (the problem or a section opener); the last slide is the closing/CTA.
- Never use the same layout three times in a row — alternate bullets, stats, two-column, quote and visual layouts.
- Vary density: follow a dense slide with a light one (a quote, a stat, or a section divider).
- In decks longer than 10 slides, place a section divider at the major turns of the arc (roughly every 5-7 slides).`.trim();

// ---------------------------------------------------------------------------
// Tone (6 enums)
// ---------------------------------------------------------------------------

export const TONE_IDS = ['professional', 'casual', 'funny', 'educational', 'sales-pitch', 'inspiring'] as const;
export type ToneId = (typeof TONE_IDS)[number];

export interface ToneOption {
  id: ToneId;
  label: string;
  /** One-line prompt directive. */
  directive: string;
}

export const TONE_OPTIONS: readonly ToneOption[] = [
  { id: 'professional', label: 'Professional', directive: 'Professional, confident, precise — boardroom credible.' },
  { id: 'casual', label: 'Casual', directive: 'Casual and conversational — plain words, short sentences, human.' },
  { id: 'funny', label: 'Funny', directive: 'Light and witty — dry humor and playful analogies, never joke-heavy.' },
  { id: 'educational', label: 'Educational', directive: 'Educational — explain step by step, define terms, use concrete examples.' },
  { id: 'sales-pitch', label: 'Sales pitch', directive: 'Persuasive sales energy — benefit-led, urgency-aware, always moving toward the ask.' },
  { id: 'inspiring', label: 'Inspiring', directive: 'Inspiring and visionary — paint the future and end lines with momentum.' },
] as const;

const TONE_MAP: Record<ToneId, ToneOption> = Object.fromEntries(
  TONE_OPTIONS.map((t) => [t.id, t])
) as Record<ToneId, ToneOption>;

/**
 * Map a stored tone value to a ToneId. Exact ids pass through; legacy
 * free-text tones (saved decks) are matched by keyword; anything else is
 * professional.
 */
export function asToneId(v: string | undefined | null): ToneId {
  const s = (v ?? '').toLowerCase().trim();
  if ((TONE_IDS as readonly string[]).includes(s)) return s as ToneId;
  if (/funny|humor|humour|witty|joke/.test(s)) return 'funny';
  if (/casual|friendly|conversational|relaxed|informal/.test(s)) return 'casual';
  if (/sales|persuas|convinc|sell/.test(s)) return 'sales-pitch';
  if (/inspir|vision|motivat|energet/.test(s)) return 'inspiring';
  if (/teach|educat|didact|explain|tutorial/.test(s)) return 'educational';
  return 'professional';
}

/** Prompt directive for a tone value (tolerates legacy free text). */
export function toneDirective(tone: string | undefined | null): string {
  return TONE_MAP[asToneId(tone)].directive;
}

/** UI label for a tone value (tolerates legacy free text). */
export function toneLabel(tone: string | undefined | null): string {
  return TONE_MAP[asToneId(tone)].label;
}

// ---------------------------------------------------------------------------
// Verbosity (3 enums, ~20/40/60 words)
// ---------------------------------------------------------------------------

export const VERBOSITY_IDS = ['concise', 'standard', 'text-heavy'] as const;
export type Verbosity = (typeof VERBOSITY_IDS)[number];

export const VERBOSITY_OPTIONS: ReadonlyArray<{ id: Verbosity; label: string }> = [
  { id: 'concise', label: 'Concise' },
  { id: 'standard', label: 'Standard' },
  { id: 'text-heavy', label: 'Text-heavy' },
] as const;

export function isVerbosity(v: unknown): v is Verbosity {
  return typeof v === 'string' && (VERBOSITY_IDS as readonly string[]).includes(v);
}

export function asVerbosity(v: string | undefined | null): Verbosity {
  return isVerbosity(v) ? v : 'standard';
}

/** Approximate word budget for on-slide text: concise 20, standard 40, text-heavy 60. */
export function verbosityWordTarget(v: string | undefined | null): number {
  switch (asVerbosity(v)) {
    case 'concise':
      return 20;
    case 'text-heavy':
      return 60;
    default:
      return 40;
  }
}

/** Prompt directive describing the density dial. */
export function verbosityDirective(v: string | undefined | null): string {
  switch (asVerbosity(v)) {
    case 'concise':
      return 'Concise: trim to essentials — cut every filler word; short lines only.';
    case 'text-heavy':
      return 'Text-heavy: richer detail is welcome, but stay inside the layout limits — never crowd.';
    default:
      return 'Standard: balanced detail — one clear idea per line.';
  }
}
