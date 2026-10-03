# DeckForge AI — Design Analysis (Phase 0)

Sources analyzed (cloned 2026-10, shallow): `nexu-io/open-design` @ `53231d4`,
`VoltAgent/awesome-design-md` @ `f696123` (74 DESIGN.md files).
Canvas contract: **1280×720 (16:9)**, every slide reads tokens only — zero
hardcoded colors/fonts/radii in slide components.

---

## 1. open-design analysis

The repo is a monorepo ("collaborative design agent workspace"). Three assets
matter for a 16:9 slide template system:

### 1a. `design-templates/html-ppt/` — the flagship slide system (ADOPT)
Architecture is exactly what DeckForge needs — **one token file = one look,
one layout file = one page type, one class = one animation**:

- `assets/base.css` — reset + shared `:root` tokens (bg/surface/border/text-1..3,
  accent-1..3, good/warn/bad, grad, radius sm/base/lg, shadow/lg, font
  sans/serif/mono/display, letter-spacing, ease) + layout primitives
  (`.stack`, `.grid .g2/.g3/.g4`, `.card` variants, `.pill`, deck header/footer,
  progress bar, notes/overview/presenter chrome) + print rules.
- `assets/themes/*.css` — **36 themes, each a single `:root` override file**
  (corporate-clean, editorial-serif, minimal-white, sharp-mono, neo-brutalism,
  tokyo-night, swiss-grid, memphis-pop, sunset-warm, blueprint …). Themes may
  add a handful of component tweaks below the `:root` block.
- `templates/single-page/*.html` — **31 layout archetypes** with demo data:
  cover, toc, section-divider, bullets, two/three-column, comparison,
  pros-cons, big-quote, stat-highlight, kpi-grid, chart-bar/line/pie/radar,
  table, timeline, roadmap, process-steps, flow-diagram, arch-diagram,
  mindmap, diff, code, terminal, image-hero, image-grid, cta, thanks.
- `assets/animations/` — 27 named entry animations via `data-anim`
  (+20 optional canvas FX; treat FX as opt-in, not part of the token core).
- `runtime.js` — keyboard nav, overview, speaker-notes drawer, presenter popup.

**Adopt as-is:** base.css token vocabulary, theme-as-one-`:root`-override
pattern, the 31 layout archetypes (port to React components), data-anim
naming, presenter/notes UX model.
**Adapt:** strip zh-CN demo content; re-base slide padding 72/96px →
`--space-*` tokens; swap 100vw/vh deck for a fixed 1280×720 stage with
transform-scale fit; replace CDN webfonts with `next/font` (self-hosted).

### 1b. `html-ppt-zhangzara-*` + `html-ppt-pitch-deck` (ADAPT → theme metadata)
~30 single-look deck templates, each with a `template.json` describing:
`slug, tagline, mood[], occasion[], tone[], formality, density, palette
{bg, primary, text, text_muted}, typography {display, body, style}, scheme
(light/dark), best_for, avoid_for, slide_count`. Adopt this schema as our
**theme manifest** — it powers "AI picks the right look" (tone → theme)
and becomes the LLM-facing documentation of each theme.

### 1c. `design-systems/_schema/` (ADAPT → token governance)
`tokens.schema.ts` defines a 4-layer contract we borrow:
- **A1-identity** (required, no default): `--bg, --fg, --accent`, font stacks.
- **A1-structure** (required, per-theme): type scale, grid, section rhythm.
- **A2** (required-with-fallback): states, mono stack, spacing scale,
  radii, shadows — fallbacks live in `_schema/defaults.css`; every theme file
  must still declare all of them (agents paste one `:root`; a missing `var()`
  target silently breaks CSS).
- **B-slot** (optional, alias to A1/A2 via `var()`); **C-extension** allowed
  only via allowlist (promote C→B when ≥2 themes need it).
Lesson: DeckForge's theme compiler should **validate that every theme declares
the full required set** at build time (fallback inject + warning, never silent).

