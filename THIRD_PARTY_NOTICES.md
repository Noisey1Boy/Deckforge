# Third-party notices

DeckForge AI bundles and builds on the following open-source projects. Each
entry lists what is bundled, where it comes from, and its license. This file is
best-effort — verify against each upstream repository before any commercial
redistribution.

## Bundled presentation frameworks (`public/frameworks/`, `public/revealjs/`)

| Project | Bundled as | Source | License |
| --- | --- | --- | --- |
| Reveal.js 5.x | `public/revealjs/dist/` | https://github.com/hakimel/reveal.js | MIT |
| impress.js | `public/frameworks/impressjs/` | https://github.com/impress/impress.js | MIT (GPLv2+ option per upstream) |
| Shower (core + ribbon/material themes) | `public/frameworks/shower/` | https://github.com/shower/shower | MIT |
| DZSlides | `public/frameworks/dzslides/` | https://github.com/paulrouget/dzslides | MIT / public-domain-style per upstream |

Shower theme fonts (`public/frameworks/shower/themes/fonts/`) ship with their
own `LICENSE.txt` / `COPYRIGHT.txt` files (PT Sans, PT Mono — PT OFL-style
license; Roboto — Apache 2.0). Those files are kept intact next to the fonts.

## Template system

The token-based template system in `public/templates/` is original to
DeckForge, distilled from open design systems (curated during development from
publicly published design guidelines). Theme tokens reference visual systems
but contain no upstream source code. Google Fonts referenced by
`src/app/layout.tsx` are loaded from the Google Fonts CDN and governed by the
Google Fonts terms / individual font licenses (mostly OFL).

## Key npm dependencies (license at `node_modules/<pkg>/LICENSE`)

- Next.js, React, Prisma, Radix UI, Tailwind CSS, framer-motion, lucide-react,
  shadcn/ui-derived components (`src/components/ui/` — MIT, ISC, or Apache 2.0)
- SheetJS Community Edition (`xlsx`, installed from the official SheetJS CDN
  release 0.20.3) — Apache 2.0
- pptxgenjs — MIT
- reveal.js / impress.js / shower / dzslides — see table above

## Not included

The `upload/` scratch area used during development (including a third-party
reference application) is git-ignored and is not part of this repository.
