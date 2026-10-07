# Decksmith

AI HTML to Presentation Generator — turn any text into a polished HTML presentation.

## Features

- **57 templates** across **5 presentation frameworks**: open-design, reveal.js, impress.js, shower, dzslides
- **3-stage concurrent AI pipeline**: outline → per-slide HTML generation → assembled deck (~20s total)
- **5 skill-encoded system prompt**: impeccable + ui-ux-pro-max + ponytail + claude-skills rules
- **Cohere design system**: Space Grotesk display + Inter UI + JetBrains Mono labels, deep-green feature bands, pill CTAs
- **Export**: PPTX (pptxgenjs + html-to-image), PDF (print CSS), standalone HTML
- **Presentation mode**: fullscreen, auto-hiding chrome, speaker notes, keyboard nav

## Tech Stack

- Next.js 16 (App Router, standalone output)
- TypeScript 5 + Tailwind CSS 4 + shadcn/ui
- Framer Motion (animations)
- Zustand (state management)
- z-ai-web-dev-sdk (AI codegen)
- pptxgenjs + html-to-image (PPTX export)
- Inter + Space Grotesk + JetBrains Mono (Google Fonts)

## Local Development

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select this repository
3. Railway auto-detects Next.js via `nixpacks.toml`
4. Set environment variables (see below)
5. Deploy — you get a `https://your-app.up.railway.app` URL

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ZAI_API_KEY` | Yes | Z.ai API key for AI generation |
| `DATABASE_URL` | No | SQLite path (defaults to local file) |
| `PORT` | No | Railway sets this automatically |
| `NODE_ENV` | No | Set to `production` by Railway |

### Build & Start Commands

- **Build:** `bun run build` (Next.js standalone + copies `public/` and `.next/static/`)
- **Start:** `node .next/standalone/server.js` (runs the standalone Next.js server)

### Railway Configuration

The app includes:
- `railway.json` — Railway deployment config (NIXPACKS builder, restart policy)
- `nixpacks.toml` — Build pipeline (Node.js 20 + Bun, install, build, start)
- `Procfile` — Fallback start command
- `next.config.ts` — `output: "standalone"` for optimized production builds

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/templates` | GET | List all 57 templates |
| `/api/template-content?id=...` | GET | Get raw template HTML |
| `/api/generate-outline` | POST | Stage 1: Generate slide outline (JSON) |
| `/api/generate-slide` | POST | Stage 2: Generate one slide's HTML |
| `/api/generate` | POST | Legacy: Full deck in one call |

## Template Frameworks

| Framework | Templates | Slide Structure |
|---|---|---|
| open-design | 45 | `<section class="slide">` inside `<div class="deck">` |
| reveal.js | 7 | `<section>` inside `<div class="reveal"><div class="slides">` |
| impress.js | 2 | `<div class="step">` inside `<div id="impress">` |
| shower | 2 | `<section class="slide">` inside `<body class="shower">` |
| dzslides | 1 | Plain `<section>` with `[aria-selected]` |
