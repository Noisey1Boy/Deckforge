# Product

## Register

product

## Platform

web

## Users

Founders, engineers, marketers, and educators who need to create polished HTML presentations fast. Primary audience: startup founders raising rounds (pitch decks) and engineers giving tech talks (conference slides). Secondary: product marketers launching products and teachers building course modules. Their context: they have a brief — a topic, some bullet points, maybe a rough outline — and need a deck that looks designed, not templated, in under a minute.

## Product Purpose

Decksmith turns a text brief into a polished HTML presentation. It uses a 3-stage concurrent AI pipeline: Stage 1 generates a structured outline (titles, layouts, content markdown) in ~5s; Stage 2 fires per-slide HTML generation calls in batches of 3 (~3-5s each); Stage 3 assembles the slides into a complete deck. Users pick from 57 templates across 5 presentation frameworks (open-design, reveal.js, impress.js, shower, dzslides), preview slide-by-slide in the browser, present fullscreen with speaker notes, and export to PPTX, PDF, or standalone HTML. Success = a deck that looks like a designer made it, ready to present, in under 30 seconds.

## Positioning

The only AI presentation generator that writes free-form HTML — not JSON-into-templates — across 5 presentation frameworks, giving each deck creative freedom and distinct visual identity instead of the same templated look.

## Brand Personality

Athletic, editorial, absolute. Three words: precise, bold, restrained. The brand voice is confident and direct — no hedging, no decoration, no "we're excited to." It borrows Nike's design philosophy: photography speaks, chrome doesn't. Pure black, pure white, a single soft gray, pill geometry. Every chromatic moment is reserved for content or signal, never decorative chrome. The interface should feel like a professional tool that respects the user's time — fast, clear, no friction.

## Anti-references

- **Generic SaaS**: purple-to-blue gradients, Inter-for-everything, cards nested in cards, rounded-square icon tiles above every heading, glassmorphism-as-default.
- **Template-locked generators** (Gamma, Presenton): every deck looks the same because the LLM fills JSON slots into fixed React components — no creative freedom, no layout invention.
- **PowerPoint**: dense, clip-art-laden, bullet-point-heavy corporate slide aesthetic with no typographic hierarchy.
- **Notion-style minimal**: overly flat, gray-on-white, no editorial energy or typographic contrast.

## Design Principles

1. **Photography speaks, chrome doesn't.** The content (slides, templates, generated decks) is the hero. The UI chrome is neutral, restrained, and invisible when it's working. No decorative gradients, no soft shadows, no accent colors used for "tone."

2. **Free-form over template-locked.** The AI writes real HTML, not JSON-into-slots. This means each deck can invent layouts, vary density, and surprise — the opposite of every-slide-looks-the-same generators. Preserve this creative freedom in every UI decision.

3. **Speed is a feature.** The 3-stage concurrent pipeline exists because waiting 2 minutes for a deck is unacceptable. Every UI interaction should feel equally fast: instant feedback, no blocking spinners, progressive disclosure of results.

4. **Multi-framework is the moat.** 5 presentation frameworks (open-design, reveal.js, impress.js, shower, dzslides) is the differentiation. Never hide or flatten this — celebrate the framework choice as a creative decision, not a technical detail.

5. **Skill-encoded quality.** The AI system prompt encodes rules from 4 skill repos (impeccable, ui-ux-pro-max, ponytail, claude-skills). The UI should match that same quality bar — every pixel should pass the same design rules the AI enforces on its own output.

## Accessibility & Inclusion

- WCAG AA minimum (4.5:1 body text contrast, 3:1 large text contrast)
- 44px minimum touch targets on all interactive elements
- `prefers-reduced-motion: reduce` must disable all non-essential animation
- Keyboard navigation for all slide preview, presentation mode, and export actions
- Speaker notes accessible via keyboard (N key) in presentation mode
