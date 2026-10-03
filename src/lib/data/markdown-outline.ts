import type { LayoutId, OutlineItem } from '@/lib/deck/types';

// ---------------------------------------------------------------------------
// Markdown paste → deterministic DeckOutline.
// Users keep exact control of structure; no LLM involved in this step.
//
// Supported syntax:
//   # Deck title            (first `#` line → deck title)
//   subtitle: ...           (line directly after the title)
//   ## Slide title [chart]  (each `##` → one slide; optional [layout] tag)
//   @layout: stats          (alternative layout directive line)
//   - bullet                (bullets/numbered lines → the slide brief)
// ---------------------------------------------------------------------------

const VALID_LAYOUTS: LayoutId[] = [
  'title', 'section', 'bullets', 'two-column', 'image', 'quote',
  'stats', 'chart', 'diagram', 'comparison', 'closing',
];

export interface MarkdownOutline {
  title: string;
  subtitle: string;
  slides: OutlineItem[];
}

interface RawSlide {
  title: string;
  layout?: LayoutId;
  lines: string[];
}

function parseLayoutTag(title: string): { title: string; layout?: LayoutId } {
  // "Q3 revenue [chart]" → layout hint in square brackets
  const m = title.match(/\[([a-z-]+)\]\s*$/i);
  if (m) {
    const tag = m[1].toLowerCase() as LayoutId;
    if (VALID_LAYOUTS.includes(tag)) {
      return { title: title.slice(0, m.index).trim(), layout: tag };
    }
  }
  return { title: title.trim() };
}

function looksLikeQuote(line: string): boolean {
  return line.startsWith('>') || /^["“](.+)["”]$/.test(line.trim());
}

/** Heuristic theme suggestion from the pasted text (client-side, deterministic). */
export function suggestThemeId(text: string): string {
  const t = text.toLowerCase();
  const score: Array<[string, number]> = [
    ['corporate-clean', /(revenue|sales|quarterly|investor|stakeholder|kpi|finance|budget|b2b|report|growth|market)/g],
    ['tech-modern', /(product|platform|engineering|api|launch|roadmap|tech|developer|saas|feature|release)/g],
    ['dark-elegant', /(vision|luxury|premium|exclusive|midnight|future|ai|secret|keynote)/g],
    ['playful-pop', /(fun|team|culture|onboarding|party|creative|students|kids|workshop)/g],
    ['editorial-serif', /(story|journey|essay|magazine|annual|review|history|editorial|narrative)/g],
    ['warm-earth', /(sustainability|nature|health|community|environment|organic|care|climate|green)/g],
    ['minimal-mono', /(minimal|spec|summary|docs|technical|reference|checklist|one-pager)/g],
    ['bold-impact', /(revolution|disrupt|bold|manifesto|pitch|why we|change everything|now)/g],
  ];
  let best = 'corporate-clean';
  let bestScore = 0;
  for (const [id, re] of score) {
    const n = (t.match(re) ?? []).length;
    if (n > bestScore) {
      bestScore = n;
      best = id;
    }
  }
  return best;
}

export function parseMarkdownOutline(md: string): MarkdownOutline {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  let title = '';
  let hasExplicitTitle = false;
  let subtitle = '';
  const slides: RawSlide[] = [];
  let current: RawSlide | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('# ') && !line.startsWith('## ')) {
      if (!title) {
        title = line.slice(2).trim();
        hasExplicitTitle = true;
        // allow "subtitle: ..." on the immediately following line
        const next = (lines[i + 1] ?? '').trim();
        if (/^subtitle\s*:/i.test(next)) {
          subtitle = next.replace(/^subtitle\s*:/i, '').trim();
          i++; // consumed
        }
      } else {
        // second H1 → treat as a slide
        if (current) slides.push(current);
        current = { title: line.slice(2).trim(), lines: [] };
      }
      continue;
    }

    if (line.startsWith('## ')) {
      if (current) slides.push(current);
      const parsed = parseLayoutTag(line.slice(3));
      current = { title: parsed.title, layout: parsed.layout, lines: [] };
      continue;
    }

    if (line.startsWith('### ')) {
      // H3 → section break marker slide
      if (current) slides.push(current);
      current = { title: line.slice(4).trim(), layout: 'section', lines: [] };
      continue;
    }

    if (/^@layout\s*:/i.test(line)) {
      const tag = line.replace(/^@layout\s*:/i, '').trim().toLowerCase() as LayoutId;
      if (current && VALID_LAYOUTS.includes(tag)) current.layout = tag;
      continue;
    }

    if (!current) {
      // content before any heading → ignore (or could become title). Ignore.
      continue;
    }
    current.lines.push(line.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, ''));
  }
  if (current) slides.push(current);

  // If no title found, derive from first slide title
  if (!title && slides.length) {
    title = slides[0].title;
  }

  const items: OutlineItem[] = slides
    .filter((s) => s.title.length > 0)
    .slice(0, 40)
    .map((s, idx) => {
      const briefLines = s.lines.filter(Boolean).slice(0, 6).map((l) => l.slice(0, 90));
      const quoteish = s.layout === undefined && briefLines.length === 1 && looksLikeQuote(briefLines[0]);
      let layout: LayoutId = s.layout ?? 'bullets';
      if (!s.layout) {
        if (quoteish) layout = 'quote';
        else if (idx === slides.length - 1 && slides.length > 3 && /thank|questions?|contact|next steps|conclusion/i.test(s.title)) layout = 'closing';
        else if (briefLines.length === 0) layout = 'section';
      }
      return {
        layout,
        title: s.title.slice(0, 70),
        brief: briefLines.length ? briefLines.join(' • ') : `Talk through ${s.title}.`,
      };
    });

  // Give the deck a real cover slide from the H1 title (unless the markdown
  // already marked one) so the first user heading stays content.
  if (hasExplicitTitle && items.length && items[0].layout !== 'title') {
    items.unshift({ layout: 'title', title: title.slice(0, 70), brief: subtitle || 'Introduce the deck.' });
  }

  return {
    title: title.slice(0, 80) || 'Untitled deck',
    subtitle: subtitle.slice(0, 110),
    slides: items.length ? items : [{ layout: 'title', title: title || 'Untitled deck', brief: 'Introduce the topic.' }],
  };
}