### Mapping to our template system
| DeckForge concept | open-design source |
|---|---|
| Theme (`themes/<name>.css`) | `assets/themes/*.css` (36) |
| Theme manifest (tone/palette/type) | zhangzara `template.json` |
| Slide component library | `templates/single-page/` (31 archetypes) |
| Token core | `base.css :root` + A1/A2/B-slot layering |
| Motion tokens | `animations.css` (`data-anim`, `--ease`) |
| Chart components | `chart-bar/line/pie/radar.html` (token-driven) |

---

## 2. awesome-design-md curation

DESIGN.md = plain-text design system (structured YAML: colors, typography,
spacing, components, motion) that AI agents read directly. Selection criteria:
**(a)** tone coverage — one per planned theme; **(b)** token completeness —
full `colors:` + `typography:` blocks (8/8 qualify); **(c)** presentation
suitability — display type + large color fields translate to 16:9; **(d)**
contrast — ink/canvas pairs meet WCAG AA at slide sizes.

| # | DESIGN.md | Our theme | Tone | Palette & type one-liner |
|---|---|---|---|---|
| 1 | **stripe** | corporate-clean | Corporate, trustworthy | Navy ink `#0d253d` + electric indigo `#533afd` on white; Sohne-class thin display w/ −1.4px tracking, tabular numerics for money slides |
| 2 | **vercel** | minimal-mono | Minimal, precise | Pure `#171717` on `#ffffff` + `#ebebeb` hairlines, blue link only; Geist + Geist Mono — Swiss restraint, huge whitespace |
| 3 | **theverge** | bold-impact | Bold / brutalist media | `#131313` canvas, jelly mint `#3cffd0` + ultraviolet `#5200ff`, 107px Manuka 900 headlines; PolySans + PolySans Mono uppercase kickers |
| 4 | **nintendo-2001** | playful-pop | Playful, retro-Y2K | Nintendo red `#e60012` + orange/amber on periwinkle chrome `#7a8aba`; Arial Black display, beveled panels, thick outlines |
| 5 | **linear.app** | dark-elegant | Dark, quietly luxurious | `#010102` canvas, `#f7f8f8` ink, single lavender accent `#5e6ad2`; custom sans @500–700 negative tracking, hairline charcoal panels |
| 6 | **wired** | editorial-serif | Editorial magazine | B/W `#000`/`#fff` with serif display (WiredDisplay/Times) + Helvetica Neue body; red accent used as slash-mark punctuation |
| 7 | **raycast** | tech-modern | Modern dev-tool | Near-black `#07080a`, elevated `#121212` cards, sky `#57c1ff` + red-pink gradient accents; Inter, subtle glass borders |
| 8 | **starbucks** | warm-earth | Warm, human, organic | House green `#1E3932` + accent `#00754A` on cream canvas; SoDoSans, 12px-radius cards, illustrated/watercolor imagery |

Bench alternates: `nike` (bold-impact alt: Helvetica Now + #111, pure athletic
typography), `notion` (corporate-clean alt: friendly white + full accent set),
`spotify` (dark-elegant alt: content-first charcoal `#121212` + green `#1ed760`).

---

## 3. Token schema (every theme MUST define all of it)

Single source of truth: `tokens.json` (machine) → compiled to
`themes/<name>.css` `:root` block. Slide components consume CSS variables
only. **Lint rule: no raw hex/font-family/px-radius inside slide components.**

```jsonc
{
  "meta":   { "name": "corporate-clean", "tone": ["corporate","trustworthy"],
              "scheme": "light", "formality": "medium-high", "density": "medium",
              "bestFor": "...", "avoidFor": "..." },
  "colors": {
    "bg": "#ffffff", "bgSoft": "#f5f7fa", "surface": "#ffffff", "surface2": "#f0f3f7",
    "border": "rgba(10,37,64,.12)", "borderStrong": "rgba(10,37,64,.28)",
    "text1": "#0a2540", "text2": "#425466", "text3": "#8898aa",
    "accent": "#0a2540", "accent2": "#1d4ed8", "accentSoft": "color-mix(in srgb, var(--accent) 12%, transparent)",
    "good": "#0e9f6e", "warn": "#d97706", "bad": "#dc2626",
    "chart": ["#1d4ed8","#0e9f6e","#d97706","#dc2626","#7c3aed","#0891b2"]  // 6 categorical, AA on bg
  },
  "fonts":  { "display": "'Inter','Noto Sans SC',sans-serif",
              "body": "'Inter','Noto Sans SC',sans-serif",
              "mono": "'JetBrains Mono',ui-monospace,monospace" },
  "typeScale": { "display": "72px/1.05 -0.03em 800", "h2": "48px/1.1 -0.02em 700",
              "h3": "32px/1.2 600", "h4": "22px/1.3 600", "body": "17px/1.6 400",
              "small": "14px/1.5", "eyebrow": "12px/1 0.14em uppercase 500" },
  "spacing":{ "base": 4, "scale": [4,8,12,16,24,32,48,64,96], "slidePad": [64,88] },
  "radii":  { "sm": "4px", "md": "8px", "lg": "16px", "pill": "999px" },
  "shadows":{ "sm": "0 1px 3px rgba(10,37,64,.08)", "lg": "0 16px 40px rgba(10,37,64,.08)" },
  "motion": { "ease": "cubic-bezier(.4,0,.2,1)", "durFast": "150ms", "dur": "300ms",
              "durSlow": "500ms", "entry": "fade-up", "stagger": "60ms",
              "reducedMotion": "disable non-essential" }
}
```

Rules (enforced by a token-coverage test at build time):
1. Every theme declares **all** tokens above — no partial `:root` (open-design
   A2 lesson: a missing var target silently drops the CSS declaration).
2. Type scale tuned to 1280×720: display 64–72, body 16–18, min 12; slide pad
   64–88px vertical / 80–96px horizontal (base.css uses 72/96 at 16:9).
3. Chart palette: exactly 6 categorical colors + required AA contrast on both
   `--bg` and `--surface`; charts read `var(--chart-1..6)` only.
4. Motion is tokenized too: components never hardcode durations/easings;
   `prefers-reduced-motion` collapses entries to opacity.
5. Theme = tokens + (optionally) a small layer of component tweaks; new shared
   needs go into base components first, then get promoted into the token set.

---

## 4. Installed skills summary

All under `/home/z/my-project/skills/` (verify: `ls skills/*/SKILL.md`).

1. **`claude-skills/`** (Jeffallan/claude-skills, MIT) — curated pack:
   `architecture-designer` + `code-reviewer`, plus a router SKILL.md.
   *Apply:* ADRs for big decisions (render pipeline, token compiler);
   structured prioritized review (correctness → security → smells) before any
   merge; explicit trade-off evaluation over "vibes".
2. **`ponytail/`** (DietrichGebert/ponytail, MIT) — "laziest solution that
   works": ladder of YAGNI → reuse-in-repo → stdlib → platform → installed-dep
   → one-liner → minimum code; deletion over addition; mark deliberate
   ceilings with `ponytail:` comments; never skip validation/security/a11y.
   *Apply:* no speculative theme features; one layout primitive set reused by
   all 31 archetypes; shortest working diff per slide component.
3. **`impeccable/`** (pbakaus/impeccable, Apache-2.0) — design polish engine:
   24 commands (craft/audit/critique/polish/typeset/layout/animate/distill),
   bounded verify passes (build → one batched screenshot inspection → fix →
   confirm → stop), modes Persuade/Operate/Read/Experience per surface,
   "brief wins" over taste, anti-generic-slop rules (no default Inter-everything,
   no purple-blue gradients, no card-in-card).
   *Apply:* run polish/audit passes on generated decks; each slide mode
   (pitch=Persuade, report=Operate) gets its own direction; bounded QA loops
   in the render pipeline.
4. **`ui-ux-pro-max/`** (nextlevelbuilder/ui-ux-pro-max-skill) — **already
   installed, verified upstream** (searchable CSVs: palettes, typography,
   ux-guidelines, charts + `design_system.py` token generator).
   *Apply:* triage → deliverable order (concept → UX flow → tokens → plan);
   always cover empty/loading/error + keyboard/focus/contrast; use its charts
   data for deck chart components.

Working stack for DeckForge: **ui-ux-pro-max** (decide) → **claude-skills**
(architecture + review) → **ponytail** (keep it minimal) → **impeccable**
(polish pass) — in that order per feature.
